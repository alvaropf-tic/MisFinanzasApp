package com.misfinanzas.backend.objetivo;

import com.misfinanzas.backend.objetivo.model.dto.AportacionRegistroDTO;
import com.misfinanzas.backend.objetivo.model.dto.ObjetivoRegistroDTO;
import com.misfinanzas.backend.objetivo.model.dto.ObjetivoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/objetivos")
public class ObjetivoController {

    private final ObjetivoService objetivoService;

    public ObjetivoController(ObjetivoService objetivoService) {
        this.objetivoService = objetivoService;
    }

    @PostMapping
    public ResponseEntity<ObjetivoResponseDTO> crear(@Valid @RequestBody ObjetivoRegistroDTO dto, Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED).body(objetivoService.crear(dto, (Usuario) authentication.getPrincipal()));
    }

    @GetMapping
    public ResponseEntity<List<ObjetivoResponseDTO>> listar(Authentication authentication) {

        return ResponseEntity.ok(objetivoService.listar((Usuario) authentication.getPrincipal()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObjetivoResponseDTO> obtener(@PathVariable Long id, Authentication authentication) {

        return ResponseEntity.ok(objetivoService.obtener(id, (Usuario) authentication.getPrincipal()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ObjetivoResponseDTO> actualizar(@PathVariable Long id, @Valid @RequestBody ObjetivoRegistroDTO dto, Authentication authentication) {

        return ResponseEntity.ok(objetivoService.actualizar(id, dto, (Usuario) authentication.getPrincipal()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {

        objetivoService.eliminar(id, (Usuario) authentication.getPrincipal());

        return ResponseEntity.noContent().build();
    }

    // Importe positivo = aportar; negativo = retirar (400 si se retira más de lo ahorrado)
    @PostMapping("/{id}/aportaciones")
    public ResponseEntity<ObjetivoResponseDTO> aportar(@PathVariable Long id, @Valid @RequestBody AportacionRegistroDTO dto, Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED).body(objetivoService.aportar(id, dto, (Usuario) authentication.getPrincipal()));
    }

    @DeleteMapping("/{id}/aportaciones/{aportacionId}")
    public ResponseEntity<ObjetivoResponseDTO> eliminarAportacion(@PathVariable Long id, @PathVariable Long aportacionId, Authentication authentication) {

        return ResponseEntity.ok(objetivoService.eliminarAportacion(id, aportacionId, (Usuario) authentication.getPrincipal()));
    }
}
