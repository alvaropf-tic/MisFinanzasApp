package com.misfinanzas.backend.ingresoRecurrente.model.dto;

import com.misfinanzas.backend.gastoRecurrente.model.Periodicidad;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class IngresoRecurrenteRegistroDTO {

    @NotNull(message = "El importe es obligatorio")
    @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
    private BigDecimal importe;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 255, message = "La descripción no puede superar los 255 caracteres")
    private String descripcion;

    @NotNull(message = "El método de ingreso es obligatorio")
    private MetodoIngreso metodoIngreso;

    @NotNull(message = "La periodicidad es obligatoria")
    private Periodicidad periodicidad;

    @NotNull(message = "La próxima fecha es obligatoria")
    private LocalDate proximaFecha;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @NotNull(message = "La categoría de ingreso es obligatoria")
    private Long categoriaIngresoId;
}
