package com.misfinanzas.backend.vehiculo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoResponseDTO {

    private Long id;

    private String nombre;

    private String marca;

    private String modelo;

    private String matricula;

    private Integer anio;

    private boolean activo;
    private Integer kilometrosIniciales;
}
