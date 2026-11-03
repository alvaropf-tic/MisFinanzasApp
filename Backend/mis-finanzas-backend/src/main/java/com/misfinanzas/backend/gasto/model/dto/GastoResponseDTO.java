package com.misfinanzas.backend.gasto.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gasto.model.OrigenGasto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GastoResponseDTO {

    private Long id;
    private BigDecimal importe;
    private LocalDateTime fecha;
    private String descripcion;
    private MetodoPago metodoPago;
    private Long categoriaId;
    private String categoriaNombre;
    private OrigenGasto origen;
}
