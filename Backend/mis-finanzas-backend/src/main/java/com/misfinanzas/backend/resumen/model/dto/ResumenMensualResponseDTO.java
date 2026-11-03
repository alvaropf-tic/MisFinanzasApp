package com.misfinanzas.backend.resumen.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumenMensualResponseDTO {

    private Integer mes;

    private Integer anio;

    private BigDecimal ingresos;

    private BigDecimal gastos;

    private BigDecimal presupuesto;

    private BigDecimal prevision;

    private BigDecimal restantePresupuesto;

    private BigDecimal saldo;
}
