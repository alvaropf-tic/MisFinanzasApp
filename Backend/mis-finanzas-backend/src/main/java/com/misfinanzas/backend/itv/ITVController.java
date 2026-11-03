package com.misfinanzas.backend.itv;

import com.misfinanzas.backend.itv.model.dto.ITVRegistroDTO;
import com.misfinanzas.backend.itv.model.dto.ITVResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos/{vehiculoId}/itv")
public class ITVController {

    private final ITVService itvService;

    public ITVController(ITVService itvService) {
        this.itvService = itvService;
    }

    @PostMapping
    public ResponseEntity<ITVResponseDTO> crearITV(@PathVariable Long vehiculoId, @Valid @RequestBody ITVRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        ITVResponseDTO itv = itvService.crearITV(vehiculoId, registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(itv);
    }

    @GetMapping
    public ResponseEntity<List<ITVResponseDTO>> obtenerITVs(@PathVariable Long vehiculoId, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(itvService.obtenerITVs(vehiculoId, usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ITVResponseDTO> obtenerITV(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(itvService.obtenerITV(vehiculoId, id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ITVResponseDTO> actualizarITV(@PathVariable Long vehiculoId, @PathVariable Long id, @Valid @RequestBody ITVRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(itvService.actualizarITV(vehiculoId, id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarITV(@PathVariable Long vehiculoId, @PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        itvService.eliminarITV(vehiculoId, id, usuario);

        return ResponseEntity.noContent().build();
    }
}
