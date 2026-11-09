package com.misfinanzas.backend.vehiculo;

import com.misfinanzas.backend.aceite.AceiteRepository;
import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.itv.ITVRepository;
import com.misfinanzas.backend.mantenimiento.MantenimientoRepository;
import com.misfinanzas.backend.neumatico.NeumaticoRepository;
import com.misfinanzas.backend.repostaje.RepostajeRepository;
import com.misfinanzas.backend.repostaje.RepostajeService;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoRegistroDTO;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoResponseDTO;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoResumenDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final RepostajeRepository repostajeRepository;
    private final AceiteRepository aceiteRepository;
    private final NeumaticoRepository neumaticoRepository;
    private final MantenimientoRepository mantenimientoRepository;
    private final ITVRepository itvRepository;
    private final RepostajeService repostajeService;

    public VehiculoService(VehiculoRepository vehiculoRepository, RepostajeRepository repostajeRepository, AceiteRepository aceiteRepository, NeumaticoRepository neumaticoRepository, MantenimientoRepository mantenimientoRepository, ITVRepository itvRepository, RepostajeService repostajeService) {
        this.vehiculoRepository = vehiculoRepository;
        this.repostajeRepository = repostajeRepository;
        this.aceiteRepository = aceiteRepository;
        this.neumaticoRepository = neumaticoRepository;
        this.mantenimientoRepository = mantenimientoRepository;
        this.itvRepository = itvRepository;
        this.repostajeService = repostajeService;
    }

    public VehiculoResponseDTO crearVehiculo(VehiculoRegistroDTO registroDTO, Usuario usuario) {

        if (vehiculoRepository.countByUsuario(usuario) >= 5) {
            throw new ConflictoException("No puedes tener más de 5 vehículos");
        }

        Vehiculo vehiculo = new Vehiculo();

        vehiculo.setNombre(registroDTO.getNombre());
        vehiculo.setMarca(registroDTO.getMarca());
        vehiculo.setModelo(registroDTO.getModelo());
        vehiculo.setMatricula(registroDTO.getMatricula());
        vehiculo.setAnio(registroDTO.getAnio());
        vehiculo.setKilometrosIniciales(registroDTO.getKilometrosIniciales());

        vehiculo.setActivo(true);
        vehiculo.setUsuario(usuario);

        Vehiculo vehiculoGuardado = vehiculoRepository.save(vehiculo);

        return convertirAResponseDTO(vehiculoGuardado);
    }

    public List<VehiculoResponseDTO> obtenerVehiculos(Usuario usuario) {

        return vehiculoRepository.findByUsuario(usuario).stream().map(this::convertirAResponseDTO).toList();
    }

    public VehiculoResponseDTO obtenerVehiculo(Long id, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        return convertirAResponseDTO(vehiculo);
    }

    @Transactional
    public VehiculoResponseDTO actualizarVehiculo(Long id, VehiculoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        vehiculo.setNombre(registroDTO.getNombre());
        vehiculo.setMarca(registroDTO.getMarca());
        vehiculo.setModelo(registroDTO.getModelo());
        vehiculo.setMatricula(registroDTO.getMatricula());
        vehiculo.setAnio(registroDTO.getAnio());

        boolean cambianKilometros = !Objects.equals(vehiculo.getKilometrosIniciales(), registroDTO.getKilometrosIniciales());

        vehiculo.setKilometrosIniciales(registroDTO.getKilometrosIniciales());

        Vehiculo vehiculoActualizado = vehiculoRepository.save(vehiculo);

        // Los km de cada repostaje parten de los iniciales
        if (cambianKilometros) {
            repostajeService.recalcularKilometros(vehiculoActualizado);
        }

        return convertirAResponseDTO(vehiculoActualizado);
    }

    public void eliminarVehiculo(Long id, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        // Si se borrase, se perderían sus gastos del historial financiero
        if (tieneRegistros(vehiculo)) {
            throw new ConflictoException("El vehículo tiene registros asociados. Desactívalo en lugar de eliminarlo.");
        }

        vehiculoRepository.delete(vehiculo);
    }

    public VehiculoResponseDTO cambiarEstado(Long id, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        vehiculo.setActivo(!vehiculo.isActivo());

        Vehiculo vehiculoActualizado = vehiculoRepository.save(vehiculo);

        return convertirAResponseDTO(vehiculoActualizado);
    }

    @Transactional(readOnly = true)
    public VehiculoResumenDTO obtenerResumen(Long id, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        RepostajeService.Estadisticas combustible = repostajeService.calcularEstadisticas(vehiculo);

        var aceites = aceiteRepository.findByVehiculoOrderByFechaDesc(vehiculo);
        var neumaticos = neumaticoRepository.findByVehiculoOrderByFechaDesc(vehiculo);
        var mantenimientos = mantenimientoRepository.findByVehiculoOrderByFechaDesc(vehiculo);
        var itvs = itvRepository.findByVehiculoOrderByFechaDesc(vehiculo);
        var repostajes = repostajeRepository.findByVehiculoOrderByFechaAscIdAsc(vehiculo);

        // Km actuales: los del último repostaje (iniciales + trips) o, si es mayor, el de cualquier otro registro
        int kilometrosActuales = Stream.of(
                        Stream.of(vehiculo.getKilometrosIniciales(), combustible.ultimosKilometros()),
                        aceites.stream().map(a -> a.getKilometros()),
                        neumaticos.stream().map(n -> n.getKilometros()),
                        mantenimientos.stream().map(m -> m.getKilometros()),
                        itvs.stream().map(i -> i.getKilometros()))
                .flatMap(s -> s)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);

        int anio = LocalDate.now().getYear();

        BigDecimal gastadoAnio = Stream.of(
                        repostajes.stream().filter(r -> r.getFecha().getYear() == anio).map(r -> r.getPrecioTotal()),
                        aceites.stream().filter(a -> a.getFecha().getYear() == anio).map(a -> a.getPrecio()),
                        neumaticos.stream().filter(n -> n.getFecha().getYear() == anio).map(n -> n.getPrecio()),
                        mantenimientos.stream().filter(m -> m.getFecha().getYear() == anio).map(m -> m.getPrecio()),
                        itvs.stream().filter(i -> i.getFecha().getYear() == anio).map(i -> i.getPrecio()))
                .flatMap(s -> s)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var ultimaItv = itvs.isEmpty() ? null : itvs.get(0);

        return new VehiculoResumenDTO(
                vehiculo.getId(),
                kilometrosActuales,
                combustible.repostajes(),
                combustible.consumoMedio(),
                combustible.costePorKilometro(),
                combustible.precioMedioLitro(),
                gastadoAnio,
                combustible.ultimaFecha(),
                ultimaItv == null ? null : ultimaItv.getFecha(),
                ultimaItv == null || ultimaItv.getResultado() == null ? null : ultimaItv.getResultado().name(),
                proximaItv(vehiculo, ultimaItv)
        );
    }

    private LocalDate proximaItv(Vehiculo vehiculo, com.misfinanzas.backend.itv.model.ITV ultima) {

        if (ultima == null) {
            return vehiculo.getAnio() == null ? null : LocalDate.of(vehiculo.getAnio() + 4, 1, 1);
        }

        String resultado = ultima.getResultado() == null ? "" : ultima.getResultado().name();

        if (resultado.equals("DESFAVORABLE") || resultado.equals("NEGATIVA")) {
            return ultima.getFecha().plusMonths(2);
        }

        boolean masDeDiezAnios = vehiculo.getAnio() != null && ultima.getFecha().getYear() - vehiculo.getAnio() >= 10;

        return ultima.getFecha().plusYears(masDeDiezAnios ? 1 : 2);
    }

    private boolean tieneRegistros(Vehiculo vehiculo) {

        return repostajeRepository.existsByVehiculo(vehiculo)
                || aceiteRepository.existsByVehiculo(vehiculo)
                || neumaticoRepository.existsByVehiculo(vehiculo)
                || mantenimientoRepository.existsByVehiculo(vehiculo)
                || itvRepository.existsByVehiculo(vehiculo);
    }

    private Vehiculo obtenerVehiculoEntidad(Long id, Usuario usuario) {

        return vehiculoRepository.findByIdAndUsuario(id, usuario).orElseThrow(() -> new RecursoNoEncontradoException("Vehículo no encontrado"));
    }

    private VehiculoResponseDTO convertirAResponseDTO(Vehiculo vehiculo) {

        return new VehiculoResponseDTO(vehiculo.getId(), vehiculo.getNombre(), vehiculo.getMarca(), vehiculo.getModelo(), vehiculo.getMatricula(), vehiculo.getAnio(), vehiculo.isActivo(), vehiculo.getKilometrosIniciales());
    }
}
