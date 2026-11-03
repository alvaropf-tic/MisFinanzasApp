package com.misfinanzas.backend.aceite;

import com.misfinanzas.backend.aceite.model.dto.AceiteRegistroDTO;
import com.misfinanzas.backend.aceite.model.dto.AceiteResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos/{vehiculoId}/aceites")
public class AceiteController {

    private final AceiteService aceiteService;

    public AceiteController(AceiteService aceiteService) {
        this.aceiteService = aceiteService;
    }

    @PostMapping
    public ResponseEntity<AceiteResponseDTO> crearAceite(@PathVariable Long vehiculoId, @Valid @RequestBody AceiteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        AceiteResponseDTO aceite = aceiteService.crearAceite(vehiculoId, registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(aceite);
    }

    @GetMapping
    public ResponseEntity<List<AceiteResponseDTO>> obtenerAceites(@PathVariable Long vehiculoId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(aceiteService.obtenerAceites(vehiculoId, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AceiteResponseDTO> obtenerAceite(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(aceiteService.obtenerAceite(vehiculoId, id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AceiteResponseDTO> actualizarAceite(@PathVariable Long vehiculoId, @PathVariable Long id, @Valid @RequestBody AceiteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(aceiteService.actualizarAceite(vehiculoId, id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAceite(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        aceiteService.eliminarAceite(vehiculoId, id, usuario);

        return ResponseEntity.noContent().build();
    }
}
