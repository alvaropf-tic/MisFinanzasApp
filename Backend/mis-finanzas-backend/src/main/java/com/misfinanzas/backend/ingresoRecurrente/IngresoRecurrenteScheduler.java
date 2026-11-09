package com.misfinanzas.backend.ingresoRecurrente;

import com.misfinanzas.backend.ingreso.IngresoRepository;
import com.misfinanzas.backend.ingreso.model.Ingreso;
import com.misfinanzas.backend.ingresoRecurrente.model.IngresoRecurrente;
import jakarta.transaction.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class IngresoRecurrenteScheduler {

    private final IngresoRecurrenteRepository ingresoRecurrenteRepository;
    private final IngresoRepository ingresoRepository;

    public IngresoRecurrenteScheduler(IngresoRecurrenteRepository ingresoRecurrenteRepository, IngresoRepository ingresoRepository) {

        this.ingresoRecurrenteRepository = ingresoRecurrenteRepository;
        this.ingresoRepository = ingresoRepository;
    }

    // Igual que GastoRecurrenteScheduler: cada medianoche y al arrancar; solo genera fechas <= hoy, nunca duplica.
    @Scheduled(cron = "0 0 0 * * *")
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void procesarIngresosRecurrentes() {

        List<IngresoRecurrente> recurrentes = ingresoRecurrenteRepository.findAll().stream().filter(IngresoRecurrente::isActivo).toList();

        for (IngresoRecurrente recurrente : recurrentes) {

            generarIngresosPendientes(recurrente);
        }
    }

    // Genera los ingresos cuya fecha ya ha llegado y avanza proximaFecha. También lo usa IngresoRecurrenteService
    // al crear o editar, para que un cobro de hoy aparezca al momento.
    @Transactional
    public void generarIngresosPendientes(IngresoRecurrente recurrente) {

        if (!recurrente.isActivo()) {
            return;
        }

        LocalDate hoy = LocalDate.now();

        while (!recurrente.getProximaFecha().isAfter(hoy)) {

            if (recurrente.getFechaFin() != null && recurrente.getProximaFecha().isAfter(recurrente.getFechaFin())) {

                recurrente.setActivo(false);
                break;
            }

            crearIngreso(recurrente);

            actualizarProximaFecha(recurrente);
        }

        if (recurrente.getFechaFin() != null && recurrente.getProximaFecha().isAfter(recurrente.getFechaFin())) {

            recurrente.setActivo(false);
        }

        ingresoRecurrenteRepository.save(recurrente);
    }

    private void crearIngreso(IngresoRecurrente recurrente) {

        Ingreso ingreso = new Ingreso();

        ingreso.setImporte(recurrente.getImporte());
        ingreso.setDescripcion(recurrente.getDescripcion());
        ingreso.setFecha(recurrente.getProximaFecha().atStartOfDay());
        ingreso.setMetodoIngreso(recurrente.getMetodoIngreso());
        ingreso.setCategoriaIngreso(recurrente.getCategoriaIngreso());
        ingreso.setUsuario(recurrente.getUsuario());
        ingreso.setIngresoRecurrente(recurrente);

        ingresoRepository.save(ingreso);
    }

    private void actualizarProximaFecha(IngresoRecurrente recurrente) {

        int diaReferencia = recurrente.getFechaInicio().getDayOfMonth();

        recurrente.setProximaFecha(recurrente.getPeriodicidad().siguienteFecha(recurrente.getProximaFecha(), diaReferencia));
    }
}
