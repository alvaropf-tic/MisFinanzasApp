package com.misfinanzas.backend.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import tools.jackson.databind.exc.InvalidFormatException;
import tools.jackson.databind.exc.MismatchedInputException;

import java.util.Arrays;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> manejarNoEncontrado(RecursoNoEncontradoException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponse> manejarConflicto(ConflictoException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ErrorResponse> manejarCredenciales(CredencialesInvalidasException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> manejarIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex, HttpServletRequest request) {

        String mensaje = ex.getBindingResult().getFieldErrors().stream().findFirst().map(error -> error.getDefaultMessage()).orElse("Los datos enviados no son válidos");

        return construirRespuesta(HttpStatus.BAD_REQUEST, mensaje, request);
    }

    // JSON mal formado o con valores que no encajan en el DTO (enums, números, fechas)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> manejarJsonNoLegible(HttpMessageNotReadableException ex, HttpServletRequest request) {

        String mensaje = "El cuerpo de la petición no es un JSON válido";

        if (ex.getCause() instanceof InvalidFormatException invalidFormat) {

            String campo = obtenerCampo(invalidFormat);
            mensaje = "Valor no válido para '" + campo + "': " + invalidFormat.getValue();

            Class<?> tipo = invalidFormat.getTargetType();
            if (tipo != null && tipo.isEnum()) {
                String permitidos = Arrays.stream(tipo.getEnumConstants()).map(Object::toString).collect(Collectors.joining(", "));
                mensaje += ". Valores permitidos: " + permitidos;
            }

        } else if (ex.getCause() instanceof MismatchedInputException mismatched) {

            mensaje = "Valor no válido para '" + obtenerCampo(mismatched) + "'";
        }

        return construirRespuesta(HttpStatus.BAD_REQUEST, mensaje, request);
    }

    // Parámetro de la URL con un tipo incorrecto, p. ej. /api/gastos/abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> manejarTipoParametro(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String mensaje = "Valor no válido para '" + ex.getName() + "': " + ex.getValue();

        return construirRespuesta(HttpStatus.BAD_REQUEST, mensaje, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> manejarParametroFaltante(MissingServletRequestParameterException ex, HttpServletRequest request) {

        String mensaje = "Falta el parámetro obligatorio '" + ex.getParameterName() + "'";

        return construirRespuesta(HttpStatus.BAD_REQUEST, mensaje, request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> manejarRutaInexistente(NoResourceFoundException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.NOT_FOUND, "La ruta solicitada no existe", request);
    }

    // Método HTTP no soportado por la ruta, p. ej. PATCH /api/gastos
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarMetodoNoSoportado(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.METHOD_NOT_ALLOWED, "El método " + ex.getMethod() + " no está permitido en esta ruta", request);
    }

    // Content-Type incorrecto, p. ej. enviar JSON donde se espera una imagen
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarTipoContenido(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Tipo de contenido no soportado: " + ex.getContentType(), request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> manejarArchivoGrande(MaxUploadSizeExceededException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.CONTENT_TOO_LARGE, "El archivo supera el tamaño máximo permitido (5 MB)", request);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> manejarParteFaltante(MissingServletRequestPartException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.BAD_REQUEST, "Falta el archivo '" + ex.getRequestPartName() + "'", request);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> manejarMultipart(MultipartException ex, HttpServletRequest request) {

        return construirRespuesta(HttpStatus.BAD_REQUEST, "La petición no es un multipart/form-data válido", request);
    }

    // Red de seguridad: restricciones de la base de datos que no se hayan comprobado antes en el servicio
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> manejarIntegridad(DataIntegrityViolationException ex, HttpServletRequest request) {

        log.warn("Violación de integridad en {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());

        return construirRespuesta(HttpStatus.CONFLICT, "La operación no se puede realizar porque entra en conflicto con otros datos", request);
    }

    // Cualquier error no previsto: se registra la traza y nunca se envía al cliente
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarErrorGeneral(Exception ex, HttpServletRequest request) {

        log.error("Error no controlado en {}", request.getRequestURI(), ex);

        return construirRespuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Se ha producido un error interno", request);
    }

    private String obtenerCampo(MismatchedInputException ex) {

        return ex.getPath().stream().map(referencia -> referencia.getPropertyName() != null ? referencia.getPropertyName() : "[" + referencia.getIndex() + "]").collect(Collectors.joining("."));
    }

    private ResponseEntity<ErrorResponse> construirRespuesta(HttpStatus status, String mensaje, HttpServletRequest request) {

        return ResponseEntity.status(status).body(new ErrorResponse(status, mensaje, request.getRequestURI()));
    }
}
