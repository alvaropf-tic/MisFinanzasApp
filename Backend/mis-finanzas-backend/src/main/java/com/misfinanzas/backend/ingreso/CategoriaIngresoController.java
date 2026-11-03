package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.ingreso.model.dto.CategoriaIngresoRegistroDTO;
import com.misfinanzas.backend.ingreso.model.dto.CategoriaIngresoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias-ingreso")
public class CategoriaIngresoController {

    private final CategoriaIngresoService categoriaIngresoService;

    public CategoriaIngresoController(CategoriaIngresoService categoriaIngresoService) {

        this.categoriaIngresoService = categoriaIngresoService;
    }

    @PostMapping
    public ResponseEntity<CategoriaIngresoResponseDTO> crearCategoria(@Valid @RequestBody CategoriaIngresoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        CategoriaIngresoResponseDTO respuesta = categoriaIngresoService.crearCategoria(registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    @GetMapping
    public ResponseEntity<List<CategoriaIngresoResponseDTO>> obtenerCategorias(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaIngresoService.obtenerCategorias(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaIngresoResponseDTO> obtenerCategoria(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaIngresoService.obtenerCategoria(id, usuario) );
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaIngresoResponseDTO> actualizarCategoria(@PathVariable Long id, @Valid @RequestBody CategoriaIngresoRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaIngresoService.actualizarCategoria(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        categoriaIngresoService.eliminarCategoria(id, usuario);

        return ResponseEntity.noContent().build();
    }
}
