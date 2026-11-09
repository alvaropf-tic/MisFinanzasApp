package com.misfinanzas.backend.recordatorio.model;

import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

// Aviso en el calendario (seguro del coche, revisión, renovar el DNI...). Puede repetirse cada mes o cada año
@Entity
@Table(name = "recordatorios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Recordatorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String titulo;

    // Primera vez; si se repite, las siguientes caen el mismo día de cada mes o año
    @Column(nullable = false)
    private LocalDate fecha;

    @Column(length = 255)
    private String nota;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Repeticion repeticion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
