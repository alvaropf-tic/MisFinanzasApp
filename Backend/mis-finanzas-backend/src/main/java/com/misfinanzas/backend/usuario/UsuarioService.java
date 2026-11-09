package com.misfinanzas.backend.usuario;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.usuario.model.Rol;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.usuario.model.dto.CambioPasswordDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioActualizarDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioRegistroDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioResponseDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    // Cambiarla al modificar los textos de términos o privacidad (Frontend: pages/legal)
    public static final String VERSION_TERMINOS = "2026-11";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UsuarioResponseDTO crearUsuario(UsuarioRegistroDTO registroDTO) {
        if (usuarioRepository.existsByNombreUsuario(registroDTO.getNombreUsuario())){
            throw new ConflictoException("El nombre de usuario ya existe");
        }

        if (usuarioRepository.existsByCorreo(registroDTO.getCorreo())){
            throw new ConflictoException("El correo ya está registrado");
        }

        Usuario usuario = new Usuario();

        usuario.setNombre(registroDTO.getNombre());
        usuario.setApellidos(registroDTO.getApellidos());
        usuario.setNombreUsuario(registroDTO.getNombreUsuario());
        usuario.setCorreo(registroDTO.getCorreo());

        usuario.setPassword(passwordEncoder.encode(registroDTO.getPassword()));

        usuario.setRol(Rol.USER);

        // Solo llega aquí si aceptó (@AssertTrue en el DTO): se guarda cuándo y qué versión
        usuario.setTerminosAceptadosEn(java.time.LocalDateTime.now());
        usuario.setVersionTerminos(VERSION_TERMINOS);

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        return convertirAResponseDTO(usuarioGuardado);
    }

    public UsuarioResponseDTO obtenerPerfil(Usuario usuario) {

        return convertirAResponseDTO(obtenerUsuario(usuario));
    }

    public UsuarioResponseDTO actualizarPerfil(UsuarioActualizarDTO actualizarDTO, Usuario usuario) {

        Usuario usuarioActual = obtenerUsuario(usuario);

        // El correo puede ser el mismo que ya tenía, pero no el de otro usuario
        usuarioRepository.findByCorreo(actualizarDTO.getCorreo())
                .filter(existente -> !existente.getId().equals(usuarioActual.getId()))
                .ifPresent(existente -> {
                    throw new ConflictoException("El correo ya está registrado");
                });

        usuarioActual.setNombre(actualizarDTO.getNombre());
        usuarioActual.setApellidos(actualizarDTO.getApellidos());
        usuarioActual.setCorreo(actualizarDTO.getCorreo());

        Usuario usuarioActualizado = usuarioRepository.save(usuarioActual);

        return convertirAResponseDTO(usuarioActualizado);
    }

    public void cambiarPassword(CambioPasswordDTO cambioPasswordDTO, Usuario usuario) {

        Usuario usuarioActual = obtenerUsuario(usuario);

        // 400 y no 401: un 401 haría que el frontend cerrara la sesión
        if (!passwordEncoder.matches(cambioPasswordDTO.getPasswordActual(), usuarioActual.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }

        if (passwordEncoder.matches(cambioPasswordDTO.getPasswordNueva(), usuarioActual.getPassword())) {
            throw new IllegalArgumentException("La contraseña nueva debe ser distinta de la actual");
        }

        usuarioActual.setPassword(passwordEncoder.encode(cambioPasswordDTO.getPasswordNueva()));

        usuarioRepository.save(usuarioActual);
    }

    // Se vuelve a leer de la base de datos para trabajar con los datos más recientes
    private Usuario obtenerUsuario(Usuario usuario) {

        return usuarioRepository.findById(usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    public UsuarioResponseDTO convertirAResponseDTO(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellidos(),
                usuario.getNombreUsuario(),
                usuario.getCorreo(),
                usuario.getRol()
        );
    }
}
