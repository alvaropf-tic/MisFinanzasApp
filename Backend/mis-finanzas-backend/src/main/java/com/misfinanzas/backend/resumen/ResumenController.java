package com.misfinanzas.backend.resumen;

import com.misfinanzas.backend.resumen.model.dto.ResumenMensualResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resumen")
public class ResumenController {

    private final ResumenService resumenService;

    public ResumenController(ResumenService resumenService) {
        this.resumenService = resumenService;
    }

    @GetMapping("/{anio}/{mes}")
    public ResponseEntity<ResumenMensualResponseDTO> obtenerResumenMensual(@PathVariable Integer anio, @PathVariable Integer mes, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(resumenService.obtenerResumenMensual(mes, anio, usuario));
    }
}
