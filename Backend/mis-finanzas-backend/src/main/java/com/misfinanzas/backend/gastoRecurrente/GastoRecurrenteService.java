package com.misfinanzas.backend.gastoRecurrente;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteRegistroDTO;
import com.misfinanzas.backend.gastoRecurrente.model.dto.GastoRecurrenteResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GastoRecurrenteService {

    private final GastoRecurrenteRepository gastoRecurrenteRepository;
    private final CategoriaRepository categoriaRepository;

    public GastoRecurrenteService(GastoRecurrenteRepository gastoRecurrenteRepository, CategoriaRepository categoriaRepository) {

        this.gastoRecurrenteRepository = gastoRecurrenteRepository;
        this.categoriaRepository = categoriaRepository;
    }

    public GastoRecurrenteResponseDTO crearGastoRecurrente(GastoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        validarFechas(registroDTO);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        GastoRecurrente gastoRecurrente = new GastoRecurrente();

        gastoRecurrente.setImporte(registroDTO.getImporte());
        gastoRecurrente.setDescripcion(registroDTO.getDescripcion());
        gastoRecurrente.setMetodoPago(registroDTO.getMetodoPago());
        gastoRecurrente.setPeriodicidad(registroDTO.getPeriodicidad());
        gastoRecurrente.setProximaFecha(registroDTO.getProximaFecha());
        gastoRecurrente.setFechaInicio(registroDTO.getFechaInicio());
        gastoRecurrente.setFechaFin(registroDTO.getFechaFin());

        // Todo recurrente nuevo empieza activo
        gastoRecurrente.setActivo(true);

        gastoRecurrente.setUsuario(usuario);
        gastoRecurrente.setCategoria(categoria);

        GastoRecurrente guardado = gastoRecurrenteRepository.save(gastoRecurrente);

        return convertirAResponseDTO(guardado);
    }

    public List<GastoRecurrenteResponseDTO> obtenerGastosRecurrentes(Usuario usuario) {

        return gastoRecurrenteRepository.findByUsuarioId(usuario.getId()).stream().map(this::convertirAResponseDTO).toList();
    }

    public GastoRecurrenteResponseDTO obtenerGastoRecurrente(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        return convertirAResponseDTO(gastoRecurrente);
    }

    public GastoRecurrenteResponseDTO actualizarGastoRecurrente(Long id, GastoRecurrenteRegistroDTO registroDTO, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        validarFechas(registroDTO);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        gastoRecurrente.setImporte(registroDTO.getImporte());
        gastoRecurrente.setDescripcion(registroDTO.getDescripcion());
        gastoRecurrente.setMetodoPago(registroDTO.getMetodoPago());
        gastoRecurrente.setPeriodicidad(registroDTO.getPeriodicidad());
        gastoRecurrente.setProximaFecha(registroDTO.getProximaFecha());
        gastoRecurrente.setFechaInicio(registroDTO.getFechaInicio());
        gastoRecurrente.setFechaFin(registroDTO.getFechaFin());
        gastoRecurrente.setCategoria(categoria);

        GastoRecurrente actualizado = gastoRecurrenteRepository.save(gastoRecurrente);

        return convertirAResponseDTO(actualizado);
    }

    public void eliminarGastoRecurrente(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        gastoRecurrenteRepository.delete(gastoRecurrente);
    }

    public GastoRecurrenteResponseDTO cambiarEstado(Long id, Usuario usuario) {

        GastoRecurrente gastoRecurrente = gastoRecurrenteRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Gasto recurrente no encontrado"));

        gastoRecurrente.setActivo(!gastoRecurrente.isActivo());

        GastoRecurrente actualizado = gastoRecurrenteRepository.save(gastoRecurrente);

        return convertirAResponseDTO(actualizado);
    }

    private void validarFechas(GastoRecurrenteRegistroDTO registroDTO) {

        if (registroDTO.getFechaFin() != null && registroDTO.getFechaFin().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de finalización no puede ser anterior a la fecha de inicio");
        }

        if (registroDTO.getProximaFecha().isBefore(registroDTO.getFechaInicio())) {
            throw new IllegalArgumentException("La próxima fecha no puede ser anterior a la fecha de inicio");
        }
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private GastoRecurrenteResponseDTO convertirAResponseDTO(
            GastoRecurrente gastoRecurrente) {

        return new GastoRecurrenteResponseDTO(
                gastoRecurrente.getId(),
                gastoRecurrente.getImporte(),
                gastoRecurrente.getDescripcion(),
                gastoRecurrente.getMetodoPago(),
                gastoRecurrente.getPeriodicidad(),
                gastoRecurrente.getProximaFecha(),
                gastoRecurrente.getFechaInicio(),
                gastoRecurrente.getFechaFin(),
                gastoRecurrente.isActivo(),
                gastoRecurrente.getCategoria().getId(),
                gastoRecurrente.getCategoria().getNombre()
        );
    }
}
