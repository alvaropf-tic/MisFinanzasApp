package com.misfinanzas.backend.ingreso.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaIngresoResponseDTO {

    private Long id;
    private String nombre;
}
