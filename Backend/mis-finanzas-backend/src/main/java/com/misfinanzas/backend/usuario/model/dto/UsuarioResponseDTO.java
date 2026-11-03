package com.misfinanzas.backend.usuario.model.dto;

import com.misfinanzas.backend.usuario.model.Rol;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDTO {

    private Long id;
    private String nombre;
    private String apellidos;
    private String nombreUsuario;
    private String correo;
    private Rol rol;
}
