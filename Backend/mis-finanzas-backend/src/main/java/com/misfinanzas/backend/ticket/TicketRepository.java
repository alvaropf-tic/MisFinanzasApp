package com.misfinanzas.backend.ticket;

import com.misfinanzas.backend.ticket.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    Optional<Ticket> findByIdAndUsuarioId(Long id, Long usuarioId);
}
