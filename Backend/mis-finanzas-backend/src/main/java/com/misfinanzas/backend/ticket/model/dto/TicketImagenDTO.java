package com.misfinanzas.backend.ticket.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// Uso interno: contenido de la imagen y su tipo para devolverla en el controller
@Getter
@AllArgsConstructor
public class TicketImagenDTO {

    private byte[] contenido;
    private String tipoContenido;
}
