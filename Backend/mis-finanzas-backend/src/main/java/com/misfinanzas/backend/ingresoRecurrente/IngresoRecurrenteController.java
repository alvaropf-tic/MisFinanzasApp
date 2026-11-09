package com.misfinanzas.backend.ingresoRecurrente;

import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteRegistroDTO;
import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteResponseDTO;
import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteResumenDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos-recurrentes")
public class IngresoRecurrenteController {

    private final IngresoRecurrenteService ingresoRecurrenteService;

    public IngresoRecurrenteController(IngresoRecurrenteService ingresoRecurrenteService) {

        this.ingresoRecurrenteService = ingresoRecurrenteService;
    }

    @PostMapping
    public ResponseEntity<IngresoRecurrenteResponseDTO> crearIngresoRecurrente(@Valid @RequestBody IngresoRecurrenteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(ingresoRecurrenteService.crearIngresoRecurrente(registroDTO, usuario));
    }

    @GetMapping
    public ResponseEntity<List<IngresoRecurrenteResponseDTO>> obtenerIngresosRecurrentes(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoRecurrenteService.obtenerIngresosRecurrentes(usuario));
    }

    // Ej: /api/ingresos-recurrentes/resumen/2026/11 → activos, cobrado, pendiente, total y próximo cobro del mes
    @GetMapping("/resumen/{anio}/{mes}")
    public ResponseEntity<IngresoRecurrenteResumenDTO> obtenerResumen(@PathVariable Integer anio, @PathVariable Integer mes, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoRecurrenteService.obtenerResumen(anio, mes, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngresoRecurrenteResponseDTO> obtenerIngresoRecurrente(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoRecurrenteService.obtenerIngresoRecurrente(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IngresoRecurrenteResponseDTO> actualizarIngresoRecurrente(@PathVariable Long id, @Valid @RequestBody IngresoRecurrenteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoRecurrenteService.actualizarIngresoRecurrente(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarIngresoRecurrente(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        ingresoRecurrenteService.eliminarIngresoRecurrente(id, usuario);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<IngresoRecurrenteResponseDTO> cambiarEstado(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoRecurrenteService.cambiarEstado(id, usuario));
    }
}
