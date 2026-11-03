package com.misfinanzas.backend.common.util;

import java.time.YearMonth;

// Validación de los mes/año que llegan en las URLs de estadísticas y resumen
public final class PeriodoUtils {

    public static final int ANIO_MINIMO = 2000;
    public static final int ANIO_MAXIMO = 2100;

    private PeriodoUtils() {
    }

    public static YearMonth obtenerPeriodo(Integer mes, Integer anio) {

        if (mes == null || mes < 1 || mes > 12) {
            throw new IllegalArgumentException("El mes debe estar entre 1 y 12");
        }

        if (anio == null || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
            throw new IllegalArgumentException("El año debe estar entre " + ANIO_MINIMO + " y " + ANIO_MAXIMO);
        }

        return YearMonth.of(anio, mes);
    }

    public static void validarRango(YearMonth inicio, YearMonth fin) {

        if (inicio.isAfter(fin)) {
            throw new IllegalArgumentException("El periodo de inicio no puede ser posterior al de fin");
        }
    }
}
