package com.misfinanzas.backend.objetivo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class ObjetivoResponseDTO {

    private Long id;
    private String nombre;
    private BigDecimal importeObjetivo;
    private LocalDate fechaLimite;
    private String icono;
    private LocalDate creadoEn;

    // Suma de las aportaciones (menos las retiradas)
    private BigDecimal ahorrado;

    // Lo que falta (0 si ya se alcanzó)
    private BigDecimal restante;

    // 0-100 (puede pasar de 100 si se ahorró de más)
    private int porcentaje;

    private boolean completado;

    // Con fecha límite y sin completar: lo que habría que apartar cada mes, contando el actual. null si no aplica
    private BigDecimal ahorroMensualNecesario;

    // Meses que quedan hasta la fecha límite (contando el actual); null sin fecha
    private Integer mesesRestantes;

    private List<AportacionResponseDTO> aportaciones;
}
