package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.common.dto.PaginaResponseDTO;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import com.misfinanzas.backend.ingreso.model.dto.IngresoRegistroDTO;
import com.misfinanzas.backend.ingreso.model.dto.IngresoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/ingresos")
public class IngresoController {

    private final IngresoService ingresoService;

    public IngresoController(IngresoService ingresoService) {
        this.ingresoService = ingresoService;
    }

    @PostMapping
    public ResponseEntity<IngresoResponseDTO> crearIngreso(@Valid @RequestBody IngresoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        IngresoResponseDTO respuesta = ingresoService.crearIngreso(registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    // Ej: /api/ingresos?desde=2026-11-01&hasta=2026-11-30&categoriaIngresoId=1&metodoIngreso=TRANSFERENCIA&texto=nomina&page=0&size=20
    @GetMapping
    public ResponseEntity<PaginaResponseDTO<IngresoResponseDTO>> obtenerIngresos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long categoriaIngresoId,
            @RequestParam(required = false) MetodoIngreso metodoIngreso,
            @RequestParam(required = false) String texto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoService.obtenerIngresos(usuario, desde, hasta, categoriaIngresoId, metodoIngreso, texto, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngresoResponseDTO> obtenerIngreso(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoService.obtenerIngreso(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IngresoResponseDTO> actualizarIngreso(@PathVariable Long id, @Valid @RequestBody IngresoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(ingresoService.actualizarIngreso(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarIngreso(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        ingresoService.eliminarIngreso(id, usuario);

        return ResponseEntity.noContent().build();
    }
}
