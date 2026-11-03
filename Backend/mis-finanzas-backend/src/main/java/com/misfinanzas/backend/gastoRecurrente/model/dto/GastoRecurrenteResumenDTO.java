package com.misfinanzas.backend.gastoRecurrente.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Resumen de los recurrentes de un mes para la sección de Finanzas
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GastoRecurrenteResumenDTO {

    private int activos;

    // Gastos ya generados por recurrentes dentro del mes
    private BigDecimal cobrado;

    // Cobros de recurrentes activos que aún quedan en el mes (en el mes actual, a partir de mañana)
    private BigDecimal pendiente;

    // cobrado + pendiente
    private BigDecimal total;

    // Próximo cobro de los activos; null si no hay ninguno
    private String proximoDescripcion;
    private LocalDate proximaFecha;
    private BigDecimal proximoImporte;
}
