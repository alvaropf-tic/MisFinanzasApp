package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.ingreso.model.CategoriaIngreso;
import com.misfinanzas.backend.ingreso.model.dto.CategoriaIngresoRegistroDTO;
import com.misfinanzas.backend.ingreso.model.dto.CategoriaIngresoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaIngresoService {

    private final CategoriaIngresoRepository categoriaIngresoRepository;
    private final IngresoRepository ingresoRepository;

    public CategoriaIngresoService(CategoriaIngresoRepository categoriaIngresoRepository, IngresoRepository ingresoRepository) {
        this.categoriaIngresoRepository = categoriaIngresoRepository;
        this.ingresoRepository = ingresoRepository;
    }

    @Transactional
    public CategoriaIngresoResponseDTO crearCategoria(CategoriaIngresoRegistroDTO dto, Usuario usuario) {

        if (categoriaIngresoRepository.existsByNombreAndUsuarioId(dto.getNombre(), usuario.getId())) {

            throw new ConflictoException("Ya existe una categoría con ese nombre");
        }

        CategoriaIngreso categoria = new CategoriaIngreso();

        categoria.setNombre(dto.getNombre());
        categoria.setUsuario(usuario);

        categoria = categoriaIngresoRepository.save(categoria);

        return convertirAResponse(categoria);
    }

    @Transactional(readOnly = true)
    public List<CategoriaIngresoResponseDTO> obtenerCategorias(Usuario usuario) {

        return categoriaIngresoRepository.findByUsuarioId(usuario.getId()).stream().map(this::convertirAResponse).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaIngresoResponseDTO obtenerCategoria(Long id, Usuario usuario) {

        CategoriaIngreso categoria = categoriaIngresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));

        return convertirAResponse(categoria);
    }

    @Transactional
    public CategoriaIngresoResponseDTO actualizarCategoria(Long id, CategoriaIngresoRegistroDTO dto, Usuario usuario) {

        CategoriaIngreso categoria = categoriaIngresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));

        if (!categoria.getNombre().equals(dto.getNombre()) && categoriaIngresoRepository.existsByNombreAndUsuarioId(dto.getNombre(), usuario.getId())) {

            throw new ConflictoException("Ya existe una categoría con ese nombre");
        }

        categoria.setNombre(dto.getNombre());

        categoria = categoriaIngresoRepository.save(categoria);

        return convertirAResponse(categoria);
    }

    @Transactional
    public void eliminarCategoria(Long id, Usuario usuario) {

        CategoriaIngreso categoria = categoriaIngresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));

        if (ingresoRepository.existsByCategoriaIngresoId(categoria.getId())) {
            throw new ConflictoException("No se puede eliminar la categoría porque tiene ingresos asociados");
        }

        categoriaIngresoRepository.delete(categoria);
    }

    private CategoriaIngresoResponseDTO convertirAResponse(CategoriaIngreso categoria) {

        return new CategoriaIngresoResponseDTO(categoria.getId(), categoria.getNombre());
    }
}
