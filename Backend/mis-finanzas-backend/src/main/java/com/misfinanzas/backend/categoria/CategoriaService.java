package com.misfinanzas.backend.categoria;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.categoria.model.dto.CategoriaRegistroDTO;
import com.misfinanzas.backend.categoria.model.dto.CategoriaResponseDTO;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gastoRecurrente.GastoRecurrenteRepository;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;
    private final GastoRecurrenteRepository gastoRecurrenteRepository;

    public CategoriaService(CategoriaRepository categoriaRepository, GastoRepository gastoRepository, GastoRecurrenteRepository gastoRecurrenteRepository) {
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
    }

    public CategoriaResponseDTO crearCategoria(CategoriaRegistroDTO registroDTO, Usuario usuario) {

        if (categoriaRepository.existsByNombreAndUsuarioId(registroDTO.getNombre(), usuario.getId())) {
            throw new ConflictoException("Ya tienes una categoría con ese nombre");
        }

        Categoria categoria = new Categoria();

        categoria.setNombre(registroDTO.getNombre());
        categoria.setUsuario(usuario);

        Categoria categoriaGuardada = categoriaRepository.save(categoria);

        return convertirAResponseDTO(categoriaGuardada);
    }

    public List<CategoriaResponseDTO> obtenerCategorias(Usuario usuario) {

        return categoriaRepository.findByUsuarioId(usuario.getId()).stream().map(this::convertirAResponseDTO).toList();
    }

    public CategoriaResponseDTO obtenerCategoria(Long id, Usuario usuario) {

        Categoria categoria = categoriaRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría no encontrada"
                        ));

        return convertirAResponseDTO(categoria);
    }

    public CategoriaResponseDTO actualizarCategoria(Long id, CategoriaRegistroDTO registroDTO, Usuario usuario) {

        Categoria categoria = categoriaRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría no encontrada"
                        ));

        if (!categoria.getNombre().equalsIgnoreCase(registroDTO.getNombre()) && categoriaRepository.existsByNombreAndUsuarioId(registroDTO.getNombre(), usuario.getId())) {
            throw new ConflictoException("Ya tienes una categoría con ese nombre");
        }

        categoria.setNombre(registroDTO.getNombre());

        Categoria categoriaActualizada = categoriaRepository.save(categoria);

        return convertirAResponseDTO(categoriaActualizada);
    }

    public void eliminarCategoria(Long id, Usuario usuario) {

        Categoria categoria = categoriaRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría no encontrada"
                        ));

        if (gastoRepository.existsByCategoriaId(categoria.getId()) || gastoRecurrenteRepository.existsByCategoriaId(categoria.getId())) {
            throw new ConflictoException("No se puede eliminar la categoría porque tiene gastos asociados");
        }

        categoriaRepository.delete(categoria);
    }

    private CategoriaResponseDTO convertirAResponseDTO(Categoria categoria) {

        return new CategoriaResponseDTO(categoria.getId(), categoria.getNombre());
    }
}
