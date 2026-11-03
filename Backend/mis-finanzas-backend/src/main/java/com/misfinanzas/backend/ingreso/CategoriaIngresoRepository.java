package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.ingreso.model.CategoriaIngreso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaIngresoRepository extends JpaRepository<CategoriaIngreso, Long> {

    List<CategoriaIngreso> findByUsuarioId(Long usuarioId);

    Optional<CategoriaIngreso> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByNombreAndUsuarioId(String nombre, Long usuarioId);
}
