package com.misfinanzas.backend.aceite;

import com.misfinanzas.backend.aceite.model.Aceite;
import com.misfinanzas.backend.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AceiteRepository extends JpaRepository<Aceite, Long> {

    List<Aceite> findByVehiculoOrderByFechaDesc(Vehiculo vehiculo);

    Optional<Aceite> findByIdAndVehiculo(Long id, Vehiculo vehiculo);

    boolean existsByVehiculo(Vehiculo vehiculo);
}