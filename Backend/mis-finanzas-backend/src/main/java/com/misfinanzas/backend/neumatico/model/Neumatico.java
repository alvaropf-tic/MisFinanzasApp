package com.misfinanzas.backend.neumatico.model;

import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cambios_neumaticos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Neumatico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private Integer kilometros;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PosicionNeumaticos posicion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(length = 500)
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;
}
