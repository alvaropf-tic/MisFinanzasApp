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
public class GastoPorCategoriaResponseDTO {

    private Long categoriaId;

    private String categoriaNombre;

    private BigDecimal total;
}
