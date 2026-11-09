package com.misfinanzas.backend.ticket;

import com.misfinanzas.backend.gasto.model.dto.GastoResponseDTO;
import com.misfinanzas.backend.ia.LectorTicketsService;
import com.misfinanzas.backend.ia.model.dto.LecturaTicketDTO;
import com.misfinanzas.backend.ticket.model.dto.GastoConTicketDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketConversionDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketImagenDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketRegistroDTO;
import com.misfinanzas.backend.ticket.model.dto.TicketResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final LectorTicketsService lectorTicketsService;

    public TicketController(TicketService ticketService, LectorTicketsService lectorTicketsService) {
        this.ticketService = ticketService;
        this.lectorTicketsService = lectorTicketsService;
    }

    // Lee la foto con la IA y devuelve los datos para rellenar el gasto (no guarda nada).
    // multipart/form-data con el campo "imagen"
    @PostMapping(value = "/leer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LecturaTicketDTO> leerTicket(@RequestParam("imagen") MultipartFile imagen, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(lectorTicketsService.leer(imagen, usuario));
    }

    // Guarda el gasto revisado con su ticket y la foto. multipart: "datos" (JSON) e "imagen"
    @PostMapping(value = "/gasto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GastoResponseDTO> crearGastoConTicket(@Valid @RequestPart("datos") GastoConTicketDTO datos, @RequestPart("imagen") MultipartFile imagen, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.crearGastoConTicket(datos, imagen, usuario));
    }

    @PostMapping
    public ResponseEntity<TicketResponseDTO> crearTicket(@Valid @RequestBody TicketRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.crearTicket(registroDTO, usuario));
    }

    // Guarda la foto del ticket dentro de un gasto ya creado (p. ej. el de un registro de vehículo escaneado).
    // multipart: "imagen" y, opcional, "comercio"
    @PostMapping(value = "/gasto/{gastoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GastoResponseDTO> adjuntarAGasto(@PathVariable Long gastoId, @RequestParam("imagen") MultipartFile imagen, @RequestParam(value = "comercio", required = false) String comercio, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.adjuntarAGasto(gastoId, comercio, imagen, usuario));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponseDTO>> obtenerTickets(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ticketService.obtenerTickets(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> obtenerTicket(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ticketService.obtenerTicket(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> actualizarTicket(@PathVariable Long id, @Valid @RequestBody TicketRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ticketService.actualizarTicket(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTicket(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        ticketService.eliminarTicket(id, usuario);

        return ResponseEntity.noContent().build();
    }

    // multipart/form-data con el campo "imagen" (JPG, PNG o WEBP, máx. 5 MB)
    @PostMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponseDTO> subirImagen(@PathVariable Long id, @RequestParam("imagen") MultipartFile imagen, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ticketService.subirImagen(id, imagen, usuario));
    }

    @GetMapping("/{id}/imagen")
    public ResponseEntity<byte[]> obtenerImagen(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        TicketImagenDTO imagen = ticketService.obtenerImagen(id, usuario);

        return ResponseEntity.ok().contentType(MediaType.parseMediaType(imagen.getTipoContenido())).body(imagen.getContenido());
    }

    @DeleteMapping("/{id}/imagen")
    public ResponseEntity<Void> eliminarImagen(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        ticketService.eliminarImagen(id, usuario);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/gasto")
    public ResponseEntity<GastoResponseDTO> convertirEnGasto(@PathVariable Long id, @Valid @RequestBody TicketConversionDTO conversionDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.convertirEnGasto(id, conversionDTO, usuario));
    }
}
