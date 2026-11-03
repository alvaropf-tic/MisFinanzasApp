package com.misfinanzas.backend.auth.model.dto;

import com.misfinanzas.backend.usuario.model.Rol;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {

    private String token;
    private Long id;
    private String nombreUsuario;
    private Rol rol;
}
