package com.misfinanzas.backend.neumatico;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.neumatico.model.Neumatico;
import com.misfinanzas.backend.neumatico.model.dto.NeumaticoRegistroDTO;
import com.misfinanzas.backend.neumatico.model.dto.NeumaticoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NeumaticoService {

    private final NeumaticoRepository neumaticoRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;

    public NeumaticoService(NeumaticoRepository neumaticoRepository, VehiculoRepository vehiculoRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository) {

        this.neumaticoRepository = neumaticoRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public NeumaticoResponseDTO crearNeumatico(Long vehiculoId, NeumaticoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        Neumatico neumatico = new Neumatico();

        neumatico.setFecha(registroDTO.getFecha());
        neumatico.setKilometros(registroDTO.getKilometros());
        neumatico.setPosicion(registroDTO.getPosicion());
        neumatico.setPrecio(registroDTO.getPrecio());
        neumatico.setNotas(registroDTO.getNotas());
        neumatico.setVehiculo(vehiculo);

        Neumatico neumaticoGuardado = neumaticoRepository.save(neumatico);

        Gasto gasto = new Gasto();

        gasto.setImporte(neumaticoGuardado.getPrecio());

        gasto.setFecha(neumaticoGuardado.getFecha().atStartOfDay());

        gasto.setDescripcion("Cambio de neumáticos - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setNeumatico(neumaticoGuardado);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(neumaticoGuardado);
    }

    @Transactional(readOnly = true)
    public List<NeumaticoResponseDTO> obtenerNeumaticos(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        return neumaticoRepository.findByVehiculoOrderByFechaDesc(vehiculo).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public NeumaticoResponseDTO obtenerNeumatico(Long vehiculoId, Long neumaticoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Neumatico neumatico = neumaticoRepository.findByIdAndVehiculo(neumaticoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de neumáticos no encontrado"));

        return convertirAResponseDTO(neumatico);
    }

    @Transactional
    public NeumaticoResponseDTO actualizarNeumatico(Long vehiculoId, Long neumaticoId, NeumaticoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Neumatico neumatico = neumaticoRepository.findByIdAndVehiculo(neumaticoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de neumáticos no encontrado"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        neumatico.setFecha(registroDTO.getFecha());
        neumatico.setKilometros(registroDTO.getKilometros());
        neumatico.setPosicion(registroDTO.getPosicion());
        neumatico.setPrecio(registroDTO.getPrecio());
        neumatico.setNotas(registroDTO.getNotas());

        Neumatico neumaticoActualizado = neumaticoRepository.save(neumatico);

        Gasto gasto = gastoRepository.findByNeumatico(neumaticoActualizado).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado al cambio de neumáticos no encontrado"));

        gasto.setImporte(neumaticoActualizado.getPrecio());

        gasto.setFecha(neumaticoActualizado.getFecha().atStartOfDay());

        gasto.setDescripcion("Cambio de neumáticos - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(neumaticoActualizado);
    }

    @Transactional
    public void eliminarNeumatico(Long vehiculoId, Long neumaticoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Neumatico neumatico = neumaticoRepository.findByIdAndVehiculo(neumaticoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Cambio de neumáticos no encontrado"));

        gastoRepository.findByNeumatico(neumatico).ifPresent(gastoRepository::delete);

        neumaticoRepository.delete(neumatico);
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private NeumaticoResponseDTO convertirAResponseDTO(Neumatico neumatico) {

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByNeumatico(neumatico);

        return new NeumaticoResponseDTO(
                neumatico.getId(),
                neumatico.getFecha(),
                neumatico.getKilometros(),
                neumatico.getPosicion(),
                neumatico.getPrecio(),
                neumatico.getNotas(),
                neumatico.getVehiculo().getId(),
                gasto.map(g -> g.getCategoria().getId()).orElse(null),
                gasto.map(g -> g.getCategoria().getNombre()).orElse(null),
                gasto.map(Gasto::getMetodoPago).orElse(null)
        );
    }
}
