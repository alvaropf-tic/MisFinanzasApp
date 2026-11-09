package com.misfinanzas.backend.objetivo.model.dto;

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
public class ObjetivoRegistroDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @NotNull(message = "El importe objetivo es obligatorio")
    @DecimalMin(value = "0.01", message = "El importe objetivo debe ser mayor que 0")
    private BigDecimal importeObjetivo;

    private LocalDate fechaLimite;

    @Size(max = 40, message = "El icono no es válido")
    private String icono;
}
