package com.misfinanzas.backend.objetivo.model;

import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Meta de ahorro (vacaciones, colchón, coche...). Lo ahorrado es la suma de sus aportaciones; no son gastos.
@Entity
@Table(name = "objetivos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Objetivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal importeObjetivo;

    // Opcional: sin fecha no se calcula cuánto ahorrar al mes
    private LocalDate fechaLimite;

    // Nombre de un icono de la app (ionicons), elegido de una lista corta
    @Column(length = 40)
    private String icono;

    @Column(nullable = false)
    private LocalDate creadoEn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Al borrar el objetivo se borran sus aportaciones
    @OneToMany(mappedBy = "objetivo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha DESC, id DESC")
    private List<Aportacion> aportaciones = new ArrayList<>();
}
