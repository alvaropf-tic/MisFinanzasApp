package com.misfinanzas.backend.auth;

import com.misfinanzas.backend.common.exception.CredencialesInvalidasException;
import com.misfinanzas.backend.auth.model.dto.LoginDTO;
import com.misfinanzas.backend.auth.model.dto.LoginResponseDTO;
import com.misfinanzas.backend.usuario.UsuarioRepository;
import com.misfinanzas.backend.usuario.model.Usuario;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MeterRegistry meterRegistry;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            MeterRegistry meterRegistry) {

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.meterRegistry = meterRegistry;
    }

    public LoginResponseDTO login(LoginDTO loginDTO) {

        Usuario usuario = usuarioRepository
                .findByNombreUsuario(loginDTO.getNombreUsuario())
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(
                loginDTO.getPassword(),
                usuario.getPassword())) {

            contarLogin("fallido");

            throw new CredencialesInvalidasException(
                    "Usuario o contraseña incorrectos"
            );
        }

        contarLogin("ok");

        String token = jwtService.generarToken(usuario);

        return new LoginResponseDTO(
                token,
                usuario.getId(),
                usuario.getNombreUsuario(),
                usuario.getRol()
        );
    }

    // En Prometheus: misfinanzas_logins_total{resultado="ok|fallido"}
    private void contarLogin(String resultado) {

        meterRegistry.counter("misfinanzas.logins", "resultado", resultado).increment();
    }
}
