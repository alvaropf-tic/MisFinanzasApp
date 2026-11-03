package com.misfinanzas.backend.presupuesto.model.dto;

import com.misfinanzas.backend.common.util.PeriodoUtils;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PresupuestoRegistroDTO {

    @NotNull(message = "El importe es obligatorio")
    @DecimalMin(value = "0.01", message = "El presupuesto debe ser mayor que 0")
    private BigDecimal importe;

    @NotNull(message = "El mes es obligatorio")
    @Min(value = 1, message = "El mes debe estar entre 1 y 12")
    @Max(value = 12, message = "El mes debe estar entre 1 y 12")
    private Integer mes;

    @NotNull(message = "El año es obligatorio")
    @Min(value = PeriodoUtils.ANIO_MINIMO, message = "El año debe estar entre 2000 y 2100")
    @Max(value = PeriodoUtils.ANIO_MAXIMO, message = "El año debe estar entre 2000 y 2100")
    private Integer anio;
}
