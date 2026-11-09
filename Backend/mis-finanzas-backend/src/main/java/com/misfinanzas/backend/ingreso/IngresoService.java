package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.common.dto.PaginaResponseDTO;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.common.util.PaginacionUtils;
import com.misfinanzas.backend.ingreso.model.CategoriaIngreso;
import com.misfinanzas.backend.ingreso.model.Ingreso;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import com.misfinanzas.backend.ingreso.model.dto.IngresoRegistroDTO;
import com.misfinanzas.backend.ingreso.model.dto.IngresoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class IngresoService {

    private final IngresoRepository ingresoRepository;
    private final CategoriaIngresoRepository categoriaIngresoRepository;

    public IngresoService(IngresoRepository ingresoRepository, CategoriaIngresoRepository categoriaIngresoRepository) {

        this.ingresoRepository = ingresoRepository;
        this.categoriaIngresoRepository = categoriaIngresoRepository;
    }

    public IngresoResponseDTO crearIngreso(IngresoRegistroDTO registroDTO, Usuario usuario) {

        CategoriaIngreso categoriaIngreso = obtenerCategoriaDelUsuario(registroDTO.getCategoriaIngresoId(), usuario);

        Ingreso ingreso = new Ingreso();

        ingreso.setImporte(registroDTO.getImporte());
        ingreso.setFecha(registroDTO.getFecha());
        ingreso.setDescripcion(registroDTO.getDescripcion());
        ingreso.setMetodoIngreso(registroDTO.getMetodoIngreso());
        ingreso.setUsuario(usuario);
        ingreso.setCategoriaIngreso(categoriaIngreso);

        Ingreso ingresoGuardado = ingresoRepository.save(ingreso);

        return convertirAResponseDTO(ingresoGuardado);
    }

    public PaginaResponseDTO<IngresoResponseDTO> obtenerIngresos(Usuario usuario, LocalDate desde, LocalDate hasta, Long categoriaIngresoId, MetodoIngreso metodoIngreso, String texto, int pagina, int tamanio) {

        PaginacionUtils.validarFechas(desde, hasta);

        return PaginaResponseDTO.desdePage(
                ingresoRepository.buscarIngresos(usuario.getId(), PaginacionUtils.inicioDelDia(desde), PaginacionUtils.finDelDia(hasta), categoriaIngresoId, metodoIngreso, PaginacionUtils.patronBusqueda(texto), PaginacionUtils.crearPaginaPorFecha(pagina, tamanio)).map(this::convertirAResponseDTO)
        );
    }

    public IngresoResponseDTO obtenerIngreso(Long id, Usuario usuario) {

        Ingreso ingreso = ingresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Ingreso no encontrado"));

        return convertirAResponseDTO(ingreso);
    }

    public IngresoResponseDTO actualizarIngreso(Long id, IngresoRegistroDTO registroDTO, Usuario usuario) {

        Ingreso ingreso = ingresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Ingreso no encontrado"));

        CategoriaIngreso categoriaIngreso = obtenerCategoriaDelUsuario(registroDTO.getCategoriaIngresoId(), usuario);

        ingreso.setImporte(registroDTO.getImporte());
        ingreso.setFecha(registroDTO.getFecha());
        ingreso.setDescripcion(registroDTO.getDescripcion());
        ingreso.setMetodoIngreso(registroDTO.getMetodoIngreso());
        ingreso.setCategoriaIngreso(categoriaIngreso);

        Ingreso ingresoActualizado = ingresoRepository.save(ingreso);

        return convertirAResponseDTO(ingresoActualizado);
    }

    public void eliminarIngreso(Long id, Usuario usuario) {

        Ingreso ingreso = ingresoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Ingreso no encontrado"));

        ingresoRepository.delete(ingreso);
    }

    private CategoriaIngreso obtenerCategoriaDelUsuario(Long categoriaIngresoId, Usuario usuario) {

        return categoriaIngresoRepository.findByIdAndUsuarioId(categoriaIngresoId,usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría de ingreso no encontrada"));
    }

    private IngresoResponseDTO convertirAResponseDTO(Ingreso ingreso) {

        return new IngresoResponseDTO(ingreso.getId(), ingreso.getImporte(), ingreso.getFecha(), ingreso.getDescripcion(), ingreso.getMetodoIngreso(), ingreso.getCategoriaIngreso().getId(), ingreso.getCategoriaIngreso().getNombre(), ingreso.getIngresoRecurrente() != null);
    }
}