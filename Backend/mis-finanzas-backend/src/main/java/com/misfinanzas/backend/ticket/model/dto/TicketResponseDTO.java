package com.misfinanzas.backend.ticket.model.dto;

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
public class TicketResponseDTO {

    private Long id;

    private LocalDate fecha;

    private String comercio;

    private BigDecimal importe;

    private String descripcion;

    // null si el ticket no tiene imagen
    private String imagenUrl;

    // null si el ticket todavía no se ha convertido en gasto
    private Long gastoId;
}
