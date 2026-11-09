package com.misfinanzas.backend.objetivo;

import com.misfinanzas.backend.objetivo.model.Objetivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ObjetivoRepository extends JpaRepository<Objetivo, Long> {

    List<Objetivo> findByUsuarioIdOrderByCreadoEnDescIdDesc(Long usuarioId);

    Optional<Objetivo> findByIdAndUsuarioId(Long id, Long usuarioId);
}
