package com.misfinanzas.backend.itv.model.dto;

import com.misfinanzas.backend.itv.model.ResultadoITV;
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
public class ITVResponseDTO {

    private Long id;

    private LocalDate fecha;

    private Integer kilometros;

    private ResultadoITV resultado;

    private BigDecimal precio;

    private String notas;

    private Long vehiculoId;

    // Datos del gasto asociado
    private Long categoriaId;

    private String categoriaNombre;

    private MetodoPago metodoPago;
}