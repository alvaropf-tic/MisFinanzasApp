package com.misfinanzas.backend.common.exception;

// 401: usuario o contraseña incorrectos
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException(String mensaje) {
        super(mensaje);
    }
}
