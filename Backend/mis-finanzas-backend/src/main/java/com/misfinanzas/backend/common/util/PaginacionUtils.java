package com.misfinanzas.backend.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class PaginacionUtils {

    public static final int TAMANIO_MAXIMO = 100;

    private PaginacionUtils() {
    }

    // Ordena por fecha descendente (y por id para que el orden sea estable con fechas iguales)
    public static Pageable crearPaginaPorFecha(int pagina, int tamanio) {

        if (pagina < 0) {
            throw new IllegalArgumentException("La página no puede ser negativa");
        }

        if (tamanio < 1 || tamanio > TAMANIO_MAXIMO) {
            throw new IllegalArgumentException("El tamaño de página debe estar entre 1 y " + TAMANIO_MAXIMO);
        }

        return PageRequest.of(pagina, tamanio, Sort.by(Sort.Direction.DESC, "fecha", "id"));
    }

    public static void validarFechas(LocalDate desde, LocalDate hasta) {

        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new IllegalArgumentException("La fecha 'desde' no puede ser posterior a 'hasta'");
        }
    }

    // desde incluido: desde las 00:00 de ese día
    public static LocalDateTime inicioDelDia(LocalDate fecha) {

        return fecha == null ? null : fecha.atStartOfDay();
    }

    // hasta incluido: hasta las 00:00 del día siguiente (sin incluirlo)
    public static LocalDateTime finDelDia(LocalDate fecha) {

        return fecha == null ? null : fecha.plusDays(1).atStartOfDay();
    }

    // Convierte el texto de búsqueda en un patrón LIKE, o null si no se busca nada
    public static String patronBusqueda(String texto) {

        return texto == null || texto.isBlank() ? null : "%" + texto.trim().toLowerCase() + "%";
    }
}
