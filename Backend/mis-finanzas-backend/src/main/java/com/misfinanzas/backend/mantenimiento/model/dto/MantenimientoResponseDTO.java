package com.misfinanzas.backend.mantenimiento.model.dto;

import com.misfinanzas.backend.mantenimiento.model.TipoMantenimiento;
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
public class MantenimientoResponseDTO {

    private Long id;

    private TipoMantenimiento tipo;

    private String titulo;

    private String descripcion;

    private LocalDate fecha;

    private Integer kilometros;

    private BigDecimal precio;

    private String notas;

    private Long vehiculoId;

    // Datos del gasto asociado
    private Long categoriaId;

    private String categoriaNombre;

    private MetodoPago metodoPago;

    // Gasto que crea el registro y ticket (foto) guardado con él; ticketId es null si no tiene
    private Long gastoId;
    private Long ticketId;
}
