package com.misfinanzas.backend.mantenimiento;

import com.misfinanzas.backend.mantenimiento.model.Mantenimiento;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Long> {

    List<Mantenimiento> findByVehiculoOrderByFechaDesc(Vehiculo vehiculo);

    Optional<Mantenimiento> findByIdAndVehiculo(Long id, Vehiculo vehiculo);

    boolean existsByVehiculo(Vehiculo vehiculo);
}
