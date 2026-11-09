package com.misfinanzas.backend.ingresoRecurrente.model;

import com.misfinanzas.backend.gastoRecurrente.model.Periodicidad;
import com.misfinanzas.backend.ingreso.model.CategoriaIngreso;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Ingreso que se repite (nómina, alquiler cobrado...). Funciona igual que GastoRecurrente: genera un Ingreso
// en cada fecha y avanza proximaFecha respetando el día de fechaInicio.
@Entity
@Table(name = "ingresos_recurrentes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IngresoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoIngreso metodoIngreso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Periodicidad periodicidad;

    @Column(nullable = false)
    private LocalDate proximaFecha;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @Column(nullable = false)
    private boolean activo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_ingreso_id", nullable = false)
    private CategoriaIngreso categoriaIngreso;
}
