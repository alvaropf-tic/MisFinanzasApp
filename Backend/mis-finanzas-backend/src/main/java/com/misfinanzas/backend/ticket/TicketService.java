package com.misfinanzas.backend.ticket;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.GastoService;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gasto.model.dto.GastoResponseDTO;
import com.misfinanzas.backend.ticket.model.Ticket;
import com.misfinanzas.backend.ticket.model.dto.GastoConTicketDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketConversionDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketImagenDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketRegistroDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    private final TicketRepository ticketRepository;
    private final GastoRepository gastoRepository;
    private final GastoService gastoService;
    private final MeterRegistry meterRegistry;
    private final Path directorioImagenes;

    public TicketService(TicketRepository ticketRepository, GastoRepository gastoRepository, GastoService gastoService, MeterRegistry meterRegistry, @Value("${app.tickets.directorio}") String directorioImagenes) {
        this.ticketRepository = ticketRepository;
        this.gastoRepository = gastoRepository;
        this.gastoService = gastoService;
        this.meterRegistry = meterRegistry;
        this.directorioImagenes = Path.of(directorioImagenes).toAbsolutePath().normalize();
    }

    @Transactional
    public TicketResponseDTO crearTicket(TicketRegistroDTO registroDTO, Usuario usuario) {

        Ticket ticket = new Ticket();

        ticket.setFecha(registroDTO.getFecha());
        ticket.setComercio(registroDTO.getComercio());
        ticket.setImporte(registroDTO.getImporte());
        ticket.setDescripcion(registroDTO.getDescripcion());
        ticket.setUsuario(usuario);

        Ticket ticketGuardado = ticketRepository.save(ticket);

        return convertirAResponseDTO(ticketGuardado);
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDTO> obtenerTickets(Usuario usuario) {

        return ticketRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId()).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponseDTO obtenerTicket(Long id, Usuario usuario) {

        return convertirAResponseDTO(obtenerTicketDelUsuario(id, usuario));
    }

    @Transactional
    public TicketResponseDTO actualizarTicket(Long id, TicketRegistroDTO registroDTO, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        ticket.setFecha(registroDTO.getFecha());
        ticket.setComercio(registroDTO.getComercio());
        ticket.setImporte(registroDTO.getImporte());
        ticket.setDescripcion(registroDTO.getDescripcion());

        Ticket ticketActualizado = ticketRepository.save(ticket);

        return convertirAResponseDTO(ticketActualizado);
    }

    // El gasto generado se conserva (ya cuenta en el presupuesto); solo se desenlaza del ticket
    @Transactional
    public void eliminarTicket(Long id, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        gastoRepository.findByTicket(ticket).ifPresent(gasto -> gasto.setTicket(null));

        String imagen = ticket.getRutaImagen();

        ticketRepository.delete(ticket);

        borrarArchivo(imagen);
    }

    // ==========================================
    // GASTO ESCANEADO
    // ==========================================

    // El gasto se guarda con los datos del formulario (ya revisados) y el ticket con su foto dentro
    @Transactional
    public GastoResponseDTO crearGastoConTicket(GastoConTicketDTO datos, MultipartFile imagen, Usuario usuario) {

        String nombreArchivo = guardarArchivo(imagen);

        try {
            Ticket ticket = new Ticket();

            ticket.setFecha(datos.getFecha().toLocalDate());
            ticket.setComercio(comercioDe(datos));
            ticket.setImporte(datos.getImporte());
            ticket.setDescripcion(datos.getDescripcion());
            ticket.setRutaImagen(nombreArchivo);
            ticket.setUsuario(usuario);

            GastoResponseDTO gasto = gastoService.crearGastoConTicket(datos, ticketRepository.save(ticket), usuario);

            meterRegistry.counter("misfinanzas.tickets.convertidos").increment();

            return gasto;

        } catch (RuntimeException e) {
            // Sin gasto no se queda una foto suelta en disco
            borrarArchivo(nombreArchivo);
            throw e;
        }
    }

    private String comercioDe(GastoConTicketDTO datos) {

        String comercio = datos.getComercio() != null && !datos.getComercio().isBlank() ? datos.getComercio().trim()
                : datos.getDescripcion() != null && !datos.getDescripcion().isBlank() ? datos.getDescripcion().trim()
                : "Ticket";

        return comercio.length() > 100 ? comercio.substring(0, 100) : comercio;
    }

    // Ticket de un registro de vehículo (u otro gasto ya creado): la foto se guarda dentro de ese gasto
    @Transactional
    public GastoResponseDTO adjuntarAGasto(Long gastoId, String comercio, MultipartFile imagen, Usuario usuario) {

        Gasto gasto = gastoRepository.findByIdAndUsuarioId(gastoId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto no encontrado"));

        if (gasto.getTicket() != null) {
            throw new ConflictoException("Este gasto ya tiene un ticket");
        }

        String nombreArchivo = guardarArchivo(imagen);

        try {
            Ticket ticket = new Ticket();

            String nombre = comercio != null && !comercio.isBlank() ? comercio.trim() : gasto.getDescripcion() != null ? gasto.getDescripcion() : "Ticket";

            ticket.setFecha(gasto.getFecha().toLocalDate());
            ticket.setComercio(nombre.length() > 100 ? nombre.substring(0, 100) : nombre);
            ticket.setImporte(gasto.getImporte());
            ticket.setRutaImagen(nombreArchivo);
            ticket.setUsuario(usuario);

            gasto.setTicket(ticketRepository.save(ticket));
            gastoRepository.save(gasto);

            return gastoService.obtenerGasto(gasto.getId(), usuario);

        } catch (RuntimeException e) {
            borrarArchivo(nombreArchivo);
            throw e;
        }
    }

    // ==========================================
    // IMAGEN DEL TICKET
    // ==========================================

    @Transactional
    public TicketResponseDTO subirImagen(Long id, MultipartFile imagen, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        String nombreArchivo = guardarArchivo(imagen);

        String imagenAnterior = ticket.getRutaImagen();

        ticket.setRutaImagen(nombreArchivo);

        Ticket ticketActualizado = ticketRepository.save(ticket);

        borrarArchivo(imagenAnterior);

        return convertirAResponseDTO(ticketActualizado);
    }

    @Transactional(readOnly = true)
    public TicketImagenDTO obtenerImagen(Long id, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        if (ticket.getRutaImagen() == null) {
            throw new RecursoNoEncontradoException("El ticket no tiene imagen");
        }

        Path archivo = resolverArchivo(ticket.getRutaImagen());

        if (!Files.exists(archivo)) {
            throw new RecursoNoEncontradoException("No se encuentra la imagen del ticket");
        }

        try {
            return new TicketImagenDTO(Files.readAllBytes(archivo), FormatoImagen.desdeNombre(ticket.getRutaImagen()).tipoContenido);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer la imagen del ticket", e);
        }
    }

    @Transactional
    public void eliminarImagen(Long id, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        if (ticket.getRutaImagen() == null) {
            throw new RecursoNoEncontradoException("El ticket no tiene imagen");
        }

        String imagen = ticket.getRutaImagen();

        ticket.setRutaImagen(null);
        ticketRepository.save(ticket);

        borrarArchivo(imagen);
    }

    // ==========================================
    // CONVERTIR EN GASTO
    // ==========================================

    @Transactional
    public GastoResponseDTO convertirEnGasto(Long id, TicketConversionDTO conversionDTO, Usuario usuario) {

        Ticket ticket = obtenerTicketDelUsuario(id, usuario);

        if (gastoRepository.existsByTicket(ticket)) {
            throw new ConflictoException("Este ticket ya se ha convertido en un gasto");
        }

        GastoResponseDTO gasto = gastoService.crearGastoDesdeTicket(ticket, conversionDTO.getCategoriaId(), conversionDTO.getMetodoPago(), conversionDTO.getDescripcion(), usuario);

        // En Prometheus: misfinanzas_tickets_convertidos_total
        meterRegistry.counter("misfinanzas.tickets.convertidos").increment();

        return gasto;
    }

    private Ticket obtenerTicketDelUsuario(Long id, Usuario usuario) {

        return ticketRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Ticket no encontrado"));
    }

    // Comprueba la imagen y la guarda en disco con un nombre aleatorio; devuelve ese nombre
    private String guardarArchivo(MultipartFile imagen) {

        if (imagen == null || imagen.isEmpty()) {
            throw new IllegalArgumentException("La imagen está vacía");
        }

        // El tipo se comprueba por el contenido del archivo, no por lo que diga el cliente
        FormatoImagen formato = detectarFormato(imagen);

        // Nombre aleatorio: nunca se usa el nombre que manda el cliente
        String nombreArchivo = UUID.randomUUID() + "." + formato.extension;

        try {
            Files.createDirectories(directorioImagenes);
            imagen.transferTo(directorioImagenes.resolve(nombreArchivo));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar la imagen del ticket", e);
        }

        return nombreArchivo;
    }

    // Evita que un nombre manipulado en la base de datos salga del directorio de imágenes
    private Path resolverArchivo(String nombreArchivo) {

        Path archivo = directorioImagenes.resolve(nombreArchivo).normalize();

        if (!archivo.startsWith(directorioImagenes)) {
            throw new IllegalArgumentException("Ruta de imagen no válida");
        }

        return archivo;
    }

    // Si no se puede borrar el archivo solo se avisa en el log: los datos ya están bien en la base de datos
    private void borrarArchivo(String nombreArchivo) {

        if (nombreArchivo == null) {
            return;
        }

        try {
            Files.deleteIfExists(resolverArchivo(nombreArchivo));
        } catch (IOException | IllegalArgumentException e) {
            log.warn("No se pudo borrar la imagen {}: {}", nombreArchivo, e.getMessage());
        }
    }

    private FormatoImagen detectarFormato(MultipartFile imagen) {

        byte[] cabecera;

        try (var entrada = imagen.getInputStream()) {
            cabecera = entrada.readNBytes(12);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer la imagen", e);
        }

        return Arrays.stream(FormatoImagen.values())
                .filter(formato -> formato.coincide(cabecera))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Formato de imagen no permitido. Usa JPG, PNG o WEBP"));
    }

    private TicketResponseDTO convertirAResponseDTO(Ticket ticket) {

        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getFecha(),
                ticket.getComercio(),
                ticket.getImporte(),
                ticket.getDescripcion(),
                ticket.getRutaImagen() != null ? "/api/tickets/" + ticket.getId() + "/imagen" : null,
                gastoRepository.findByTicket(ticket).map(Gasto::getId).orElse(null)
        );
    }

    // Formatos permitidos, reconocidos por los primeros bytes del archivo
    private enum FormatoImagen {

        JPG("jpg", "image/jpeg"),
        PNG("png", "image/png"),
        WEBP("webp", "image/webp");

        private final String extension;
        private final String tipoContenido;

        FormatoImagen(String extension, String tipoContenido) {
            this.extension = extension;
            this.tipoContenido = tipoContenido;
        }

        private boolean coincide(byte[] b) {

            return switch (this) {
                case JPG -> b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
                case PNG -> b.length >= 4 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
                case WEBP -> b.length >= 12 && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF") && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
            };
        }

        private static FormatoImagen desdeNombre(String nombreArchivo) {

            String extension = nombreArchivo.substring(nombreArchivo.lastIndexOf('.') + 1);

            return Arrays.stream(values()).filter(formato -> formato.extension.equals(extension)).findFirst().orElse(JPG);
        }
    }
}
