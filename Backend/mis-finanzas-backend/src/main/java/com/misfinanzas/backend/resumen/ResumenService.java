package com.misfinanzas.backend.resumen;

import com.misfinanzas.backend.common.util.PeriodoUtils;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.ingreso.IngresoRepository;
import com.misfinanzas.backend.presupuesto.PresupuestoService;
import com.misfinanzas.backend.presupuesto.model.dto.PresupuestoResponseDTO;
import com.misfinanzas.backend.resumen.model.dto.ResumenMensualResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ResumenService {

    private final IngresoRepository ingresoRepository;
    private final GastoRepository gastoRepository;
    private final PresupuestoService presupuestoService;

    public ResumenService(IngresoRepository ingresoRepository, GastoRepository gastoRepository, PresupuestoService presupuestoService) {

        this.ingresoRepository = ingresoRepository;
        this.gastoRepository = gastoRepository;
        this.presupuestoService = presupuestoService;
    }

    public ResumenMensualResponseDTO obtenerResumenMensual(Integer mes, Integer anio, Usuario usuario) {

        LocalDateTime inicio = PeriodoUtils.obtenerPeriodo(mes, anio).atDay(1).atStartOfDay();

        LocalDateTime fin = inicio.plusMonths(1);

        BigDecimal ingresos = ingresoRepository.sumarIngresosEntreFechas(usuario.getId(), inicio, fin);

        BigDecimal gastos = gastoRepository.sumarGastosEntreFechas(usuario, inicio, fin);

        PresupuestoResponseDTO presupuesto = presupuestoService.obtenerPresupuestoParaResumen(mes, anio, usuario);

        BigDecimal importePresupuesto = BigDecimal.ZERO;
        BigDecimal prevision = gastos;
        BigDecimal restantePresupuesto = BigDecimal.ZERO;

        if (presupuesto != null) {

            importePresupuesto = presupuesto.getImporte();

            prevision = presupuesto.getPrevision();

            restantePresupuesto = presupuesto.getRestante();
        }

        BigDecimal saldo = ingresos.subtract(gastos);

        return new ResumenMensualResponseDTO(mes, anio, ingresos, gastos, importePresupuesto, prevision, restantePresupuesto, saldo);
    }
}
