package com.misfinanzas.backend.neumatico;

import com.misfinanzas.backend.neumatico.model.Neumatico;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NeumaticoRepository extends JpaRepository<Neumatico, Long> {

    List<Neumatico> findByVehiculoOrderByFechaDesc(Vehiculo vehiculo);

    Optional<Neumatico> findByIdAndVehiculo(Long id, Vehiculo vehiculo);

    boolean existsByVehiculo(Vehiculo vehiculo);
}
