package com.misfinanzas.backend.objetivo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Dinero que se aparta para un objetivo (positivo) o que se saca de él (negativo)
@Entity
@Table(name = "aportaciones_objetivo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Aportacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(length = 255)
    private String nota;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "objetivo_id", nullable = false)
    private Objetivo objetivo;
}
