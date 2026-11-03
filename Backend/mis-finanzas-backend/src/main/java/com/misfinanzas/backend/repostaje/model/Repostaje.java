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

    @Column(nullable = false)
    private Integer kilometros;

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
