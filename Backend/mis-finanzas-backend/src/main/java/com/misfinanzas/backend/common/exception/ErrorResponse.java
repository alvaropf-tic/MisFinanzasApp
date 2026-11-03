package com.misfinanzas.backend.common.exception;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@JsonPropertyOrder({"timestamp", "status", "error", "mensaje", "path"})
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String mensaje;
    private String path;

    public ErrorResponse(HttpStatus status, String mensaje, String path) {
        this(LocalDateTime.now(), status.value(), status.getReasonPhrase(), mensaje, path);
    }
}
