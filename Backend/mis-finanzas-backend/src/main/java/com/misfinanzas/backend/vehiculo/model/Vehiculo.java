package com.misfinanzas.backend.vehiculo.model;

import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehiculos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 50)
    private String marca;

    @Column(length = 50)
    private String modelo;

    @Column(length = 20)
    private String matricula;

    @Column(name = "anio")
    private Integer anio;

    // Km del cuentakilómetros al darlo de alta. Los km actuales se calculan sumando los trips de los repostajes.
    // null en vehículos creados antes de existir el campo (cuenta como 0).
    @Column(name = "kilometros_iniciales")
    private Integer kilometrosIniciales;

    @Column(nullable = false)
    private boolean activo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
