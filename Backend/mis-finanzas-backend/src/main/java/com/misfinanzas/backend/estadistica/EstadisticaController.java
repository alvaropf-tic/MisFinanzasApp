package com.misfinanzas.backend.estadistica;

import com.misfinanzas.backend.estadistica.model.dto.EvolucionMensualResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.GastoPorCategoriaResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.GastoPorMetodoPagoResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.IngresoPorCategoriaResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticaController {

    private final EstadisticaService estadisticasService;

    public EstadisticaController(EstadisticaService estadisticasService) {

        this.estadisticasService = estadisticasService;
    }

    @GetMapping("/gastos-por-categoria/{anio}/{mes}")
    public ResponseEntity<List<GastoPorCategoriaResponseDTO>> obtenerGastosPorCategoria(@PathVariable Integer anio, @PathVariable Integer mes, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(estadisticasService.obtenerGastosPorCategoria(mes, anio, usuario));
    }

    @GetMapping("/ingresos-por-categoria/{anio}/{mes}")
    public ResponseEntity<List<IngresoPorCategoriaResponseDTO>> obtenerIngresosPorCategoria(@PathVariable Integer anio, @PathVariable Integer mes, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(estadisticasService.obtenerIngresosPorCategoria(mes, anio, usuario));
    }

    @GetMapping("/gastos-por-metodo-pago/{anio}/{mes}")
    public ResponseEntity<List<GastoPorMetodoPagoResponseDTO>> obtenerGastosPorMetodoPago(@PathVariable Integer anio, @PathVariable Integer mes, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(estadisticasService.obtenerGastosPorMetodoPago(mes, anio, usuario));
    }

    @GetMapping("/evolucion-gastos/{anioInicio}/{mesInicio}/{anioFin}/{mesFin}")
    public ResponseEntity<List<EvolucionMensualResponseDTO>> obtenerEvolucionGastos(@PathVariable Integer anioInicio, @PathVariable Integer mesInicio, @PathVariable Integer anioFin, @PathVariable Integer mesFin, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(estadisticasService.obtenerEvolucionGastos(mesInicio, anioInicio, mesFin, anioFin, usuario));
    }
}

