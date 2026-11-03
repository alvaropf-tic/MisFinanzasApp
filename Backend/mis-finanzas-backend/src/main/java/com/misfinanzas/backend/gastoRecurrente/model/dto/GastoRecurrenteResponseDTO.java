package com.misfinanzas.backend.gastoRecurrente.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gastoRecurrente.model.Periodicidad;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GastoRecurrenteResponseDTO {

    private Long id;
    private BigDecimal importe;
    private String descripcion;
    private MetodoPago metodoPago;
    private Periodicidad periodicidad;
    private LocalDate proximaFecha;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private boolean activo;
    private Long categoriaId;
    private String categoriaNombre;
}
