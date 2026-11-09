package com.misfinanzas.backend.ingresoRecurrente;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.common.util.PeriodoUtils;
import com.misfinanzas.backend.ingreso.CategoriaIngresoRepository;
import com.misfinanzas.backend.ingreso.IngresoRepository;
import com.misfinanzas.backend.ingreso.model.CategoriaIngreso;
import com.misfinanzas.backend.ingresoRecurrente.model.IngresoRecurrente;
import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteRegistroDTO;
import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteResponseDTO;
import com.misfinanzas.backend.ingresoRecurrente.model.dto.IngresoRecurrenteResumenDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;

// Mismo comportamiento que GastoRecurrenteService, para ingresos (nómina, alquiler cobrado...)
@Service
public class IngresoRecurrenteService {

    private final IngresoRecurrenteRepository ingresoRecurrenteRepository;
    private final CategoriaIngresoRepository categoriaIngresoRepository;
    private final IngresoRepository ingresoRepository;
    private final IngresoRecurrenteScheduler ingresoRecurrenteScheduler;

    public IngresoRecurrenteService(IngresoRecurrenteRepository ingresoRecurrenteRepository, CategoriaIngresoRepository categoriaIngresoRepository, IngresoRepository ingresoRepository, IngresoRecurrenteScheduler ingresoRecurrenteScheduler) {

        this.ingresoRecurrenteRepository = ingresoRecurrenteRepository;
        this.categoriaIngresoRepository = categoriaIngresoRepository;
        this.ingresoRepository = ingresoRepository;
        this.ingresoRecurrenteScheduler = ingresoRecurrenteScheduler;
    }

    @Transactional
    public IngresoRecurrenteResponseDTO crearIngresoRecurrente(IngresoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        validarFechas(registroDTO);

        IngresoRecurrente recurrente = new IngresoRecurrente();

        copiarDatos(registroDTO, recurrente, usuario);

        // Todo recurrente nuevo empieza activo
        recurrente.setActivo(true);
        recurrente.setUsuario(usuario);

        IngresoRecurrente guardado = ingresoRecurrenteRepository.save(recurrente);

        // Si el primer cobro es hoy o ya pasó, el ingreso se apunta ya (sin esperar a la medianoche)
        ingresoRecurrenteScheduler.generarIngresosPendientes(guardado);

        return convertirAResponseDTO(guardado);
    }

    public List<IngresoRecurrenteResponseDTO> obtenerIngresosRecurrentes(Usuario usuario) {

        return ingresoRecurrenteRepository.findByUsuarioId(usuario.getId()).stream().map(this::convertirAResponseDTO).toList();
    }

    public IngresoRecurrenteResponseDTO obtenerIngresoRecurrente(Long id, Usuario usuario) {

        return convertirAResponseDTO(obtenerDelUsuario(id, usuario));
    }

    @Transactional
    public IngresoRecurrenteResponseDTO actualizarIngresoRecurrente(Long id, IngresoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        IngresoRecurrente recurrente = obtenerDelUsuario(id, usuario);

        validarFechas(registroDTO);

        copiarDatos(registroDTO, recurrente, usuario);

        IngresoRecurrente actualizado = ingresoRecurrenteRepository.save(recurrente);

        ingresoRecurrenteScheduler.generarIngresosPendientes(actualizado);

        return convertirAResponseDTO(actualizado);
    }

    @Transactional
    public void eliminarIngresoRecurrente(Long id, Usuario usuario) {

        IngresoRecurrente recurrente = obtenerDelUsuario(id, usuario);

        // Los ingresos que ya generó se conservan en el historial, sin el enlace
        ingresoRepository.desvincularDeRecurrente(recurrente);

        ingresoRecurrenteRepository.delete(recurrente);
    }

    @Transactional
    public IngresoRecurrenteResponseDTO cambiarEstado(Long id, Usuario usuario) {

        IngresoRecurrente recurrente = obtenerDelUsuario(id, usuario);

        recurrente.setActivo(!recurrente.isActivo());

        // Al reactivar no se cobran los periodos en los que estuvo pausado: se salta a la próxima fecha desde hoy
        if (recurrente.isActivo()) {

            LocalDate hoy = LocalDate.now();

            int diaReferencia = recurrente.getFechaInicio().getDayOfMonth();

            while (recurrente.getProximaFecha().isBefore(hoy)) {

                recurrente.setProximaFecha(recurrente.getPeriodicidad().siguienteFecha(recurrente.getProximaFecha(), diaReferencia));
            }
        }

        IngresoRecurrente actualizado = ingresoRecurrenteRepository.save(recurrente);

        // Si la próxima fecha cae hoy, el ingreso de hoy se apunta ya
        ingresoRecurrenteScheduler.generarIngresosPendientes(actualizado);

        return convertirAResponseDTO(actualizado);
    }

    public IngresoRecurrenteResumenDTO obtenerResumen(Integer anio, Integer mes, Usuario usuario) {

        YearMonth periodo = PeriodoUtils.obtenerPeriodo(mes, anio);

        LocalDateTime inicio = periodo.atDay(1).atStartOfDay();

        LocalDateTime fin = periodo.plusMonths(1).atDay(1).atStartOfDay();

        BigDecimal cobrado = ingresoRepository.sumarIngresosRecurrentesEntreFechas(usuario.getId(), inicio, fin);

        BigDecimal pendiente = calcularPendienteDelMes(usuario, periodo);

        List<IngresoRecurrente> activos = ingresoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario);

        IngresoRecurrente proximo = activos.stream().min(Comparator.comparing(IngresoRecurrente::getProximaFecha)).orElse(null);

        return new IngresoRecurrenteResumenDTO(
                activos.size(),
                cobrado,
                pendiente,
                cobrado.add(pendiente),
                proximo == null ? null : proximo.getDescripcion(),
                proximo == null ? null : proximo.getProximaFecha(),
                proximo == null ? null : proximo.getImporte()
        );
    }

    // Lo que aún falta por cobrar de los recurrentes activos en un mes. En el mes actual solo cuenta desde mañana:
    // lo de hoy o antes ya se ha generado como ingreso.
    public BigDecimal calcularPendienteDelMes(Usuario usuario, YearMonth periodo) {

        BigDecimal total = BigDecimal.ZERO;

        LocalDate inicioMes = periodo.atDay(1);
        LocalDate finMes = periodo.atEndOfMonth();
        LocalDate hoy = LocalDate.now();

        boolean esMesActual = YearMonth.from(hoy).equals(periodo);

        for (IngresoRecurrente recurrente : ingresoRecurrenteRepository.findByUsuarioAndActivoTrue(usuario)) {

            LocalDate fecha = recurrente.getProximaFecha();

            while (!fecha.isAfter(finMes)) {

                boolean dentroDeFechaFin = recurrente.getFechaFin() == null || !fecha.isAfter(recurrente.getFechaFin());

                if (!fecha.isBefore(inicioMes) && dentroDeFechaFin && (!esMesActual || fecha.isAfter(hoy))) {
                    total = total.add(recurrente.getImporte());
                }

                fecha = recurrente.getPeriodicidad().siguienteFecha(fecha, recurrente.getFechaInicio().getDayOfMonth());
            }
        }

        return total;
    }

    private void copiarDatos(IngresoRecurrenteRegistroDTO registroDTO, IngresoRecurrente recurrente, Usuario usuario) {

        CategoriaIngreso categoria = categoriaIngresoRepository.findByIdAndUsuarioId(registroDTO.getCategoriaIngresoId(), usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría de ingreso no encontrada"));

        recurrente.setImporte(registroDTO.getImporte());
        recurrente.setDescripcion(registroDTO.getDescripcion());
        recurrente.setMetodoIngreso(registroDTO.getMetodoIngreso());
        recurrente.setPeriodicidad(registroDTO.getPeriodicidad());
        recurrente.setProximaFecha(registroDTO.getProximaFecha());
        recurrente.setFechaInicio(registroDTO.getFechaInicio());
        recurrente.setFechaFin(registroDTO.getFechaFin());
        recurrente.setCategoriaIngreso(categoria);
    }

    private void validarFechas(IngresoRecurrenteRegistroDTO registroDTO) {

        if (registroDTO.getFechaFin() != null && registroDTO.getFechaFin().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de finalización no puede ser anterior a la fecha de inicio");
        }

        if (registroDTO.getProximaFecha().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La próxima fecha no puede ser anterior a la fecha de inicio");
        }
    }

    private IngresoRecurrente obtenerDelUsuario(Long id, Usuario usuario) {

        return ingresoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Ingreso recurrente no encontrado"));
    }

    private IngresoRecurrenteResponseDTO convertirAResponseDTO(IngresoRecurrente recurrente) {

        return new IngresoRecurrenteResponseDTO(
                recurrente.getId(),
                recurrente.getImporte(),
                recurrente.getDescripcion(),
                recurrente.getMetodoIngreso(),
                recurrente.getPeriodicidad(),
                recurrente.getProximaFecha(),
                recurrente.getFechaInicio(),
                recurrente.getFechaFin(),
                recurrente.isActivo(),
                recurrente.getCategoriaIngreso().getId(),
                recurrente.getCategoriaIngreso().getNombre()
        );
    }
}
