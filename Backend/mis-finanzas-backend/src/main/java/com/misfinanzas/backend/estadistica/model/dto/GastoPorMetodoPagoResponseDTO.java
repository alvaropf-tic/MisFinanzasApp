package com.misfinanzas.backend.estadistica.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GastoPorMetodoPagoResponseDTO {

    private MetodoPago metodoPago;

    private BigDecimal total;
}