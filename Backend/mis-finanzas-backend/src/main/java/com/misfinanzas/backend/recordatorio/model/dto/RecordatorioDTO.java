package com.misfinanzas.backend.recordatorio.model.dto;

import com.misfinanzas.backend.recordatorio.model.Repeticion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

// Alta, edición y respuesta (en la respuesta llega también el id)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordatorioDTO {

    private Long id;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 100, message = "El título no puede superar los 100 caracteres")
    private String titulo;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @Size(max = 255, message = "La nota no puede superar los 255 caracteres")
    private String nota;

    @NotNull(message = "La repetición es obligatoria")
    private Repeticion repeticion;
}
