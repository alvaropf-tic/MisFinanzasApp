package com.misfinanzas.backend.repostaje;

import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoRepository;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.repostaje.model.Repostaje;
import com.misfinanzas.backend.repostaje.model.dto.RepostajeRegistroDTO;
import com.misfinanzas.backend.repostaje.model.dto.RepostajeResponseDTO;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.VehiculoRepository;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RepostajeService {

    private final RepostajeRepository repostajeRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CategoriaRepository categoriaRepository;
    private final GastoRepository gastoRepository;

    public RepostajeService(RepostajeRepository repostajeRepository, VehiculoRepository vehiculoRepository, CategoriaRepository categoriaRepository, GastoRepository gastoRepository) {

        this.repostajeRepository = repostajeRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.categoriaRepository = categoriaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public RepostajeResponseDTO crearRepostaje(Long vehiculoId, RepostajeRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        BigDecimal precioLitro = registroDTO.getPrecioTotal().divide(registroDTO.getLitros(), 3, RoundingMode.HALF_UP);

        Repostaje repostaje = new Repostaje();

        repostaje.setFecha(registroDTO.getFecha());
        repostaje.setLitros(registroDTO.getLitros());
        repostaje.setPrecioTotal(registroDTO.getPrecioTotal());
        repostaje.setPrecioLitro(precioLitro);
        repostaje.setKilometros(registroDTO.getKilometros());
        repostaje.setConsumoOrdenador(registroDTO.getConsumoOrdenador());
        repostaje.setVelocidadMedia(registroDTO.getVelocidadMedia());
        repostaje.setNotas(registroDTO.getNotas());
        repostaje.setMetodoPago(registroDTO.getMetodoPago());
        repostaje.setVehiculo(vehiculo);

        Repostaje repostajeGuardado = repostajeRepository.save(repostaje);

        Gasto gasto = new Gasto();

        gasto.setImporte(repostajeGuardado.getPrecioTotal());
        gasto.setFecha(repostajeGuardado.getFecha().atStartOfDay());
        gasto.setDescripcion("Repostaje - " + vehiculo.getNombre());
        gasto.setMetodoPago(repostajeGuardado.getMetodoPago());
        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setRepostaje(repostajeGuardado);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(repostajeGuardado);
    }

    @Transactional(readOnly = true)
    public List<RepostajeResponseDTO> obtenerRepostajes(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        return repostajeRepository.findByVehiculoOrderByFechaDesc(vehiculo).stream().map(this::convertirAResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public RepostajeResponseDTO obtenerRepostaje(Long vehiculoId, Long repostajeId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Repostaje repostaje = repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        return convertirAResponseDTO(repostaje);
    }

    @Transactional
    public RepostajeResponseDTO actualizarRepostaje(Long vehiculoId, Long repostajeId, RepostajeRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Repostaje repostaje = repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        BigDecimal precioLitro = registroDTO.getPrecioTotal().divide(registroDTO.getLitros(), 3, RoundingMode.HALF_UP);

        repostaje.setFecha(registroDTO.getFecha());
        repostaje.setLitros(registroDTO.getLitros());
        repostaje.setPrecioTotal(registroDTO.getPrecioTotal());
        repostaje.setPrecioLitro(precioLitro);
        repostaje.setKilometros(registroDTO.getKilometros());
        repostaje.setConsumoOrdenador(registroDTO.getConsumoOrdenador());
        repostaje.setVelocidadMedia(registroDTO.getVelocidadMedia());
        repostaje.setNotas(registroDTO.getNotas());
        repostaje.setMetodoPago(registroDTO.getMetodoPago());

        Repostaje repostajeActualizado = repostajeRepository.save(repostaje);

        Gasto gasto = gastoRepository.findByRepostaje(repostajeActualizado).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado al repostaje no encontrado"));

        gasto.setImporte(repostajeActualizado.getPrecioTotal());

        gasto.setFecha(repostajeActualizado.getFecha().atStartOfDay());

        gasto.setDescripcion("Repostaje - " + vehiculo.getNombre());

        gasto.setMetodoPago(repostajeActualizado.getMetodoPago());

        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return convertirAResponseDTO(repostajeActualizado);
    }

    @Transactional
    public void eliminarRepostaje(Long vehiculoId, Long repostajeId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Repostaje repostaje = repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        gastoRepository.findByRepostaje(repostaje).ifPresent(gastoRepository::delete);

        repostajeRepository.delete(repostaje);
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private RepostajeResponseDTO convertirAResponseDTO(Repostaje repostaje) {

        Repostaje repostajeAnterior = repostajeRepository.findFirstByVehiculoAndFechaBeforeOrderByFechaDesc(repostaje.getVehiculo(), repostaje.getFecha()).orElse(null);

        Integer kilometrosRecorridos = null;
        BigDecimal consumoReal = null;
        BigDecimal costePorKilometro = null;

        if (repostajeAnterior != null && repostaje.getKilometros()> repostajeAnterior.getKilometros()) {

            kilometrosRecorridos = repostaje.getKilometros() - repostajeAnterior.getKilometros();

            consumoReal = repostaje.getLitros().multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(kilometrosRecorridos), 2, RoundingMode.HALF_UP);

            costePorKilometro = repostaje.getPrecioTotal().divide(BigDecimal.valueOf(kilometrosRecorridos), 3, RoundingMode.HALF_UP);
        }

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByRepostaje(repostaje);

        return new RepostajeResponseDTO(repostaje.getId(), repostaje.getFecha(),repostaje.getLitros(), repostaje.getPrecioTotal(), repostaje.getPrecioLitro(), repostaje.getKilometros(), repostaje.getConsumoOrdenador(), repostaje.getVelocidadMedia(), repostaje.getNotas(), repostaje.getVehiculo().getId(), gasto.map(g -> g.getCategoria().getId()).orElse(null), gasto.map(g -> g.getCategoria().getNombre()).orElse(null), gasto.map(Gasto::getMetodoPago).orElse(null), kilometrosRecorridos, consumoReal, costePorKilometro);
    }
}