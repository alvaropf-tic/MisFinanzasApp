package com.misfinanzas.backend.presupuesto;

import com.misfinanzas.backend.presupuesto.model.Presupuesto;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {

    Optional<Presupuesto> findByUsuarioAndMesAndAnio(Usuario usuario, Integer mes, Integer anio);

    Optional<Presupuesto> findByIdAndUsuario(Long id, Usuario usuario);
}
