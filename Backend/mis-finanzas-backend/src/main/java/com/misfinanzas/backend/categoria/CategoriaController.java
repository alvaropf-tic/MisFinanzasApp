package com.misfinanzas.backend.categoria;

import com.misfinanzas.backend.categoria.model.dto.CategoriaRegistroDTO;
import com.misfinanzas.backend.categoria.model.dto.CategoriaResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @PostMapping
    public ResponseEntity<CategoriaResponseDTO> crearCategoria(
            @Valid @RequestBody CategoriaRegistroDTO registroDTO,
            Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        CategoriaResponseDTO categoria = categoriaService.crearCategoria(registroDTO, usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(categoria);
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponseDTO>> obtenerCategorias(Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaService.obtenerCategorias(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponseDTO> obtenerCategoria(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaService.obtenerCategoria(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponseDTO> actualizarCategoria(@PathVariable Long id, @Valid @RequestBody CategoriaRegistroDTO registroDTO, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        return ResponseEntity.ok(categoriaService.actualizarCategoria(id, registroDTO, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Long id, Authentication authentication) {

        Usuario usuario = (Usuario) authentication.getPrincipal();

        categoriaService.eliminarCategoria(id, usuario);

        return ResponseEntity.noContent().build();
    }
}
