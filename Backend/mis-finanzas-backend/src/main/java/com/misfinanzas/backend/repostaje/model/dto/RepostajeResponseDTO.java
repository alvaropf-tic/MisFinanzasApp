package com.misfinanzas.backend.repostaje.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
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
public class RepostajeResponseDTO {

    private Long id;
    private LocalDate fecha;
    private BigDecimal litros;
    private BigDecimal precioTotal;
    private BigDecimal precioLitro;

    // Cuentakilómetros calculado en este repostaje
    private Integer kilometros;

    // Lo que se registró: el trip y, si se dio, la lectura real
    private Integer kilometrosRecorridos;
    private Integer cuentakilometros;
    private boolean lleno;

    private BigDecimal consumoOrdenador;
    private BigDecimal velocidadMedia;
    private String notas;
    private Long vehiculoId;

    // Datos del gasto asociado
    private Long categoriaId;
    private String categoriaNombre;
    private MetodoPago metodoPago;

    // Solo en repostajes con el depósito lleno: tramo desde el lleno anterior (sumando los parciales de en medio).
    // null en los parciales o si no hay datos para saber los km del tramo.
    private Integer kilometrosTramo;
    private BigDecimal consumoReal;
    private BigDecimal costePorKilometro;

    // Gasto que crea el registro y ticket (foto) guardado con él; ticketId es null si no tiene
    private Long gastoId;
    private Long ticketId;
}
