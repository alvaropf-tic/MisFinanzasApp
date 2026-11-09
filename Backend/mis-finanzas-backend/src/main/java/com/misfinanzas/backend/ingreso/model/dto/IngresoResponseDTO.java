package com.misfinanzas.backend.ingreso.model.dto;

import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
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
public class IngresoResponseDTO {

    private Long id;
    private BigDecimal importe;
    private LocalDateTime fecha;
    private String descripcion;
    private MetodoIngreso metodoIngreso;
    private Long categoriaIngresoId;
    private String categoriaIngresoNombre;

    // true si lo generó un ingreso recurrente
    private boolean recurrente;
}
