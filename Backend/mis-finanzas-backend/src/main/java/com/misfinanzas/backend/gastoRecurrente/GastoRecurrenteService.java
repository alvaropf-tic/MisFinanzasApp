package com.misfinanzas.backend.gastoRecurrente;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.common.util.PeriodoUtils;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteRegistroDTO;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteResponseDTO;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteResumenDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;

@Service
public class GastoRecurrenteService {

    private final GastoRecurrenteRepository gastoRecurrenteRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;
    private final GastoRecurrenteScheduler gastoRecurrenteScheduler;

    public GastoRecurrenteService(GastoRecurrenteRepository gastoRecurrenteRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository, GastoRecurrenteScheduler gastoRecurrenteScheduler) {

        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
        this.gastoRecurrenteScheduler = gastoRecurrenteScheduler;
    }

    @Transactional
    public GastoRecurrenteResponseDTO crearGastoRecurrente(GastoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        validarFechas(registroDTO);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        GastoRecurrente gastoRecurrente = new GastoRecurrente();

        gastoRecurrente.setImporte(registroDTO.getImporte());
        gastoRecurrente.setDescripcion(registroDTO.getDescripcion());
        gastoRecurrente.setMetodoPago(registroDTO.getMetodoPago());
        gastoRecurrente.setPeriodicidad(registroDTO.getPeriodicidad());
        gastoRecurrente.setProximaFecha(registroDTO.getProximaFecha());
        gastoRecurrente.setFechaInicio(registroDTO.getFechaInicio());
        gastoRecurrente.setFechaFin(registroDTO.getFechaFin());

        // Todo recurrente nuevo empieza activo
        gastoRecurrente.setActivo(true);

        gastoRecurrente.setUsuario(usuario);
        gastoRecurrente.setCategoria(categoria);

        GastoRecurrente guardado = gastoRecurrenteRepository.save(gastoRecurrente);

        // Si el primer cobro es hoy o ya pasó, el gasto se apunta ya (sin esperar a la medianoche)
        gastoRecurrenteScheduler.generarGastosPendientes(guardado);

        return convertirAResponseDTO(guardado);
    }

    public List<GastoRecurrenteResponseDTO> obtenerGastosRecurrentes(Usuario usuario) {

        return gastoRecurrenteRepository.findByUsuarioId(usuario.getId()).stream().map(this::convertirAResponseDTO).toList();
    }

    public GastoRecurrenteResponseDTO obtenerGastoRecurrente(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        return convertirAResponseDTO(gastoRecurrente);
    }

    @Transactional
    public GastoRecurrenteResponseDTO actualizarGastoRecurrente(Long id, GastoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        validarFechas(registroDTO);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        gastoRecurrente.setImporte(registroDTO.getImporte());
        gastoRecurrente.setDescripcion(registroDTO.getDescripcion());
        gastoRecurrente.setMetodoPago(registroDTO.getMetodoPago());
        gastoRecurrente.setPeriodicidad(registroDTO.getPeriodicidad());
        gastoRecurrente.setProximaFecha(registroDTO.getProximaFecha());
        gastoRecurrente.setFechaInicio(registroDTO.getFechaInicio());
        gastoRecurrente.setFechaFin(registroDTO.getFechaFin());
        gastoRecurrente.setCategoria(categoria);

        GastoRecurrente actualizado = gastoRecurrenteRepository.save(gastoRecurrente);

        gastoRecurrenteScheduler.generarGastosPendientes(actualizado);

        return convertirAResponseDTO(actualizado);
    }

    @Transactional
    public void eliminarGastoRecurrente(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        // Los gastos que ya generó se conservan en el historial, sin el enlace
        gastoRepository.desvincularDeRecurrente(gastoRecurrente);

        gastoRecurrenteRepository.delete(gastoRecurrente);
    }

    @Transactional
    public GastoRecurrenteResponseDTO cambiarEstado(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        gastoRecurrente.setActivo(!gastoRecurrente.isActivo());

        // Al reactivar no se cobran los periodos en los que estuvo pausado: se salta a la próxima fecha desde hoy
        if (gastoRecurrente.isActivo()) {

            LocalDate hoy = LocalDate.now();

            int diaReferencia = gastoRecurrente.getFechaInicio().getDayOfMonth();

            while (gastoRecurrente.getProximaFecha().isBefore(hoy)) {

                gastoRecurrente.setProximaFecha(gastoRecurrente.getPeriodicidad().siguienteFecha(gastoRecurrente.getProximaFecha(), diaReferencia));
            }
        }

        GastoRecurrente actualizado = gastoRecurrenteRepository.save(gastoRecurrente);

        // Si la próxima fecha cae hoy, el gasto de hoy se apunta ya
        gastoRecurrenteScheduler.generarGastosPendientes(actualizado);

        return convertirAResponseDTO(actualizado);
    }

    public GastoRecurrenteResumenDTO obtenerResumen(Integer anio, Integer mes, Usuario usuario) {

        YearMonth periodo = PeriodoUtils.obtenerPeriodo(mes, anio);

        LocalDateTime inicio = periodo.atDay(1).atStartOfDay();

        LocalDateTime fin = periodo.plusMonths(1).atDay(1).atStartOfDay();

        BigDecimal cobrado = gastoRepository.sumarGastosRecurrentesEntreFechas(usuario, inicio, fin);

        BigDecimal pendiente = calcularPendienteDelMes(usuario, periodo);

        List<GastoRecurrente> activos = gastoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario);

        GastoRecurrente proximo = activos.stream().min(Comparator.comparing(GastoRecurrente::getProximaFecha)).orElse(null);

        return new GastoRecurrenteResumenDTO(
                activos.size(),
                cobrado,
                pendiente,
                cobrado.add(pendiente),
                proximo == null ? null : proximo.getDescripcion(),
                proximo == null ? null : proximo.getProximaFecha(),
                proximo == null ? null : proximo.getImporte()
        );
    }

    // Lo que aún falta por cobrar de los recurrentes activos en un mes. En el mes actual solo cuenta
    // desde mañana: lo de hoy o antes ya se ha generado como gasto. Lo usa también la previsión del presupuesto.
    public BigDecimal calcularPendienteDelMes(Usuario usuario, YearMonth periodo) {

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

    private void validarFechas(GastoRecurrenteRegistroDTO registroDTO) {

        if (registroDTO.getFechaFin() != null && registroDTO.getFechaFin().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de finalización no puede ser anterior a la fecha de inicio");
        }

        if (registroDTO.getProximaFecha().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La próxima fecha no puede ser anterior a la fecha de inicio");
        }
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private GastoRecurrenteResponseDTO convertirAResponseDTO(
            GastoRecurrente gastoRecurrente) {

        return new GastoRecurrenteResponseDTO(
                gastoRecurrente.getId(),
                gastoRecurrente.getImporte(),
                gastoRecurrente.getDescripcion(),
                gastoRecurrente.getMetodoPago(),
                gastoRecurrente.getPeriodicidad(),
                gastoRecurrente.getProximaFecha(),
                gastoRecurrente.getFechaInicio(),
                gastoRecurrente.getFechaFin(),
                gastoRecurrente.isActivo(),
                gastoRecurrente.getCategoria().getId(),
                gastoRecurrente.getCategoria().getNombre()
        );
    }
}
