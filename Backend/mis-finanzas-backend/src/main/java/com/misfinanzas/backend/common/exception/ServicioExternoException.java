package com.misfinanzas.backend.common.exception;

import org.springframework.http.HttpStatus;

// Fallo de un servicio de fuera (la IA que lee los tickets): lleva el estado HTTP con el que se responde
public class ServicioExternoException extends RuntimeException {

    private final HttpStatus estado;

    public ServicioExternoException(HttpStatus estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public HttpStatus getEstado() {
        return estado;
    }
}
