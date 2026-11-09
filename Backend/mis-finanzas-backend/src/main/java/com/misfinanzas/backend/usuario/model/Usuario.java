package com.misfinanzas.backend.usuario.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 30)
    private String nombreUsuario;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING) //Esto hace que en la BD no se guarde como 0 o 1, sino como ADMIN o USER
    @Column(nullable = false, length = 10)
    private Rol rol;

    // Cuándo aceptó los términos y la privacidad, y qué versión (null en cuentas creadas antes de pedirlo)
    private LocalDateTime terminosAceptadosEn;

    @Column(length = 20)
    private String versionTerminos;
}
