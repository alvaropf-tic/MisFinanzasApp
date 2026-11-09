package com.misfinanzas.backend.ia.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

// Pregunta al asistente. El historial lo guarda la app (no se persiste) y solo se usan los últimos mensajes
@Getter
@Setter
@NoArgsConstructor
public class ChatPeticionDTO {

    @NotBlank
    @Size(max = 500)
    private String pregunta;

    @Valid
    private List<ChatMensajeDTO> historial = new ArrayList<>();

    // Código de la moneda en la que el usuario ve los importes (EUR por defecto)
    @Size(max = 3)
    private String moneda;
}
