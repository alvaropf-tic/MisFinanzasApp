package com.misfinanzas.backend.mantenimiento;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.mantenimiento.model.Mantenimiento;
import com.misfinanzas.backend.mantenimiento.model.dto.MantenimientoRegistroDTO;
import com.misfinanzas.backend.mantenimiento.model.dto.MantenimientoResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MantenimientoService {

    private final MantenimientoRepository mantenimientoRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;

    public MantenimientoService(MantenimientoRepository mantenimientoRepository, VehiculoRepository vehiculoRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository) {

        this.mantenimientoRepository = mantenimientoRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public MantenimientoResponseDTO crearMantenimiento(Long vehiculoId, MantenimientoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        Mantenimiento mantenimiento = new Mantenimiento();

        mantenimiento.setTitulo(registroDTO.getTitulo());
        mantenimiento.setDescripcion(registroDTO.getDescripcion());
        mantenimiento.setFecha(registroDTO.getFecha());
        mantenimiento.setKilometros(registroDTO.getKilometros());
        mantenimiento.setPrecio(registroDTO.getPrecio());
        mantenimiento.setNotas(registroDTO.getNotas());
        mantenimiento.setTipo(registroDTO.getTipo());
        mantenimiento.setVehiculo(vehiculo);

        Mantenimiento mantenimientoGuardado = mantenimientoRepository.save(mantenimiento);

        Gasto gasto = new Gasto();

        gasto.setImporte(mantenimientoGuardado.getPrecio());

        gasto.setFecha(mantenimientoGuardado.getFecha().atStartOfDay());

        gasto.setDescripcion(mantenimientoGuardado.getTitulo() + " - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setMantenimiento(mantenimientoGuardado);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(mantenimientoGuardado);
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponseDTO> obtenerMantenimientos(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        return mantenimientoRepository.findByVehiculoOrderByFechaDesc(vehiculo).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public MantenimientoResponseDTO obtenerMantenimiento(Long vehiculoId, Long mantenimientoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Mantenimiento mantenimiento = mantenimientoRepository.findByIdAndVehiculo(mantenimientoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Mantenimiento no encontrado"));

        return convertirAResponseDTO(mantenimiento);
    }

    @Transactional
    public MantenimientoResponseDTO actualizarMantenimiento(Long vehiculoId, Long mantenimientoId, MantenimientoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Mantenimiento mantenimiento = mantenimientoRepository.findByIdAndVehiculo(mantenimientoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Mantenimiento no encontrado"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        mantenimiento.setTitulo(registroDTO.getTitulo());
        mantenimiento.setDescripcion(registroDTO.getDescripcion());
        mantenimiento.setFecha(registroDTO.getFecha());
        mantenimiento.setKilometros(registroDTO.getKilometros());
        mantenimiento.setPrecio(registroDTO.getPrecio());
        mantenimiento.setNotas(registroDTO.getNotas());
        mantenimiento.setTipo(registroDTO.getTipo());

        Mantenimiento mantenimientoActualizado = mantenimientoRepository.save(mantenimiento);

        Gasto gasto = gastoRepository.findByMantenimiento(mantenimientoActualizado).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado al mantenimiento no encontrado"));

        gasto.setImporte(mantenimientoActualizado.getPrecio());

        gasto.setFecha(mantenimientoActualizado.getFecha().atStartOfDay());

        gasto.setDescripcion(mantenimientoActualizado.getTitulo() + " - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(mantenimientoActualizado);
    }

    @Transactional
    public void eliminarMantenimiento(Long vehiculoId, Long mantenimientoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Mantenimiento mantenimiento = mantenimientoRepository.findByIdAndVehiculo(mantenimientoId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Mantenimiento no encontrado"));

        gastoRepository.findByMantenimiento(mantenimiento).ifPresent(gastoRepository::delete);

        mantenimientoRepository.delete(mantenimiento);
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private MantenimientoResponseDTO convertirAResponseDTO(Mantenimiento mantenimiento) {

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByMantenimiento(mantenimiento);

        return new MantenimientoResponseDTO(
                mantenimiento.getId(),
                mantenimiento.getTipo(),
                mantenimiento.getTitulo(),
                mantenimiento.getDescripcion(),
                mantenimiento.getFecha(),
                mantenimiento.getKilometros(),
                mantenimiento.getPrecio(),
                mantenimiento.getNotas(),
                mantenimiento.getVehiculo().getId(),
                gasto.map(g -> g.getCategoria().getId()).orElse(null),
                gasto.map(g -> g.getCategoria().getNombre()).orElse(null),
                gasto.map(Gasto::getMetodoPago).orElse(null),
                gasto.map(Gasto::getId).orElse(null),
                gasto.map(g -> g.getTicket() != null ? g.getTicket().getId() : null).orElse(null)
        );
    }
}
