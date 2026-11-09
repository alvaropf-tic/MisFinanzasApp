package com.misfinanzas.backend.vehiculo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Cifras de un vehículo para su tarjeta y su detalle. Los campos de consumo y coste son null sin datos suficientes.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoResumenDTO {

    private Long vehiculoId;

    // Km iniciales más los trips (o la última lectura del cuentakilómetros), o el mayor km de cualquier registro
    private Integer kilometrosActuales;

    private int repostajes;

    // l/100 km de los tramos de lleno a lleno
    private BigDecimal consumoMedio;

    // € de combustible por km en esos mismos tramos
    private BigDecimal costePorKilometro;

    // Importe total / litros totales de todos los repostajes
    private BigDecimal precioMedioLitro;

    // Suma de todos los registros del vehículo (repostajes, aceite, neumáticos, mantenimiento, ITV) en el año actual
    private BigDecimal gastadoAnio;

    private LocalDate ultimoRepostajeFecha;

    private LocalDate ultimaItvFecha;
    private String ultimaItvResultado;

    // Estimada con las reglas de España: desfavorable o negativa, 2 meses; hasta 10 años de antigüedad, cada 2 años;
    // después, cada año; sin ninguna ITV, a los 4 años (1 de enero, porque solo se sabe el año). null si no se puede saber
    private LocalDate proximaItvFecha;
}
