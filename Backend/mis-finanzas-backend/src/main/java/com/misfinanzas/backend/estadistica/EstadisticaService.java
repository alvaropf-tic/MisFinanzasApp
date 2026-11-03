package com.misfinanzas.backend.estadistica;

import com.misfinanzas.backend.common.util.PeriodoUtils;
import com.misfinanzas.backend.estadistica.model.dto.EvolucionMensualResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.GastoPorCategoriaResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.GastoPorMetodoPagoResponseDTO;
import com.misfinanzas.backend.estadistica.model.dto.IngresoPorCategoriaResponseDTO;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.ingreso.IngresoRepository;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EstadisticaService {

    private final GastoRepository gastoRepository;
    private final IngresoRepository ingresoRepository;

    public EstadisticaService(GastoRepository gastoRepository, IngresoRepository ingresoRepository) {
        this.gastoRepository = gastoRepository;
        this.ingresoRepository = ingresoRepository;
    }

    public List<GastoPorCategoriaResponseDTO> obtenerGastosPorCategoria(Integer mes, Integer anio, Usuario usuario) {

        LocalDateTime inicio = PeriodoUtils.obtenerPeriodo(mes, anio).atDay(1).atStartOfDay();

        LocalDateTime fin = inicio.plusMonths(1);

        return gastoRepository.sumarGastosPorCategoria(usuario, inicio, fin).stream().map(resultado -> {
            Long categoriaId = ((Number) resultado[0]).longValue();
            String categoriaNombre = (String) resultado[1];
            BigDecimal total = (BigDecimal) resultado[2];
            return new GastoPorCategoriaResponseDTO(categoriaId, categoriaNombre, total);
        }).toList();
    }

    public List<IngresoPorCategoriaResponseDTO> obtenerIngresosPorCategoria(Integer mes, Integer anio, Usuario usuario) {

        LocalDateTime inicio = PeriodoUtils.obtenerPeriodo(mes, anio).atDay(1).atStartOfDay();

        LocalDateTime fin = inicio.plusMonths(1);

        return ingresoRepository.sumarIngresosPorCategoria(usuario.getId(), inicio, fin).stream().map(resultado -> {

                    Long categoriaId = ((Number) resultado[0]).longValue();
                    String categoriaNombre = (String) resultado[1];
                    BigDecimal total = (BigDecimal) resultado[2];

                    return new IngresoPorCategoriaResponseDTO(categoriaId, categoriaNombre, total);
                }).toList();
    }

    public List<GastoPorMetodoPagoResponseDTO> obtenerGastosPorMetodoPago(Integer mes, Integer anio, Usuario usuario) {

        LocalDateTime inicio = PeriodoUtils.obtenerPeriodo(mes, anio).atDay(1).atStartOfDay();

        LocalDateTime fin = inicio.plusMonths(1);

        return gastoRepository.sumarGastosPorMetodoPago(usuario, inicio, fin).stream().map(resultado -> {
                    MetodoPago metodoPago = (MetodoPago) resultado[0];

                    BigDecimal total = (BigDecimal) resultado[1];

                    return new GastoPorMetodoPagoResponseDTO(metodoPago, total);
                }).toList();
    }

    public List<EvolucionMensualResponseDTO> obtenerEvolucionGastos(Integer mesInicio, Integer anioInicio, Integer mesFin, Integer anioFin, Usuario usuario) {

        YearMonth periodoInicio = PeriodoUtils.obtenerPeriodo(mesInicio, anioInicio);
        YearMonth periodoFin = PeriodoUtils.obtenerPeriodo(mesFin, anioFin);
        PeriodoUtils.validarRango(periodoInicio, periodoFin);

        LocalDateTime inicio = periodoInicio.atDay(1).atStartOfDay();
        LocalDateTime fin = periodoFin.plusMonths(1).atDay(1).atStartOfDay();
        List<Gasto> gastos = gastoRepository.findByUsuarioAndFechaGreaterThanEqualAndFechaLessThan(usuario, inicio, fin);

        Map<YearMonth, BigDecimal> gastosPorMes = gastos.stream().collect(Collectors.groupingBy(gasto -> YearMonth.from(gasto.getFecha()), Collectors.reducing(BigDecimal.ZERO, Gasto::getImporte, BigDecimal::add)));
        List<EvolucionMensualResponseDTO> resultado = new java.util.ArrayList<>();
        YearMonth periodoActual = periodoInicio;

        while (!periodoActual.isAfter(periodoFin)) {

            BigDecimal total = gastosPorMes.getOrDefault(periodoActual, BigDecimal.ZERO);
            resultado.add(new EvolucionMensualResponseDTO(periodoActual.getMonthValue(), periodoActual.getYear(), total));
            periodoActual = periodoActual.plusMonths(1);
        }

        return resultado;
    }
}
