package com.misfinanzas.backend.usuario;

import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.usuario.model.dto.CambioPasswordDTO;
import com.misfinanzas.backend.usuario.model.dto.EliminarCuentaDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioActualizarDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioRegistroDTO;
import com.misfinanzas.backend.usuario.model.dto.UsuarioResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    private final CuentaService cuentaService;

    public UsuarioController(UsuarioService usuarioService, CuentaService cuentaService) {
        this.cuentaService = cuentaService;
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crearUsuario(@Valid @RequestBody UsuarioRegistroDTO registroDTO){
        UsuarioResponseDTO usuario = usuarioService.crearUsuario(registroDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> obtenerPerfil(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(usuarioService.obtenerPerfil(usuario));
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> actualizarPerfil(@Valid @RequestBody UsuarioActualizarDTO actualizarDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(usuarioService.actualizarPerfil(actualizarDTO, usuario));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambioPasswordDTO cambioPasswordDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        usuarioService.cambiarPassword(cambioPasswordDTO, usuario);

        return ResponseEntity.noContent().build();
    }

    // Borra la cuenta y todos sus datos (gastos, vehículos, fotos de tickets...). 400 si la contraseña no es correcta
    @PostMapping("/me/eliminar")
    public ResponseEntity<Void> eliminarCuenta(@Valid @RequestBody EliminarCuentaDTO dto, Authentication authentication) {

        cuentaService.eliminarCuenta(dto.getPassword(), (Usuario) authentication.getPrincipal());

        return ResponseEntity.noContent().build();
    }
}
