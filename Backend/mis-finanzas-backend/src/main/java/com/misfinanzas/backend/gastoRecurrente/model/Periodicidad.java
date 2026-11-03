package com.misfinanzas.backend.gastoRecurrente.model;

import java.time.LocalDate;

public enum Periodicidad {
    SEMANAL,
    MENSUAL,
    TRIMESTRAL,
    SEMESTRAL,
    ANUAL;

    // Calcula la siguiente fecha respetando el día de referencia (el de la fecha de inicio).
    // Así un recurrente del día 31 pasa al 30 o al 28 en los meses cortos, pero vuelve al 31 cuando el mes lo tiene.
    public LocalDate siguienteFecha(LocalDate fecha, int diaReferencia) {

        if (this == SEMANAL) {
            return fecha.plusWeeks(1);
        }

        int meses = switch (this) {
            case MENSUAL -> 1;
            case TRIMESTRAL -> 3;
            case SEMESTRAL -> 6;
            case ANUAL -> 12;
            default -> throw new IllegalStateException("Periodicidad no soportada: " + this);
        };

        LocalDate siguiente = fecha.plusMonths(meses);

        return siguiente.withDayOfMonth(Math.min(diaReferencia, siguiente.lengthOfMonth()));
    }
}
