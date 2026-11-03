package com.misfinanzas.backend.usuario;

import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    Optional<Usuario> findByCorreo(String correo);

    //Comprobar si existe este usuario
    boolean existsByNombreUsuario(String nombreUsuario);

    //Comprobar si existe este correo
    boolean existsByCorreo(String correo);
}
