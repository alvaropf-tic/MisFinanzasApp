package com.misfinanzas.backend.gastoRecurrente;

import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import jakarta.transaction.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class GastoRecurrenteScheduler {

    private final GastoRecurrenteRepository gastoRecurrenteRepository;
    private final GastoRepository gastoRepository;

    public GastoRecurrenteScheduler(GastoRecurrenteRepository gastoRecurrenteRepository, GastoRepository gastoRepository) {

        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
        this.gastoRepository = gastoRepository;
    }

    // Se ejecuta cada medianoche y también al arrancar, por si el servidor estaba apagado a las 00:00.
    // El bucle solo genera los gastos con proximaFecha <= hoy, así que nunca se duplican.
    @Scheduled(cron = "0 0 0 * * *")
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void procesarGastosRecurrentes() {

        LocalDate hoy = LocalDate.now();

        List<GastoRecurrente> recurrentes = gastoRecurrenteRepository.findAll().stream().filter(GastoRecurrente::isActivo).toList();

        for (GastoRecurrente recurrente : recurrentes) {

            while (!recurrente.getProximaFecha().isAfter(hoy)) {

                // Si existe una fecha de finalización y ya la hemos superado
                if (recurrente.getFechaFin() != null && recurrente.getProximaFecha().isAfter(recurrente.getFechaFin())) {

                    recurrente.setActivo(false);
                    break;
                }

                crearGasto(recurrente);

                actualizarProximaFecha(recurrente);
            }

            // Si la siguiente fecha ya supera la fecha fin y el recurrente deja de estar activo.
            if (recurrente.getFechaFin() != null && recurrente.getProximaFecha().isAfter(recurrente.getFechaFin())) {

                recurrente.setActivo(false);
            }

            gastoRecurrenteRepository.save(recurrente);
        }
    }

    private void crearGasto(GastoRecurrente recurrente) {

        Gasto gasto = new Gasto();

        gasto.setImporte(recurrente.getImporte());
        gasto.setDescripcion(recurrente.getDescripcion());
        gasto.setFecha(recurrente.getProximaFecha().atStartOfDay());
        gasto.setMetodoPago(recurrente.getMetodoPago());
        gasto.setCategoria(recurrente.getCategoria());
        gasto.setUsuario(recurrente.getUsuario());

        gastoRepository.save(gasto);
    }

    private void actualizarProximaFecha(GastoRecurrente recurrente) {

        int diaReferencia = recurrente.getFechaInicio().getDayOfMonth();

        recurrente.setProximaFecha(recurrente.getPeriodicidad().siguienteFecha(recurrente.getProximaFecha(), diaReferencia));
    }
}
