package com.misfinanzas.backend.estadistica.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvolucionMensualResponseDTO {

    private Integer mes;

    private Integer anio;

    private BigDecimal total;
}
