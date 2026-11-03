package com.misfinanzas.backend.gasto;

import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gasto.model.OrigenGasto;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.persistence.PostPersist;
import org.springframework.stereotype.Component;

// Cuenta cada gasto que se guarda, venga de donde venga (manual, vehículos, tickets o recurrentes).
// En Prometheus aparece como misfinanzas_gastos_creados_total{origen="..."}
@Component
public class GastoMetricasListener {

    private final MeterRegistry meterRegistry;

    public GastoMetricasListener(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @PostPersist
    public void gastoCreado(Gasto gasto) {

        meterRegistry.counter("misfinanzas.gastos.creados", "origen", OrigenGasto.de(gasto).name()).increment();
    }
}
