package com.misfinanzas.backend.ia.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.ia.model.TipoTicket;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Lo que la IA ha leído en la foto de un ticket. Cada campo es null si no se ha podido leer:
// el usuario revisa y completa la hoja del gasto antes de guardar.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LecturaTicketDTO {

    private String comercio;
    private LocalDate fecha;
    private BigDecimal importe;
    private MetodoPago metodoPago;

    // Una de las categorías del usuario que encaja con la compra
    private Long categoriaId;

    // COMPRA, o el registro de vehículo al que corresponde (REPOSTAJE, ITV...). Sin vehículos siempre es COMPRA
    private TipoTicket tipo = TipoTicket.COMPRA;

    // Vehículo del usuario cuya matrícula aparece en el ticket; null si no aparece o no coincide con ninguno
    private Long vehiculoId;

    // Solo en repostajes
    private BigDecimal litros;
    private BigDecimal precioLitro;
}
