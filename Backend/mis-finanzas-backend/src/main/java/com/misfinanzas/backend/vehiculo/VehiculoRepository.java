package com.misfinanzas.backend.vehiculo;

import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    List<Vehiculo> findByUsuario(Usuario usuario);

    Optional<Vehiculo> findByIdAndUsuario(Long id, Usuario usuario);

    long countByUsuario(Usuario usuario);
}
