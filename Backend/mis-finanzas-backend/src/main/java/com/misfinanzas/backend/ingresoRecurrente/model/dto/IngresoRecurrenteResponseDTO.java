package com.misfinanzas.backend.ingresoRecurrente.model.dto;

import com.misfinanzas.backend.gastoRecurrente.model.Periodicidad;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
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
public class IngresoRecurrenteResponseDTO {

    private Long id;
    private BigDecimal importe;
    private String descripcion;
    private MetodoIngreso metodoIngreso;
    private Periodicidad periodicidad;
    private LocalDate proximaFecha;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private boolean activo;
    private Long categoriaIngresoId;
    private String categoriaIngresoNombre;
}
