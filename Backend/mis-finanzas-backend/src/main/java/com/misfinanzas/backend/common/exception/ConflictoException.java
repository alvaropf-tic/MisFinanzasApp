package com.misfinanzas.backend.common.exception;

// 409: la operación choca con el estado actual de los datos (duplicados, límites, recursos en uso)
public class ConflictoException extends RuntimeException {

    public ConflictoException(String mensaje) {
        super(mensaje);
    }
}
