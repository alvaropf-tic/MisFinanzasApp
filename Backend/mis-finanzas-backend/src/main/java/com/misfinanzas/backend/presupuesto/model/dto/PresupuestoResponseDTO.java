package com.misfinanzas.backend.presupuesto.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PresupuestoResponseDTO {

    private Long id;

    private BigDecimal importe;

    private Integer mes;

    private Integer anio;

    private BigDecimal gastado;

    private BigDecimal prevision;

    private BigDecimal restante;

    private BigDecimal porcentajeGastado;

    private BigDecimal porcentajePrevision;
}
