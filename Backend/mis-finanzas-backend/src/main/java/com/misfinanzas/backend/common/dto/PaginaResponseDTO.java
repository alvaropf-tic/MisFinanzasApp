package com.misfinanzas.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

// Respuesta paginada propia: Spring desaconseja devolver Page directamente en la API
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaginaResponseDTO<T> {

    private List<T> contenido;
    private int pagina;
    private int tamanio;
    private long totalElementos;
    private int totalPaginas;

    public static <T> PaginaResponseDTO<T> desdePage(Page<T> page) {

        return new PaginaResponseDTO<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
