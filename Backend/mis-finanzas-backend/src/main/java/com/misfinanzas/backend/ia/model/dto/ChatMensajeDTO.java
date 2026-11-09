package com.misfinanzas.backend.ia.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Un mensaje anterior de la conversación: "user" (el usuario) o "assistant" (la IA)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMensajeDTO {

    @Pattern(regexp = "user|assistant")
    private String rol;

    @NotBlank
    private String texto;
}
