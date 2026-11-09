package com.misfinanzas.backend.repostaje.model;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "repostajes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Repostaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal litros;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioTotal;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal precioLitro;

    // Cuentakilómetros en este repostaje. Lo calcula RepostajeService: km iniciales del vehículo + trips,
    // o la lectura real si se dio. Se recalcula para todo el vehículo al cambiar cualquier repostaje.
    @Column(nullable = false)
    private Integer kilometros;

    // Km hechos con el depósito anterior (el trip que se pone a cero al repostar)
    private Integer kilometrosRecorridos;

    // Lectura real del cuentakilómetros, opcional: corrige la cuenta a partir de aquí
    private Integer cuentakilometros;

    // Si se llenó el depósito. El consumo real solo se calcula de lleno a lleno. null en los antiguos (= lleno).
    private Boolean lleno;

    private BigDecimal consumoOrdenador;

    private BigDecimal velocidadMedia;

    @Column(length = 500)
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoPago metodoPago;
}
