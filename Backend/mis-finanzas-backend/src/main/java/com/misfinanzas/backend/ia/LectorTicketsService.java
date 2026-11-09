package com.misfinanzas.backend.ia;

import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.common.exception.ServicioExternoException;
import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.ia.model.TipoTicket;
import com.misfinanzas.backend.ia.model.dto.LecturaTicketDTO;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import com.misfinanzas.backend.usuario.model.Usuario;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Lee la foto de un ticket con un modelo de visión de Groq (plan gratuito) y devuelve los datos para el gasto.
// Para gastar los mínimos tokens se manda una sola imagen (ya reducida por la app) y se pide un JSON corto.
@Service
public class LectorTicketsService {

    private static final Logger log = LoggerFactory.getLogger(LectorTicketsService.class);

    private static final int MAXIMO_TOKENS_RESPUESTA = 200;

    private final CategoriaRepository categoriaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final JsonMapper jsonMapper;
    private final MeterRegistry meterRegistry;
    private final RestClient restClient = RestClient.create();

    private final String apiKey;
    private final String url;
    private final String modelo;
    private final String razonamiento;

    public LectorTicketsService(CategoriaRepository categoriaRepository, VehiculoRepository vehiculoRepository, JsonMapper jsonMapper, MeterRegistry meterRegistry,
                                @Value("${app.ia.groq.api-key:}") String apiKey,
                                @Value("${app.ia.groq.url}") String url,
                                @Value("${app.ia.groq.modelo}") String modelo,
                                @Value("${app.ia.groq.razonamiento}") String razonamiento) {

        this.categoriaRepository = categoriaRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.jsonMapper = jsonMapper;
        this.meterRegistry = meterRegistry;
        this.apiKey = apiKey;
        this.url = url;
        this.modelo = modelo;
        this.razonamiento = razonamiento;
    }

    public LecturaTicketDTO leer(MultipartFile imagen, Usuario usuario) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new ServicioExternoException(HttpStatus.SERVICE_UNAVAILABLE, "La lectura de tickets no está configurada (falta la clave de Groq)");
        }

        if (imagen == null || imagen.isEmpty()) {
            throw new IllegalArgumentException("La imagen está vacía");
        }

        List<Categoria> categorias = categoriaRepository.findByUsuarioId(usuario.getId());

        List<Vehiculo> vehiculos = vehiculoRepository.findByUsuario(usuario).stream().filter(Vehiculo::isActivo).toList();

        // Un segundo intento si Groq falla o devuelve un JSON mal formado (pasa de vez en cuando con fotos difíciles).
        // El límite gratuito (429) o la falta de clave no se reintentan.
        ServicioExternoException ultimoFallo = null;

        for (int intento = 1; intento <= 2; intento++) {
            try {
                LecturaTicketDTO lectura = interpretar(llamarGroq(imagen, categorias, !vehiculos.isEmpty()), categorias, vehiculos);

                meterRegistry.counter("misfinanzas.tickets.leidos").increment();

                return lectura;

            } catch (ServicioExternoException e) {

                if (e.getEstado() != HttpStatus.BAD_GATEWAY) {
                    throw e;
                }
                ultimoFallo = e;
            }
        }

        throw ultimoFallo;
    }

    private String llamarGroq(MultipartFile imagen, List<Categoria> categorias, boolean conVehiculos) {

        String tipo = imagen.getContentType() != null && imagen.getContentType().startsWith("image/") ? imagen.getContentType() : "image/jpeg";

        String datosImagen;
        try {
            datosImagen = "data:" + tipo + ";base64," + Base64.getEncoder().encodeToString(imagen.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer la imagen", e);
        }

        String nombresCategorias = categorias.stream().map(Categoria::getNombre).collect(Collectors.joining(", "));

        // Instrucción corta: cada palabra cuenta como token en el plan gratuito
        // Los campos de vehículo solo se piden si el usuario tiene alguno: sin ellos, menos tokens
        String camposVehiculo = conVehiculos
                ? "\"tipo\":\"COMPRA\"|\"REPOSTAJE\"|\"ITV\"|\"ACEITE\"|\"NEUMATICOS\"|\"MANTENIMIENTO\","
                + "\"matricula\":texto,\"litros\":número,\"precioLitro\":número,"
                : "";

        String instruccion = "Ticket de compra. Responde solo JSON: "
                + "{" + camposVehiculo + "\"comercio\":texto,\"fecha\":\"AAAA-MM-DD\",\"total\":número,"
                + "\"pago\":\"TARJETA\"|\"EFECTIVO\"|\"BIZUM\"|null,"
                + "\"categoria\":" + (nombresCategorias.isEmpty() ? "null" : "la más parecida de [" + nombresCategorias + "], siempre una")
                + "}. null si no se ve.";

        Map<String, Object> cuerpo = Map.of(
                "model", modelo,
                "temperature", 0.2,
                "max_completion_tokens", MAXIMO_TOKENS_RESPUESTA,
                "reasoning_effort", razonamiento,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "text", "text", instruccion),
                                Map.of("type", "image_url", "image_url", Map.of("url", datosImagen))
                        )
                ))
        );

        try {
            String json = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonMapper.writeValueAsString(cuerpo))
                    .retrieve()
                    .body(String.class);

            return jsonMapper.readTree(json).path("choices").path(0).path("message").path("content").asString("");

        } catch (RestClientResponseException e) {

            // El detalle de Groq solo va al log (nunca la clave): al cliente, un mensaje claro
            log.warn("Groq respondió {} al leer un ticket: {}", e.getStatusCode().value(), e.getResponseBodyAsString());

            if (e.getStatusCode().value() == 429) {
                throw new ServicioExternoException(HttpStatus.TOO_MANY_REQUESTS, "Has llegado al límite de lecturas gratuitas. Prueba en un rato o rellénalo a mano");
            }
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "No se ha podido leer el ticket. Rellénalo a mano");

        } catch (RestClientException e) {

            log.warn("No se pudo contactar con Groq: {}", e.getMessage());
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "No se ha podido conectar con el lector de tickets");
        }
    }

    // La IA puede equivocarse o dejar campos sin leer: lo que no encaja se queda en null
    private LecturaTicketDTO interpretar(String respuesta, List<Categoria> categorias, List<Vehiculo> vehiculos) {

        JsonNode datos;
        try {
            datos = jsonMapper.readTree(respuesta);
        } catch (RuntimeException e) {
            log.warn("Respuesta de Groq que no es JSON: {}", respuesta);
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "No se ha podido leer el ticket. Rellénalo a mano");
        }

        LecturaTicketDTO lectura = new LecturaTicketDTO();

        String comercio = texto(datos, "comercio");
        if (comercio != null) {
            lectura.setComercio(comercio.length() > 100 ? comercio.substring(0, 100) : comercio);
        }

        String fecha = texto(datos, "fecha");
        if (fecha != null) {
            try {
                LocalDate leida = LocalDate.parse(fecha);
                // Una fecha futura es un error de lectura
                lectura.setFecha(leida.isAfter(LocalDate.now()) ? null : leida);
            } catch (DateTimeParseException e) {
                lectura.setFecha(null);
            }
        }

        JsonNode total = datos.path("total");
        BigDecimal importe = total.isNumber() ? total.decimalValue() : numero(texto(datos, "total"));
        if (importe != null && importe.signum() > 0) {
            lectura.setImporte(importe.setScale(2, java.math.RoundingMode.HALF_UP));
        }

        String pago = texto(datos, "pago");
        if (pago != null) {
            try {
                lectura.setMetodoPago(MetodoPago.valueOf(pago.toUpperCase()));
            } catch (IllegalArgumentException e) {
                lectura.setMetodoPago(null);
            }
        }

        lectura.setCategoriaId(buscarCategoria(texto(datos, "categoria"), categorias));

        if (!vehiculos.isEmpty()) {

            String tipo = texto(datos, "tipo");
            if (tipo != null) {
                try {
                    lectura.setTipo(TipoTicket.valueOf(tipo.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    lectura.setTipo(TipoTicket.COMPRA);
                }
            }

            lectura.setVehiculoId(buscarVehiculo(texto(datos, "matricula"), vehiculos));

            if (lectura.getTipo() == TipoTicket.REPOSTAJE) {
                lectura.setLitros(positivo(datos, "litros", 2));
                lectura.setPrecioLitro(positivo(datos, "precioLitro", 3));
            }
        }

        return lectura;
    }

    // La IA puede devolver el nombre con otras mayúsculas, sin tildes o algo recortado ("Mantenimiento"):
    // se busca primero igual y luego contenido en uno u otro sentido
    private Long buscarCategoria(String nombre, List<Categoria> categorias) {

        if (nombre == null) {
            return null;
        }

        String buscado = normalizar(nombre);

        return categorias.stream()
                .filter(c -> normalizar(c.getNombre()).equals(buscado))
                .findFirst()
                .or(() -> categorias.stream()
                        .filter(c -> normalizar(c.getNombre()).contains(buscado) || buscado.contains(normalizar(c.getNombre())))
                        .findFirst())
                .map(Categoria::getId)
                .orElse(null);
    }

    // La IA a veces cambia de orden o confunde una letra ("2040 CJZ" por "2040 CZJ"): vale si coinciden los
    // números y las mismas letras en cualquier orden. Con una sola coincidencia exacta, esa gana.
    private Long buscarVehiculo(String matricula, List<Vehiculo> vehiculos) {

        if (matricula == null) {
            return null;
        }

        String leida = limpiarMatricula(matricula);

        if (leida.length() < 4) {
            return null;
        }

        return vehiculos.stream()
                .filter(v -> v.getMatricula() != null && limpiarMatricula(v.getMatricula()).equals(leida))
                .findFirst()
                .or(() -> vehiculos.stream()
                        .filter(v -> v.getMatricula() != null && mismaMatriculaDesordenada(limpiarMatricula(v.getMatricula()), leida))
                        .findFirst())
                .map(Vehiculo::getId)
                .orElse(null);
    }

    private String limpiarMatricula(String matricula) {

        return matricula.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private boolean mismaMatriculaDesordenada(String a, String b) {

        String numerosA = a.replaceAll("[^0-9]", "");
        String numerosB = b.replaceAll("[^0-9]", "");

        if (numerosA.isEmpty() || !numerosA.equals(numerosB)) {
            return false;
        }

        char[] letrasA = a.replaceAll("[^A-Z]", "").toCharArray();
        char[] letrasB = b.replaceAll("[^A-Z]", "").toCharArray();

        java.util.Arrays.sort(letrasA);
        java.util.Arrays.sort(letrasB);

        return java.util.Arrays.equals(letrasA, letrasB);
    }

    private BigDecimal positivo(JsonNode datos, String campo, int decimales) {

        JsonNode valor = datos.path(campo);
        BigDecimal numero = valor.isNumber() ? valor.decimalValue() : numero(texto(datos, campo));

        return numero != null && numero.signum() > 0 ? numero.setScale(decimales, java.math.RoundingMode.HALF_UP) : null;
    }

    private String normalizar(String texto) {

        return java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "").trim().toLowerCase();
    }

    private String texto(JsonNode datos, String campo) {

        JsonNode valor = datos.path(campo);

        if (valor.isMissingNode() || valor.isNull()) {
            return null;
        }

        String texto = valor.asString("").trim();

        return texto.isEmpty() || texto.equalsIgnoreCase("null") ? null : texto;
    }

    // "12,50 €" → 12.50
    private BigDecimal numero(String texto) {

        if (texto == null) {
            return null;
        }

        try {
            return new BigDecimal(texto.replaceAll("[^0-9,.-]", "").replace(',', '.'));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
