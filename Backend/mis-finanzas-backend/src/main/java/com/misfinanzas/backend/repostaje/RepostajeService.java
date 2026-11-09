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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RepostajeService {

    // Tramo de lleno a lleno: km, litros e importe (sumando los parciales de en medio)
    private record Tramo(int kilometros, BigDecimal litros, BigDecimal importe) {

        BigDecimal consumo() {
            return litros.multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(kilometros), 2, RoundingMode.HALF_UP);
        }

        BigDecimal costePorKilometro() {
            return importe.divide(BigDecimal.valueOf(kilometros), 3, RoundingMode.HALF_UP);
        }
    }

    // Cifras de combustible de un vehículo para su resumen. Los decimales son null sin datos suficientes.
    public record Estadisticas(int repostajes, Integer ultimosKilometros, BigDecimal consumoMedio, BigDecimal costePorKilometro, BigDecimal precioMedioLitro, LocalDate ultimaFecha) {
    }

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

        Repostaje repostaje = new Repostaje();

        repostaje.setVehiculo(vehiculo);
        // Provisional: recalcularKilometros pone el valor real justo después
        repostaje.setKilometros(0);
        copiarDatos(registroDTO, repostaje);

        Repostaje repostajeGuardado = repostajeRepository.save(repostaje);

        recalcularKilometros(vehiculo);

        Gasto gasto = new Gasto();

        gasto.setImporte(repostajeGuardado.getPrecioTotal());
        gasto.setFecha(repostajeGuardado.getFecha().atStartOfDay());
        gasto.setDescripcion("Repostaje - " + vehiculo.getNombre());
        gasto.setMetodoPago(repostajeGuardado.getMetodoPago());
        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setRepostaje(repostajeGuardado);

        gastoRepository.save(gasto);

        return buscarEnHistorial(vehiculo, repostajeGuardado.getId());
    }

    // Más reciente primero
    @Transactional(readOnly = true)
    public List<RepostajeResponseDTO> obtenerRepostajes(Long vehiculoId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        List<RepostajeResponseDTO> historial = new ArrayList<>(calcularHistorial(vehiculo));

        historial.sort(Comparator.comparing(RepostajeResponseDTO::getFecha).thenComparing(RepostajeResponseDTO::getId).reversed());

        return historial;
    }

    @Transactional(readOnly = true)
    public RepostajeResponseDTO obtenerRepostaje(Long vehiculoId, Long repostajeId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        return buscarEnHistorial(vehiculo, repostajeId);
    }

    @Transactional
    public RepostajeResponseDTO actualizarRepostaje(Long vehiculoId, Long repostajeId, RepostajeRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Repostaje repostaje = repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        copiarDatos(registroDTO, repostaje);

        Repostaje repostajeActualizado = repostajeRepository.save(repostaje);

        recalcularKilometros(vehiculo);

        Gasto gasto = gastoRepository.findByRepostaje(repostajeActualizado).orElseThrow(() -> new RecursoNoEncontradoException("Gasto asociado al repostaje no encontrado"));

        gasto.setImporte(repostajeActualizado.getPrecioTotal());
        gasto.setFecha(repostajeActualizado.getFecha().atStartOfDay());
        gasto.setDescripcion("Repostaje - " + vehiculo.getNombre());
        gasto.setMetodoPago(repostajeActualizado.getMetodoPago());
        gasto.setCategoria(categoria);

        gastoRepository.save(gasto);

        return buscarEnHistorial(vehiculo, repostajeId);
    }

    @Transactional
    public void eliminarRepostaje(Long vehiculoId, Long repostajeId, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoDelUsuario(vehiculoId, usuario);

        Repostaje repostaje = repostajeRepository.findByIdAndVehiculo(repostajeId, vehiculo).orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));

        gastoRepository.findByRepostaje(repostaje).ifPresent(gastoRepository::delete);

        repostajeRepository.delete(repostaje);
        repostajeRepository.flush();

        recalcularKilometros(vehiculo);
    }

    // Recalcula el cuentakilómetros de cada repostaje del vehículo, en orden: km iniciales + trips,
    // o la lectura real cuando la hay (que corrige la cuenta desde ahí). Lo usa también VehiculoService
    // cuando cambian los km iniciales.
    @Transactional
    public void recalcularKilometros(Vehiculo vehiculo) {

        int kilometros = vehiculo.getKilometrosIniciales() == null ? 0 : vehiculo.getKilometrosIniciales();

        List<Repostaje> repostajes = repostajeRepository.findByVehiculoOrderByFechaAscIdAsc(vehiculo);

        for (Repostaje repostaje : repostajes) {

            // Repostajes anteriores a los trips: sus km eran la lectura real, se conservan como tal
            if (repostaje.getKilometrosRecorridos() == null && repostaje.getCuentakilometros() == null) {
                repostaje.setCuentakilometros(repostaje.getKilometros());
            }

            kilometros = repostaje.getCuentakilometros() != null ? repostaje.getCuentakilometros() : kilometros + repostaje.getKilometrosRecorridos();

            repostaje.setKilometros(kilometros);
        }

        repostajeRepository.saveAll(repostajes);
    }

    @Transactional(readOnly = true)
    public Estadisticas calcularEstadisticas(Vehiculo vehiculo) {

        List<Repostaje> repostajes = repostajeRepository.findByVehiculoOrderByFechaAscIdAsc(vehiculo);

        if (repostajes.isEmpty()) {
            return new Estadisticas(0, null, null, null, null, null);
        }

        int kilometrosTramos = 0;
        BigDecimal litrosTramos = BigDecimal.ZERO;
        BigDecimal importeTramos = BigDecimal.ZERO;

        for (Tramo tramo : calcularTramos(repostajes).values()) {

            kilometrosTramos += tramo.kilometros();
            litrosTramos = litrosTramos.add(tramo.litros());
            importeTramos = importeTramos.add(tramo.importe());
        }

        BigDecimal litros = repostajes.stream().map(Repostaje::getLitros).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal importe = repostajes.stream().map(Repostaje::getPrecioTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        Tramo total = kilometrosTramos > 0 ? new Tramo(kilometrosTramos, litrosTramos, importeTramos) : null;

        Repostaje ultimo = repostajes.get(repostajes.size() - 1);

        return new Estadisticas(
                repostajes.size(),
                ultimo.getKilometros(),
                total == null ? null : total.consumo(),
                total == null ? null : total.costePorKilometro(),
                importe.divide(litros, 3, RoundingMode.HALF_UP),
                ultimo.getFecha()
        );
    }

    private void copiarDatos(RepostajeRegistroDTO registroDTO, Repostaje repostaje) {

        if (registroDTO.getKilometrosRecorridos() == null && registroDTO.getCuentakilometros() == null) {
            throw new IllegalArgumentException("Indica los km hechos con el depósito anterior (o los km del cuentakilómetros)");
        }

        // El precio por litro del surtidor se respeta; si no llega se calcula
        BigDecimal precioLitro = registroDTO.getPrecioLitro() != null ? registroDTO.getPrecioLitro() : registroDTO.getPrecioTotal().divide(registroDTO.getLitros(), 3, RoundingMode.HALF_UP);

        repostaje.setFecha(registroDTO.getFecha());
        repostaje.setLitros(registroDTO.getLitros());
        repostaje.setPrecioTotal(registroDTO.getPrecioTotal());
        repostaje.setPrecioLitro(precioLitro);
        repostaje.setKilometrosRecorridos(registroDTO.getKilometrosRecorridos());
        repostaje.setCuentakilometros(registroDTO.getCuentakilometros());
        repostaje.setLleno(registroDTO.getLleno() == null || registroDTO.getLleno());
        repostaje.setConsumoOrdenador(registroDTO.getConsumoOrdenador());
        repostaje.setVelocidadMedia(registroDTO.getVelocidadMedia());
        repostaje.setNotas(registroDTO.getNotas());
        repostaje.setMetodoPago(registroDTO.getMetodoPago());
    }

    private static boolean esLleno(Repostaje repostaje) {

        return repostaje.getLleno() == null || repostaje.getLleno();
    }

    // Tramos de lleno a lleno, por id del repostaje lleno que los cierra. Los km del tramo salen de sumar los trips
    // de sus repostajes; si alguno no tiene trip, de la diferencia de cuentakilómetros con el lleno anterior.
    private Map<Long, Tramo> calcularTramos(List<Repostaje> cronologico) {

        Map<Long, Tramo> tramos = new HashMap<>();

        List<Repostaje> segmento = new ArrayList<>();

        Repostaje llenoAnterior = null;

        for (Repostaje repostaje : cronologico) {

            segmento.add(repostaje);

            if (!esLleno(repostaje)) {
                continue;
            }

            Integer kilometros = null;

            if (segmento.stream().allMatch(r -> r.getKilometrosRecorridos() != null)) {
                kilometros = segmento.stream().mapToInt(Repostaje::getKilometrosRecorridos).sum();
            } else if (llenoAnterior != null) {
                kilometros = repostaje.getKilometros() - llenoAnterior.getKilometros();
            }

            if (kilometros != null && kilometros > 0) {

                BigDecimal litros = segmento.stream().map(Repostaje::getLitros).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal importe = segmento.stream().map(Repostaje::getPrecioTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

                tramos.put(repostaje.getId(), new Tramo(kilometros, litros, importe));
            }

            llenoAnterior = repostaje;
            segmento.clear();
        }

        return tramos;
    }

    private List<RepostajeResponseDTO> calcularHistorial(Vehiculo vehiculo) {

        List<Repostaje> repostajes = repostajeRepository.findByVehiculoOrderByFechaAscIdAsc(vehiculo);

        Map<Long, Tramo> tramos = calcularTramos(repostajes);

        return repostajes.stream().map(r -> convertirAResponseDTO(r, tramos.get(r.getId()))).toList();
    }

    private RepostajeResponseDTO buscarEnHistorial(Vehiculo vehiculo, Long repostajeId) {

        return calcularHistorial(vehiculo).stream().filter(r -> r.getId().equals(repostajeId)).findFirst().orElseThrow(() -> new RecursoNoEncontradoException("Repostaje no encontrado"));
    }

    private Vehiculo obtenerVehiculoDelUsuario(Long vehiculoId, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(vehiculoId, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository.findByIdAndUsuarioId(categoriaId, usuario.getId()).orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada"));
    }

    private RepostajeResponseDTO convertirAResponseDTO(Repostaje repostaje, Tramo tramo) {

        // La categoría y el método de pago se leen del gasto asociado, que es la fuente de verdad
        Optional<Gasto> gasto = gastoRepository.findByRepostaje(repostaje);

        return new RepostajeResponseDTO(
                repostaje.getId(),
                repostaje.getFecha(),
                repostaje.getLitros(),
                repostaje.getPrecioTotal(),
                repostaje.getPrecioLitro(),
                repostaje.getKilometros(),
                repostaje.getKilometrosRecorridos(),
                repostaje.getCuentakilometros(),
                esLleno(repostaje),
                repostaje.getConsumoOrdenador(),
                repostaje.getVelocidadMedia(),
                repostaje.getNotas(),
                repostaje.getVehiculo().getId(),
                gasto.map(g -> g.getCategoria().getId()).orElse(null),
                gasto.map(g -> g.getCategoria().getNombre()).orElse(null),
                gasto.map(Gasto::getMetodoPago).orElse(null),
                tramo == null ? null : tramo.kilometros(),
                tramo == null ? null : tramo.consumo(),
                tramo == null ? null : tramo.costePorKilometro(),
                gasto.map(Gasto::getId).orElse(null),
                gasto.map(g -> g.getTicket() != null ? g.getTicket().getId() : null).orElse(null)
        );
    }
}
