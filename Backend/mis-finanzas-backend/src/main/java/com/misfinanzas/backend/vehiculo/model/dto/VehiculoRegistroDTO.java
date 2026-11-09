package com.misfinanzas.backend.vehiculo.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoRegistroDTO {

    @NotBlank(message = "El nombre del vehículo es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @Size(max = 50, message = "La marca no puede superar los 50 caracteres")
    private String marca;

    @Size(max = 50, message = "El modelo no puede superar los 50 caracteres")
    private String modelo;

    @Size(max = 20, message = "La matrícula no puede superar los 20 caracteres")
    private String matricula;

    private Integer anio;

    @NotNull(message = "Indica los kilómetros que tiene ahora el vehículo")
    @Min(value = 0, message = "Los kilómetros no pueden ser negativos")
    private Integer kilometrosIniciales;
}
