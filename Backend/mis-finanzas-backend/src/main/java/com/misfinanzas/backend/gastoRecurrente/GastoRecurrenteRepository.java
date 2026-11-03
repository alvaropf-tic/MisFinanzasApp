package com.misfinanzas.backend.gastoRecurrente;

import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GastoRecurrenteRepository extends JpaRepository<GastoRecurrente, Long> {

    List<GastoRecurrente> findByUsuarioId(Long usuarioId);

    Optional<GastoRecurrente> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCategoriaId(Long categoriaId);

    List<GastoRecurrente> findByUsuarioIdAndActivoTrue(Long usuarioId);

    List<GastoRecurrente> findByUsuarioAndActivoTrue(Usuario usuario);

}
