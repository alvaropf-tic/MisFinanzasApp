package com.misfinanzas.backend.ingresoRecurrente;

import com.misfinanzas.backend.ingresoRecurrente.model.IngresoRecurrente;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IngresoRecurrenteRepository extends JpaRepository<IngresoRecurrente, Long> {

    List<IngresoRecurrente> findByUsuarioId(Long usuarioId);

    Optional<IngresoRecurrente> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCategoriaIngresoId(Long categoriaIngresoId);

    List<IngresoRecurrente> findByUsuarioAndActivoTrue(Usuario usuario);
}
