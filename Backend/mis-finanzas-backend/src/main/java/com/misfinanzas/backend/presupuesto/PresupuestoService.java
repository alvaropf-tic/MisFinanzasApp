package com.misfinanzas.backend.presupuesto;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.common.util.PeriodoUtils;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gastoRecurrente.GastoRecurrenteRepository;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.presupuesto.model.Presupuesto;
import com.misfinanzas.backend.presupuesto.model.dto.PresupuestoRegistroDTO;
import com.misfinanzas.backend.presupuesto.model.dto.PresupuestoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final GastoRepository gastoRepository;
    private final GastoRecurrenteRepository gastoRecurrenteRepository;

    public PresupuestoService(PresupuestoRepository presupuestoRepository, GastoRepository gastoRepository, GastoRecurrenteRepository gastoRecurrenteRepository) {
        this.presupuestoRepository = presupuestoRepository;
        this.gastoRepository = gastoRepository;
        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
    }

    @Transactional
    public PresupuestoResponseDTO crearPresupuesto(PresupuestoRegistroDTO dto, Usuario usuario) {

        if (presupuestoRepository.findByUsuarioAndMesAndAnio(usuario, dto.getMes(), dto.getAnio()).isPresent()) {

            throw new ConflictoException("Ya existe un presupuesto para ese mes");
        }

        Presupuesto presupuesto = new Presupuesto();

        presupuesto.setImporte(dto.getImporte());
        presupuesto.setMes(dto.getMes());
        presupuesto.setAnio(dto.getAnio());
        presupuesto.setUsuario(usuario);

        presupuesto = presupuestoRepository.save(presupuesto);

        return convertirAResponse(presupuesto);
    }

    @Transactional(readOnly = true)
    public PresupuestoResponseDTO obtenerPresupuesto(Integer mes, Integer anio, Usuario usuario) {

        PeriodoUtils.obtenerPeriodo(mes, anio);

        Presupuesto presupuesto = presupuestoRepository.findByUsuarioAndMesAndAnio(usuario, mes, anio).orElseThrow(() -> new RecursoNoEncontradoException("No existe un presupuesto para ese mes"));

        return convertirAResponse(presupuesto);
    }

    @Transactional
    public PresupuestoResponseDTO actualizarPresupuesto(Long id, PresupuestoRegistroDTO dto, Usuario usuario) {

        Presupuesto presupuesto = obtenerPresupuestoDelUsuario(id, usuario);

        // Si se mueve a otro mes, ese mes no puede tener ya un presupuesto
        presupuestoRepository.findByUsuarioAndMesAndAnio(usuario, dto.getMes(), dto.getAnio())
                .filter(existente -> !existente.getId().equals(presupuesto.getId()))
                .ifPresent(existente -> {
                    throw new ConflictoException("Ya existe un presupuesto para ese mes");
                });

        presupuesto.setImporte(dto.getImporte());
        presupuesto.setMes(dto.getMes());
        presupuesto.setAnio(dto.getAnio());

        Presupuesto presupuestoActualizado = presupuestoRepository.save(presupuesto);

        return convertirAResponse(presupuestoActualizado);
    }

    @Transactional
    public void eliminarPresupuesto(Long id, Usuario usuario) {

        Presupuesto presupuesto = obtenerPresupuestoDelUsuario(id, usuario);

        presupuestoRepository.delete(presupuesto);
    }

    private Presupuesto obtenerPresupuestoDelUsuario(Long id, Usuario usuario) {

        return presupuestoRepository.findByIdAndUsuario(id, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Presupuesto no encontrado"));
    }

    private PresupuestoResponseDTO convertirAResponse(Presupuesto presupuesto) {

        YearMonth periodo = YearMonth.of(presupuesto.getAnio(), presupuesto.getMes());

        LocalDateTime inicio = periodo.atDay(1).atStartOfDay();

        LocalDateTime fin = periodo.plusMonths(1).atDay(1).atStartOfDay();

        BigDecimal gastado = gastoRepository.sumarGastosEntreFechas(presupuesto.getUsuario(), inicio, fin);

        BigDecimal recurrentesDelMes = calcularRecurrentesDelMes(presupuesto.getUsuario(), periodo);

        BigDecimal prevision = gastado.add(recurrentesDelMes);

        BigDecimal restante = presupuesto.getImporte().subtract(gastado);

        BigDecimal porcentajeGastado = gastado.divide(presupuesto.getImporte(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        BigDecimal porcentajePrevision = prevision.divide(presupuesto.getImporte(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        return new PresupuestoResponseDTO(presupuesto.getId(), presupuesto.getImporte(), presupuesto.getMes(), presupuesto.getAnio(), gastado, prevision, restante, porcentajeGastado, porcentajePrevision);
    }

    private BigDecimal calcularRecurrentesDelMes(Usuario usuario, YearMonth periodo) {

        List<GastoRecurrente> recurrentes = gastoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario);

        BigDecimal total = BigDecimal.ZERO;

        LocalDate inicioMes = periodo.atDay(1);
        LocalDate finMes = periodo.atEndOfMonth();
        LocalDate hoy = LocalDate.now();

        boolean esMesActual = YearMonth.from(hoy).equals(periodo);

        for (GastoRecurrente recurrente : recurrentes) {

            LocalDate fecha = recurrente.getProximaFecha();

            while (!fecha.isAfter(finMes)) {

                boolean perteneceAlMes = !fecha.isBefore(inicioMes);

                boolean yaHaOcurrido = fecha.isBefore(hoy);

                boolean esHoy = fecha.isEqual(hoy);

                boolean dentroDeFechaFin = recurrente.getFechaFin() == null || !fecha.isAfter(recurrente.getFechaFin());

                if (perteneceAlMes && dentroDeFechaFin) {

                    if (!esMesActual || (!yaHaOcurrido && !esHoy)) {
                        total = total.add(recurrente.getImporte());
                    }
                }

                fecha = recurrente.getPeriodicidad().siguienteFecha(fecha, recurrente.getFechaInicio().getDayOfMonth());
            }
        }

        return total;
    }

    @Transactional(readOnly = true)
    public PresupuestoResponseDTO obtenerPresupuestoParaResumen(Integer mes, Integer anio, Usuario usuario) {

        return presupuestoRepository.findByUsuarioAndMesAndAnio(usuario, mes, anio).map(this::convertirAResponse).orElse(null);
    }
}