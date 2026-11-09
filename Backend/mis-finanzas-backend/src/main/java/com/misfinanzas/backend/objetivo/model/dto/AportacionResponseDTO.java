package com.misfinanzas.backend.objetivo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class AportacionResponseDTO {

    private Long id;
    private BigDecimal importe;
    private LocalDate fecha;
    private String nota;
}
