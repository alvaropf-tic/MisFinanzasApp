package com.misfinanzas.backend.common.exception;

// 404: el recurso no existe o no pertenece al usuario
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
