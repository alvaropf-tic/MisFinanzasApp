package com.misfinanzas.backend.objetivo.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Importe positivo = aportar; negativo = retirar
@Getter
@Setter
@NoArgsConstructor
public class AportacionRegistroDTO {

    @NotNull(message = "El importe es obligatorio")
    private BigDecimal importe;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @Size(max = 255, message = "La nota no puede superar los 255 caracteres")
    private String nota;
}
