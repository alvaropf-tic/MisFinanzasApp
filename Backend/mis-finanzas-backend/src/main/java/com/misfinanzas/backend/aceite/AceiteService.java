package com.misfinanzas.backend.aceite;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.aceite.model.Aceite;
import com.misfinanzas.backend.aceite.model.dto.AceiteRegistroDTO;
import com.misfinanzas.backend.aceite.model.dto.AceiteResponseDTO;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AceiteService {

    private final AceiteRepository aceiteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;

    public AceiteService(AceiteRepository aceiteRepository, VehiculoRepository vehiculoRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository) {

        this.aceiteRepository = aceiteRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public AceiteResponseDTO crearAceite(Long vehiculoId, AceiteRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        Aceite aceite = new Aceite();

        aceite.setFecha(registroDTO.getFecha());
        aceite.setKilometros(registroDTO.getKilometros());
        aceite.setPrecio(registroDTO.getPrecio());
        aceite.setNotas(registroDTO.getNotas());
        aceite.setVehiculo(vehiculo);

        Aceite aceiteGuardado = aceiteRepository.save(aceite);

        Gasto gasto = new Gasto();

        gasto.setImporte(aceiteGuardado.getPrecio());

        gasto.setFecha(aceiteGuardado.getFecha().atStartOfDay());

        gasto.setDescripcion("Cambio de aceite - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setAceite(aceiteGuardado);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(aceiteGuardado);
    }

    @Transactional(readOnly = true)
    public List<AceiteResponseDTO> obtenerAceites(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        return aceiteRepository.findByVehiculoOrderByFechaDesc(vehiculo).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public AceiteResponseDTO obtenerAceite(Long vehiculoId, Long aceiteId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Aceite aceite = aceiteRepository.findByIdAndVehiculo(aceiteId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de aceite no encontrado"));

        return convertirAResponseDTO(aceite);
    }

    @Transactional
    public AceiteResponseDTO actualizarAceite(Long vehiculoId, Long aceiteId, AceiteRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Aceite aceite = aceiteRepository.findByIdAndVehiculo(aceiteId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de aceite no encontrado"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(),usuario);

        aceite.setFecha(registroDTO.getFecha());
        aceite.setKilometros(registroDTO.getKilometros());
        aceite.setPrecio(registroDTO.getPrecio());
        aceite.setNotas(registroDTO.getNotas());

        Aceite aceiteActualizado = aceiteRepository.save(aceite);

        Gasto gasto = gastoRepository.findByAceite(aceiteActualizado).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado al cambio de aceite no encontrado"));

        gasto.setImporte(aceiteActualizado.getPrecio());

        gasto.setFecha(aceiteActualizado.getFecha().atStartOfDay());

        gasto.setDescripcion("Cambio de aceite - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(aceiteActualizado);
    }

    @Transactional
    public void eliminarAceite(Long vehiculoId, Long aceiteId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Aceite aceite = aceiteRepository.findByIdAndVehiculo(aceiteId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de aceite no encontrado"));

        gastoRepository.findByAceite(aceite).ifPresent(gastoRepository::delete);

        aceiteRepository.delete(aceite);
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private AceiteResponseDTO convertirAResponseDTO(Aceite aceite) {

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByAceite(aceite);

        return new AceiteResponseDTO(
                aceite.getId(),
                aceite.getFecha(),
                aceite.getKilometros(),
                aceite.getPrecio(),
                aceite.getNotas(),
                aceite.getVehiculo().getId(),
                gasto.map(g -> g.getCategoria().getId()).orElse(null),
                gasto.map(g -> g.getCategoria().getNombre()).orElse(null),
                gasto.map(Gasto::getMetodoPago).orElse(null)
        );
    }
}
