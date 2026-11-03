package com.misfinanzas.backend.gastoRecurrente;

import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteRegistroDTO;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gastos-recurrentes")
public class GastoRecurrenteController {

    private final GastoRecurrenteService gastoRecurrenteService;

    public GastoRecurrenteController(GastoRecurrenteService gastoRecurrenteService) {

        this.gastoRecurrenteService = gastoRecurrenteService;
    }

    @PostMapping
    public ResponseEntity<GastoRecurrenteResponseDTO> crearGastoRecurrente(@Valid @RequestBody GastoRecurrenteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED).body(gastoRecurrenteService.crearGastoRecurrente(registroDTO, usuario));
    }

    @GetMapping
    public ResponseEntity<List<GastoRecurrenteResponseDTO>> obtenerGastosRecurrentes(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoRecurrenteService.obtenerGastosRecurrentes(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GastoRecurrenteResponseDTO> obtenerGastoRecurrente(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoRecurrenteService.obtenerGastoRecurrente(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GastoRecurrenteResponseDTO> actualizarGastoRecurrente(@PathVariable Long id, @Valid @RequestBody GastoRecurrenteRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoRecurrenteService.actualizarGastoRecurrente(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarGastoRecurrente(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        gastoRecurrenteService.eliminarGastoRecurrente(id, usuario);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<GastoRecurrenteResponseDTO> cambiarEstado(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoRecurrenteService.cambiarEstado(id, usuario));
    }
}
