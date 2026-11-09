package com.misfinanzas.backend.repostaje;

import com.misfinanzas.backend.repostaje.model.Repostaje;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepostajeRepository extends JpaRepository<Repostaje, Long> {

    List<Repostaje> findByVehiculoOrderByFechaDesc(Vehiculo vehiculo);

    Optional<Repostaje> findByIdAndVehiculo(Long id, Vehiculo vehiculo);

    boolean existsByVehiculo(Vehiculo vehiculo);

    // Orden cronológico; a igual fecha, el que se apuntó antes
    List<Repostaje> findByVehiculoOrderByFechaAscIdAsc(Vehiculo vehiculo);
}
