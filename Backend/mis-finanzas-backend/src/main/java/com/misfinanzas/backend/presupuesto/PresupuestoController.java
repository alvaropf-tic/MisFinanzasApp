package com.misfinanzas.backend.presupuesto;

import com.misfinanzas.backend.presupuesto.model.dto.PresupuestoRegistroDTO;
import com.misfinanzas.backend.presupuesto.model.dto.PresupuestoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    @PostMapping
    public ResponseEntity<PresupuestoResponseDTO> crearPresupuesto(@Valid @RequestBody PresupuestoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        PresupuestoResponseDTO respuesta = presupuestoService.crearPresupuesto(registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    @GetMapping
    public ResponseEntity<PresupuestoResponseDTO> obtenerPresupuesto(@RequestParam Integer mes, @RequestParam Integer anio, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(presupuestoService.obtenerPresupuesto(mes, anio, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoResponseDTO> actualizarPresupuesto(@PathVariable Long id, @Valid @RequestBody PresupuestoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(presupuestoService.actualizarPresupuesto(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPresupuesto(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        presupuestoService.eliminarPresupuesto(id, usuario);

        return ResponseEntity.noContent().build();
    }
}
