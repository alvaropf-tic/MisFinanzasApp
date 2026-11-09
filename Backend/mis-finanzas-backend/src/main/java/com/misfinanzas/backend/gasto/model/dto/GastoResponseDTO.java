package com.misfinanzas.backend.gasto.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gasto.model.OrigenGasto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GastoResponseDTO {

    private Long id;
    private BigDecimal importe;
    private LocalDateTime fecha;
    private String descripcion;
    private MetodoPago metodoPago;
    private Long categoriaId;
    private String categoriaNombre;
    private OrigenGasto origen;

    // Ticket guardado con el gasto (su foto: GET /api/tickets/{ticketId}/imagen); null si no tiene
    private Long ticketId;

    // En los gastos de vehículo: el vehículo y el registro (repostaje, ITV...) que lo crearon; null en el resto
    private Long vehiculoId;
    private Long registroId;
}
