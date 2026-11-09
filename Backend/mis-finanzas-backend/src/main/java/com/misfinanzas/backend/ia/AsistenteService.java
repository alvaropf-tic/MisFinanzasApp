package com.misfinanzas.backend.ia;

import com.misfinanzas.backend.common.exception.ServicioExternoException;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gastoRecurrente.GastoRecurrenteRepository;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.ia.model.dto.ChatMensajeDTO;
import com.misfinanzas.backend.ia.model.dto.ChatPeticionDTO;
import com.misfinanzas.backend.ia.model.dto.ChatRespuestaDTO;
import com.misfinanzas.backend.ingreso.IngresoRepository;
import com.misfinanzas.backend.ingresoRecurrente.IngresoRecurrenteRepository;
import com.misfinanzas.backend.ingresoRecurrente.model.IngresoRecurrente;
import com.misfinanzas.backend.objetivo.ObjetivoService;
import com.misfinanzas.backend.objetivo.model.dto.ObjetivoResponseDTO;
import com.misfinanzas.backend.presupuesto.PresupuestoRepository;
import com.misfinanzas.backend.usuario.model.Usuario;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// Asistente de chat sobre las finanzas del usuario, con un modelo de texto de Groq (plan gratuito, con su
// propio cupo, distinto del de los tickets). gpt-oss razona y ese razonamiento cuenta en max_completion_tokens,
// por eso el margen. Para gastar pocos tokens no se mandan los movimientos: solo un
// resumen compacto (totales, categorías, recurrentes, objetivos) y los últimos mensajes de la conversación.
@Service
public class AsistenteService {

    private static final Logger log = LoggerFactory.getLogger(AsistenteService.class);

    private static final int MAXIMO_TOKENS_RESPUESTA = 700;
    private static final int MENSAJES_HISTORIAL = 6;
    private static final int LARGO_MENSAJE_HISTORIAL = 600;
    private static final int CATEGORIAS_RESUMEN = 8;

    private final GastoRepository gastoRepository;
    private final IngresoRepository ingresoRepository;
    private final GastoRecurrenteRepository gastoRecurrenteRepository;
    private final IngresoRecurrenteRepository ingresoRecurrenteRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final ObjetivoService objetivoService;
    private final JsonMapper jsonMapper;
    private final MeterRegistry meterRegistry;
    private final RestClient restClient = RestClient.create();

    private final String apiKey;
    private final String url;
    private final String modelo;

    public AsistenteService(GastoRepository gastoRepository, IngresoRepository ingresoRepository,
                            GastoRecurrenteRepository gastoRecurrenteRepository, IngresoRecurrenteRepository ingresoRecurrenteRepository,
                            PresupuestoRepository presupuestoRepository, ObjetivoService objetivoService,
                            JsonMapper jsonMapper, MeterRegistry meterRegistry,
                            @Value("${app.ia.groq.api-key:}") String apiKey,
                            @Value("${app.ia.groq.url}") String url,
                            @Value("${app.ia.groq.modelo-chat}") String modelo) {

        this.gastoRepository = gastoRepository;
        this.ingresoRepository = ingresoRepository;
        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
        this.ingresoRecurrenteRepository = ingresoRecurrenteRepository;
        this.presupuestoRepository = presupuestoRepository;
        this.objetivoService = objetivoService;
        this.jsonMapper = jsonMapper;
        this.meterRegistry = meterRegistry;
        this.apiKey = apiKey;
        this.url = url;
        this.modelo = modelo;
    }

    @Transactional(readOnly = true)
    public ChatRespuestaDTO responder(ChatPeticionDTO peticion, Usuario usuario) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new ServicioExternoException(HttpStatus.SERVICE_UNAVAILABLE, "El asistente no está configurado (falta la clave de Groq)");
        }

        String moneda = peticion.getMoneda() == null || peticion.getMoneda().isBlank() ? "EUR" : peticion.getMoneda().toUpperCase();

        String sistema = "Eres el asistente de MisFinanzas, una app de finanzas personales. Responde en español, breve "
                + "(máximo 5 frases o una lista corta con guiones), texto plano sin markdown ni tablas, con importes en " + moneda + ". Usa solo estos datos del usuario; "
                + "si algo no está, dilo. Puedes dar consejos generales de ahorro, pero no de inversión.\n"
                + "Datos (hoy " + LocalDate.now() + "):\n" + resumen(usuario);

        List<Map<String, Object>> mensajes = new ArrayList<>();
        mensajes.add(Map.of("role", "system", "content", sistema));

        List<ChatMensajeDTO> historial = peticion.getHistorial() == null ? List.of() : peticion.getHistorial();
        for (ChatMensajeDTO m : historial.subList(Math.max(0, historial.size() - MENSAJES_HISTORIAL), historial.size())) {
            String texto = m.getTexto().length() > LARGO_MENSAJE_HISTORIAL ? m.getTexto().substring(0, LARGO_MENSAJE_HISTORIAL) : m.getTexto();
            mensajes.add(Map.of("role", m.getRol(), "content", texto));
        }
        mensajes.add(Map.of("role", "user", "content", peticion.getPregunta().trim()));

        Map<String, Object> cuerpo = Map.of(
                "model", modelo,
                "temperature", 0.4,
                "reasoning_effort", "low",
                "max_completion_tokens", MAXIMO_TOKENS_RESPUESTA,
                "messages", mensajes
        );

        String respuesta = llamarGroq(cuerpo).trim();

        if (respuesta.isEmpty()) {
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "El asistente no ha respondido. Prueba otra vez");
        }

        meterRegistry.counter("misfinanzas.ia.preguntas").increment();

        return new ChatRespuestaDTO(respuesta);
    }

    // Resumen en líneas cortas: es lo que más tokens gasta, así que solo lo imprescindible
    private String resumen(Usuario usuario) {

        StringBuilder r = new StringBuilder();
        YearMonth actual = YearMonth.now();

        for (YearMonth mes : List.of(actual, actual.minusMonths(1), actual.minusMonths(2))) {

            var inicio = mes.atDay(1).atStartOfDay();
            var fin = mes.plusMonths(1).atDay(1).atStartOfDay();

            BigDecimal gastos = cero(gastoRepository.sumarGastosEntreFechas(usuario, inicio, fin));
            BigDecimal ingresos = cero(ingresoRepository.sumarIngresosEntreFechas(usuario.getId(), inicio, fin));

            r.append("Mes ").append(mes).append(mes.equals(actual) ? " (en curso)" : "")
                    .append(": gastos ").append(importe(gastos)).append(", ingresos ").append(importe(ingresos));

            presupuestoRepository.findByUsuarioAndMesAndAnio(usuario, mes.getMonthValue(), mes.getYear())
                    .ifPresent(p -> r.append(", presupuesto ").append(importe(p.getImporte())));

            List<Object[]> porCategoria = gastoRepository.sumarGastosPorCategoria(usuario, inicio, fin);
            if (!porCategoria.isEmpty()) {
                r.append(". Por categoría: ");
                porCategoria.stream().limit(CATEGORIAS_RESUMEN)
                        .forEach(c -> r.append(c[1]).append(' ').append(importe((BigDecimal) c[2])).append("; "));
            }

            if (mes.equals(actual)) {
                List<Object[]> porIngreso = ingresoRepository.sumarIngresosPorCategoria(usuario.getId(), inicio, fin);
                if (!porIngreso.isEmpty()) {
                    r.append(". Ingresos por categoría: ");
                    porIngreso.stream().limit(CATEGORIAS_RESUMEN)
                            .forEach(c -> r.append(c[1]).append(' ').append(importe((BigDecimal) c[2])).append("; "));
                }
            }
            r.append('\n');
        }

        List<GastoRecurrente> pagos = gastoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario);
        if (!pagos.isEmpty()) {
            r.append("Pagos fijos: ");
            pagos.forEach(p -> r.append(p.getDescripcion()).append(' ').append(importe(p.getImporte()))
                    .append(' ').append(p.getPeriodicidad().name().toLowerCase()).append("; "));
            r.append('\n');
        }

        List<IngresoRecurrente> cobros = ingresoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario);
        if (!cobros.isEmpty()) {
            r.append("Cobros fijos: ");
            cobros.forEach(c -> r.append(c.getDescripcion()).append(' ').append(importe(c.getImporte()))
                    .append(' ').append(c.getPeriodicidad().name().toLowerCase()).append("; "));
            r.append('\n');
        }

        List<ObjetivoResponseDTO> objetivos = objetivoService.listar(usuario);
        if (!objetivos.isEmpty()) {
            r.append("Objetivos de ahorro: ");
            for (ObjetivoResponseDTO o : objetivos) {
                r.append(o.getNombre()).append(' ').append(importe(o.getAhorrado())).append('/').append(importe(o.getImporteObjetivo()));
                if (o.isCompletado()) {
                    r.append(" completado");
                } else if (o.getFechaLimite() != null) {
                    r.append(" hasta ").append(o.getFechaLimite());
                    if (o.getAhorroMensualNecesario() != null) {
                        r.append(" (").append(importe(o.getAhorroMensualNecesario())).append("/mes)");
                    }
                }
                r.append("; ");
            }
            r.append('\n');
        }

        return r.toString();
    }

    private String llamarGroq(Map<String, Object> cuerpo) {

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

            log.warn("Groq respondió {} en el chat: {}", e.getStatusCode().value(), e.getResponseBodyAsString());

            if (e.getStatusCode().value() == 429) {
                throw new ServicioExternoException(HttpStatus.TOO_MANY_REQUESTS, "Has llegado al límite gratuito del asistente. Prueba en un rato");
            }
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "El asistente no ha podido responder. Prueba otra vez");

        } catch (RestClientException e) {

            log.warn("No se pudo contactar con Groq: {}", e.getMessage());
            throw new ServicioExternoException(HttpStatus.BAD_GATEWAY, "No se ha podido conectar con el asistente");
        }
    }

    private BigDecimal cero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private String importe(BigDecimal valor) {
        return valor == null ? "0" : valor.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }
}
