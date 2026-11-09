package com.misfinanzas.backend.usuario.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Se pide la contraseña para confirmar que quien borra la cuenta es su dueño
@Getter
@Setter
@NoArgsConstructor
public class EliminarCuentaDTO {

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
