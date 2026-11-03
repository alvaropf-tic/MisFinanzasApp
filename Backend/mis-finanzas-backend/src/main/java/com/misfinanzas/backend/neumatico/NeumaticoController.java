package com.misfinanzas.backend.neumatico;

import com.misfinanzas.backend.neumatico.model.dto.NeumaticoRegistroDTO;
import com.misfinanzas.backend.neumatico.model.dto.NeumaticoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos/{vehiculoId}/neumaticos")
public class NeumaticoController {

    private final NeumaticoService neumaticoService;

    public NeumaticoController(NeumaticoService neumaticoService) {
        this.neumaticoService = neumaticoService;
    }

    @PostMapping
    public ResponseEntity<NeumaticoResponseDTO> crearNeumatico(@PathVariable Long vehiculoId, @Valid @RequestBody NeumaticoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        NeumaticoResponseDTO neumatico = neumaticoService.crearNeumatico(vehiculoId, registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(neumatico);
    }

    @GetMapping
    public ResponseEntity<List<NeumaticoResponseDTO>> obtenerNeumaticos(@PathVariable Long vehiculoId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(neumaticoService.obtenerNeumaticos(vehiculoId, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NeumaticoResponseDTO> obtenerNeumatico(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(neumaticoService.obtenerNeumatico(vehiculoId, id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NeumaticoResponseDTO> actualizarNeumatico(@PathVariable Long vehiculoId, @PathVariable Long id, @Valid @RequestBody NeumaticoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(neumaticoService.actualizarNeumatico(vehiculoId, id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarNeumatico(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        neumaticoService.eliminarNeumatico(vehiculoId, id, usuario);

        return ResponseEntity.noContent().build();
    }
}
