package com.misfinanzas.backend.ticket.model.dto;

import com.misfinanzas.backend.gasto.model.dto.GastoRegistroDTO;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Gasto que se guarda con la foto de su ticket (parte "datos" del multipart; la foto va en "imagen")
@Getter
@Setter
@NoArgsConstructor
public class GastoConTicketDTO extends GastoRegistroDTO {

    // Comercio leído en el ticket; si no llega se usa la descripción del gasto
    @Size(max = 100, message = "El comercio no puede superar los 100 caracteres")
    private String comercio;
}
