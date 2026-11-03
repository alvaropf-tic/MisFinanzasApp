package com.misfinanzas.backend.auth;

import com.misfinanzas.backend.auth.model.dto.LoginDTO;
import com.misfinanzas.backend.auth.model.dto.LoginResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginDTO loginDTO) {

        LoginResponseDTO respuesta = authService.login(loginDTO);

        return ResponseEntity.ok(respuesta);
    }
}
