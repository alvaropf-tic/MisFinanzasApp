package com.misfinanzas.backend.repostaje;

import com.misfinanzas.backend.repostaje.model.dto.RepostajeRegistroDTO;
import com.misfinanzas.backend.repostaje.model.dto.RepostajeResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos/{vehiculoId}/repostajes")
public class RepostajeController {

    private final RepostajeService repostajeService;

    public RepostajeController(RepostajeService repostajeService) {
        this.repostajeService = repostajeService;
    }

    @PostMapping
    public ResponseEntity<RepostajeResponseDTO> crearRepostaje(@PathVariable Long vehiculoId, @Valid @RequestBody RepostajeRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(repostajeService.crearRepostaje(vehiculoId, registroDTO, usuario));
    }

    @GetMapping
    public ResponseEntity<List<RepostajeResponseDTO>> obtenerRepostajes(@PathVariable Long vehiculoId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(repostajeService.obtenerRepostajes(vehiculoId, usuario));
    }

    @GetMapping("/{repostajeId}")
    public ResponseEntity<RepostajeResponseDTO> obtenerRepostaje(@PathVariable Long vehiculoId, @PathVariable Long repostajeId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(repostajeService.obtenerRepostaje(vehiculoId, repostajeId, usuario));
    }

    @PutMapping("/{repostajeId}")
    public ResponseEntity<RepostajeResponseDTO> actualizarRepostaje(@PathVariable Long vehiculoId, @PathVariable Long repostajeId, @Valid @RequestBody RepostajeRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(repostajeService.actualizarRepostaje(vehiculoId, repostajeId, registroDTO, usuario));
    }

    @DeleteMapping("/{repostajeId}")
    public ResponseEntity<Void> eliminarRepostaje(@PathVariable Long vehiculoId, @PathVariable Long repostajeId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        repostajeService.eliminarRepostaje(vehiculoId, repostajeId, usuario);

        return ResponseEntity.noContent().build();
    }
}
