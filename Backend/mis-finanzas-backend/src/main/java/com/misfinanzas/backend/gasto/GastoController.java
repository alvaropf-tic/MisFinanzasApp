package com.misfinanzas.backend.gasto;

import com.misfinanzas.backend.common.dto.PaginaResponseDTO;
import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gasto.model.dto.GastoRegistroDTO;
import com.misfinanzas.backend.gasto.model.dto.GastoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private final GastoService gastoService;

    public GastoController(GastoService gastoService) {
        this.gastoService = gastoService;
    }

    @PostMapping
    public ResponseEntity<GastoResponseDTO> crearGasto(@Valid @RequestBody GastoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        GastoResponseDTO respuesta = gastoService.crearGasto(registroDTO, usuario);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    // Ej: /api/gastos?desde=2026-11-01&hasta=2026-11-30&categoriaId=1&metodoPago=TARJETA&texto=mercadona&page=0&size=20
    @GetMapping
    public ResponseEntity<PaginaResponseDTO<GastoResponseDTO>> obtenerGastos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) MetodoPago metodoPago,
            @RequestParam(required = false) String texto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoService.obtenerGastos(usuario, desde, hasta, categoriaId, metodoPago, texto, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GastoResponseDTO> obtenerGasto(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(gastoService.obtenerGasto(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GastoResponseDTO> actualizarGasto(@PathVariable Long id, @Valid @RequestBody GastoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(
                gastoService.actualizarGasto(
                        id,
                        registroDTO,
                        usuario
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarGasto(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        gastoService.eliminarGasto(id, usuario);

        return ResponseEntity.noContent().build();
    }
}
