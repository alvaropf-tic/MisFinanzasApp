package com.misfinanzas.backend.ticket.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Importe y fecha se toman del ticket; si no se envía descripción se usa el comercio
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketConversionDTO {

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    @Size(max = 255, message = "La descripción no puede superar los 255 caracteres")
    private String descripcion;
}
