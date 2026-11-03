package com.misfinanzas.backend.ingreso.model.dto;

import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class IngresoRegistroDTO {

    @NotNull(message = "El importe es obligatorio")
    @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
    private BigDecimal importe;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDateTime fecha;

    @Size(max = 255, message = "La descripción no puede superar los 255 caracteres")
    private String descripcion;

    @NotNull(message = "El método de ingreso es obligatorio")
    private MetodoIngreso metodoIngreso;

    @NotNull(message = "La categoría de ingreso es obligatoria")
    private Long categoriaIngresoId;
}
