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

    private Integer kilometros;

    private BigDecimal consumoOrdenador;

    private BigDecimal velocidadMedia;

    private String notas;

    private Long vehiculoId;

    // Datos del gasto asociado
    private Long categoriaId;

    private String categoriaNombre;

    private MetodoPago metodoPago;

    private Integer kilometrosRecorridos;

    private BigDecimal consumoReal;

    private BigDecimal costePorKilometro;
}
