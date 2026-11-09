package com.misfinanzas.backend.ia;

import com.misfinanzas.backend.ia.model.dto.ChatPeticionDTO;
import com.misfinanzas.backend.ia.model.dto.ChatRespuestaDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ia")
public class AsistenteController {

    private final AsistenteService asistenteService;

    public AsistenteController(AsistenteService asistenteService) {
        this.asistenteService = asistenteService;
    }

    // Chat sobre las finanzas del usuario: la IA responde con un resumen de sus datos como contexto
    @PostMapping("/chat")
    public ResponseEntity<ChatRespuestaDTO> chat(@Valid @RequestBody ChatPeticionDTO peticion, Authentication authentication) {

        return ResponseEntity.ok(asistenteService.responder(peticion, (Usuario) authentication.getPrincipal()));
    }
}
