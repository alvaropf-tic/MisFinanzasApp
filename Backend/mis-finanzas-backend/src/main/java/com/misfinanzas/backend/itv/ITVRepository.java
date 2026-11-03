package com.misfinanzas.backend.itv;

import com.misfinanzas.backend.itv.model.ITV;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ITVRepository extends JpaRepository<ITV, Long> {

    List<ITV> findByVehiculoOrderByFechaDesc(Vehiculo vehiculo);

    Optional<ITV> findByIdAndVehiculo(Long id, Vehiculo vehiculo);

    boolean existsByVehiculo(Vehiculo vehiculo);
}
