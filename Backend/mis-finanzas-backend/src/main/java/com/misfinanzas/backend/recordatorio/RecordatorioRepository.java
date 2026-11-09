package com.misfinanzas.backend.recordatorio;

import com.misfinanzas.backend.recordatorio.model.Recordatorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecordatorioRepository extends JpaRepository<Recordatorio, Long> {

    List<Recordatorio> findByUsuarioIdOrderByFechaAsc(Long usuarioId);

    Optional<Recordatorio> findByIdAndUsuarioId(Long id, Long usuarioId);
}
