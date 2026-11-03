package com.misfinanzas.backend.mantenimiento;

import com.misfinanzas.backend.mantenimiento.model.dto.MantenimientoRegistroDTO;
import com.misfinanzas.backend.mantenimiento.model.dto.MantenimientoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos/{vehiculoId}/mantenimientos")
public class MantenimientoController {

    private final MantenimientoService mantenimientoService;

    public MantenimientoController(MantenimientoService mantenimientoService) {

        this.mantenimientoService = mantenimientoService;
    }

    @PostMapping
    public ResponseEntity<MantenimientoResponseDTO> crearMantenimiento(@PathVariable Long vehiculoId, @Valid @RequestBody MantenimientoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        MantenimientoResponseDTO mantenimiento = mantenimientoService.crearMantenimiento(vehiculoId, registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(mantenimiento);
    }

    @GetMapping
    public ResponseEntity<List<MantenimientoResponseDTO>> obtenerMantenimientos(@PathVariable Long vehiculoId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(mantenimientoService.obtenerMantenimientos(vehiculoId, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MantenimientoResponseDTO> obtenerMantenimiento(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(mantenimientoService.obtenerMantenimiento(vehiculoId, id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MantenimientoResponseDTO> actualizarMantenimiento(@PathVariable Long vehiculoId, @PathVariable Long id, @Valid @RequestBody MantenimientoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(mantenimientoService.actualizarMantenimiento(vehiculoId, id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarMantenimiento(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        mantenimientoService.eliminarMantenimiento(vehiculoId, id, usuario);

        return ResponseEntity.noContent().build();
    }
}
