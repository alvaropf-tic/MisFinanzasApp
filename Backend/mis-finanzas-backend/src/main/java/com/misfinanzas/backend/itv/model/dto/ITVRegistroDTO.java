package com.misfinanzas.backend.itv.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.itv.model.ResultadoITV;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class ITVRegistroDTO {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "Los kilómetros son obligatorios")
    private Integer kilometros;

    @NotNull(message = "El resultado es obligatorio")
    private ResultadoITV resultado;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
    private BigDecimal precio;

    @Size(max = 500, message = "Las notas no pueden superar los 500 caracteres")
    private String notas;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;
}
