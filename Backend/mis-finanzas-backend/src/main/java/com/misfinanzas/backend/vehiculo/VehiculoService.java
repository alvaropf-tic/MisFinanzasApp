package com.misfinanzas.backend.vehiculo;

import com.misfinanzas.backend.aceite.AceiteRepository;
import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.itv.ITVRepository;
import com.misfinanzas.backend.mantenimiento.MantenimientoRepository;
import com.misfinanzas.backend.neumatico.NeumaticoRepository;
import com.misfinanzas.backend.repostaje.RepostajeRepository;
import com.misfinanzas.backend.usuario.model.Usuario;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoRegistroDTO;
import com.misfinanzas.backend.vehiculo.model.dto.VehiculoResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final RepostajeRepository repostajeRepository;
    private final AceiteRepository aceiteRepository;
    private final NeumaticoRepository neumaticoRepository;
    private final MantenimientoRepository mantenimientoRepository;
    private final ITVRepository itvRepository;

    public VehiculoService(VehiculoRepository vehiculoRepository, RepostajeRepository repostajeRepository, AceiteRepository aceiteRepository, NeumaticoRepository neumaticoRepository, MantenimientoRepository mantenimientoRepository, ITVRepository itvRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.repostajeRepository = repostajeRepository;
        this.aceiteRepository = aceiteRepository;
        this.neumaticoRepository = neumaticoRepository;
        this.mantenimientoRepository = mantenimientoRepository;
        this.itvRepository = itvRepository;
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

    public VehiculoResponseDTO actualizarVehiculo(Long id, VehiculoRegistroDTO registroDTO, Usuario usuario) {

        Vehiculo vehiculo = obtenerVehiculoEntidad(id, usuario);

        vehiculo.setNombre(registroDTO.getNombre());
        vehiculo.setMarca(registroDTO.getMarca());
        vehiculo.setModelo(registroDTO.getModelo());
        vehiculo.setMatricula(registroDTO.getMatricula());
        vehiculo.setAnio(registroDTO.getAnio());

        Vehiculo vehiculoActualizado = vehiculoRepository.save(vehiculo);

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

        return new VehiculoResponseDTO(vehiculo.getId(), vehiculo.getNombre(), vehiculo.getMarca(), vehiculo.getModelo(), vehiculo.getMatricula(), vehiculo.getAnio(), vehiculo.isActivo());
    }
}
