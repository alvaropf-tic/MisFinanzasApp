package com.misfinanzas.backend.itv;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.itv.model.ITV;
import com.misfinanzas.backend.itv.model.dto.ITVRegistroDTO;
import com.misfinanzas.backend.itv.model.dto.ITVResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ITVService {

    private final ITVRepository itvRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;

    public ITVService(ITVRepository itvRepository, VehiculoRepository vehiculoRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository) {

        this.itvRepository = itvRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public ITVResponseDTO crearITV(Long vehiculoId, ITVRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        ITV itv = new ITV();

        itv.setFecha(registroDTO.getFecha());
        itv.setKilometros(registroDTO.getKilometros());
        itv.setResultado(registroDTO.getResultado());
        itv.setPrecio(registroDTO.getPrecio());
        itv.setNotas(registroDTO.getNotas());
        itv.setVehiculo(vehiculo);

        ITV itvGuardada = itvRepository.save(itv);

        Gasto gasto = new Gasto();

        gasto.setImporte(itvGuardada.getPrecio());

        gasto.setFecha(itvGuardada.getFecha().atStartOfDay());

        gasto.setDescripcion("ITV - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setItv(itvGuardada);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(itvGuardada);
    }

    @Transactional(readOnly = true)
    public List<ITVResponseDTO> obtenerITVs(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        return itvRepository.findByVehiculoOrderByFechaDesc(vehiculo).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public ITVResponseDTO obtenerITV(Long vehiculoId, Long itvId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        ITV itv = itvRepository.findByIdAndVehiculo(itvId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("ITV no encontrada"));

        return convertirAResponseDTO(itv);
    }

    @Transactional
    public ITVResponseDTO actualizarITV(Long vehiculoId, Long itvId, ITVRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        ITV itv = itvRepository.findByIdAndVehiculo(itvId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("ITV no encontrada"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        itv.setFecha(registroDTO.getFecha());
        itv.setKilometros(registroDTO.getKilometros());
        itv.setResultado(registroDTO.getResultado());
        itv.setPrecio(registroDTO.getPrecio());
        itv.setNotas(registroDTO.getNotas());

        ITV itvActualizada = itvRepository.save(itv);

        Gasto gasto = gastoRepository.findByItv(itvActualizada).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado a la ITV no encontrado"));

        gasto.setImporte(itvActualizada.getPrecio());

        gasto.setFecha(itvActualizada.getFecha().atStartOfDay());

        gasto.setDescripcion("ITV - " + vehiculo.getNombre());

        gasto.setMetodoPago(registroDTO.getMetodoPago());

        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(itvActualizada);
    }

    @Transactional
    public void eliminarITV(Long vehiculoId, Long itvId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        ITV itv = itvRepository.findByIdAndVehiculo(itvId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("ITV no encontrada"));

        gastoRepository.findByItv(itv).ifPresent(gastoRepository::delete);

        itvRepository.delete(itv);
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId,Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private ITVResponseDTO convertirAResponseDTO(ITV itv) {

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByItv(itv);

        return new ITVResponseDTO(
                itv.getId(),
                itv.getFecha(),
                itv.getKilometros(),
                itv.getResultado(),
                itv.getPrecio(),
                itv.getNotas(),
                itv.getVehiculo().getId(),
                gasto.map(g -> g.getCategoria().getId()).orElse(null),
                gasto.map(g -> g.getCategoria().getNombre()).orElse(null),
                gasto.map(Gasto::getMetodoPago).orElse(null)
        );
    }
}
