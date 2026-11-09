package com.misfinanzas.backend.gasto;

import com.misfinanzas.backend.common.exception.ConflictoException;
import com.misfinanzas.backend.common.exception.RecursoNoEncontradoException;
import com.misfinanzas.backend.categoria.CategoriaRepository;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.common.dto.PaginaResponseDTO;
import com.misfinanzas.backend.common.util.PaginacionUtils;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gasto.model.OrigenGasto;
import com.misfinanzas.backend.gasto.model.dto.GastoRegistroDTO;
import com.misfinanzas.backend.gasto.model.dto.GastoResponseDTO;
import com.misfinanzas.backend.ticket.model.Ticket;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class GastoService {

    private final GastoRepository gastoRepository;
    private final CategoriaRepository categoriaRepository;

    public GastoService(GastoRepository gastoRepository, CategoriaRepository categoriaRepository) {

        this.gastoRepository = gastoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    public GastoResponseDTO crearGasto(GastoRegistroDTO registroDTO, Usuario usuario) {

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        Gasto gasto = new Gasto();

        gasto.setImporte(registroDTO.getImporte());
        gasto.setFecha(registroDTO.getFecha());
        gasto.setDescripcion(registroDTO.getDescripcion());
        gasto.setMetodoPago(registroDTO.getMetodoPago());
        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);

        Gasto gastoGuardado = gastoRepository.save(gasto);

        return convertirAResponseDTO(gastoGuardado);
    }

    // Lo usa TicketService al guardar un gasto escaneado: los datos son los del formulario y el ticket guarda la foto
    public GastoResponseDTO crearGastoConTicket(GastoRegistroDTO registroDTO, Ticket ticket, Usuario usuario) {

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        Gasto gasto = new Gasto();

        gasto.setImporte(registroDTO.getImporte());
        gasto.setFecha(registroDTO.getFecha());
        gasto.setDescripcion(registroDTO.getDescripcion());
        gasto.setMetodoPago(registroDTO.getMetodoPago());
        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setTicket(ticket);

        return convertirAResponseDTO(gastoRepository.save(gasto));
    }

    // Lo usa TicketService al convertir un ticket: importe y fecha salen del ticket
    public GastoResponseDTO crearGastoDesdeTicket(Ticket ticket, Long categoriaId, MetodoPago metodoPago, String descripcion, Usuario usuario) {

        Categoria categoria = obtenerCategoriaDelUsuario(categoriaId, usuario);

        Gasto gasto = new Gasto();

        gasto.setImporte(ticket.getImporte());
        gasto.setFecha(ticket.getFecha().atStartOfDay());
        gasto.setDescripcion(descripcion == null || descripcion.isBlank() ? ticket.getComercio() : descripcion);
        gasto.setMetodoPago(metodoPago);
        gasto.setUsuario(usuario);
        gasto.setCategoria(categoria);
        gasto.setTicket(ticket);

        Gasto gastoGuardado = gastoRepository.save(gasto);

        return convertirAResponseDTO(gastoGuardado);
    }

    public PaginaResponseDTO<GastoResponseDTO> obtenerGastos(Usuario usuario, LocalDate desde, LocalDate hasta, Long categoriaId, MetodoPago metodoPago, String texto, int pagina, int tamanio) {

        PaginacionUtils.validarFechas(desde, hasta);

        return PaginaResponseDTO.desdePage(
                gastoRepository
                        .buscarGastos(
                                usuario.getId(),
                                PaginacionUtils.inicioDelDia(desde),
                                PaginacionUtils.finDelDia(hasta),
                                categoriaId,
                                metodoPago,
                                PaginacionUtils.patronBusqueda(texto),
                                PaginacionUtils.crearPaginaPorFecha(pagina, tamanio)
                        )
                        .map(this::convertirAResponseDTO)
        );
    }

    public GastoResponseDTO obtenerGasto(Long id, Usuario usuario) {

        Gasto gasto = gastoRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Gasto no encontrado"
                        ));

        return convertirAResponseDTO(gasto);
    }

    public GastoResponseDTO actualizarGasto(Long id, GastoRegistroDTO registroDTO, Usuario usuario) {

        Gasto gasto = gastoRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Gasto no encontrado"
                        ));

        comprobarGastoManual(gasto);

        Categoria categoria = obtenerCategoriaDelUsuario(registroDTO.getCategoriaId(), usuario);

        gasto.setImporte(registroDTO.getImporte());
        gasto.setFecha(registroDTO.getFecha());
        gasto.setDescripcion(registroDTO.getDescripcion());
        gasto.setMetodoPago(registroDTO.getMetodoPago());
        gasto.setCategoria(categoria);

        Gasto gastoActualizado = gastoRepository.save(gasto);

        return convertirAResponseDTO(gastoActualizado);
    }

    public void eliminarGasto(Long id, Usuario usuario) {

        Gasto gasto = gastoRepository
                .findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Gasto no encontrado"
                        ));

        comprobarGastoManual(gasto);

        // Su ticket y la foto, si los tiene, se borran con él (cascada en Gasto.ticket)
        gastoRepository.delete(gasto);
    }

    // Los gastos generados por los módulos de vehículos solo se modifican desde su módulo.
    // Los que vienen de un ticket son gastos normales y sí se pueden editar y borrar.
    private void comprobarGastoManual(Gasto gasto) {

        OrigenGasto origen = OrigenGasto.de(gasto);

        // Los de tickets y recurrentes se pueden corregir sueltos (p. ej. un mes te cobran distinto)
        if (origen != OrigenGasto.MANUAL && origen != OrigenGasto.TICKET && origen != OrigenGasto.RECURRENTE) {
            throw new ConflictoException("Este gasto se gestiona desde el módulo de vehículos (" + origen.name().toLowerCase() + "). Modifícalo desde allí.");
        }
    }

    private Categoria obtenerCategoriaDelUsuario(Long categoriaId, Usuario usuario) {

        return categoriaRepository
                .findByIdAndUsuarioId(
                        categoriaId,
                        usuario.getId()
                )
                .orElseThrow(() ->
                        new RecursoNoEncontradoException(
                                "Categoría no encontrada"
                        ));
    }

    private GastoResponseDTO convertirAResponseDTO(Gasto gasto) {

        return new GastoResponseDTO(
                gasto.getId(),
                gasto.getImporte(),
                gasto.getFecha(),
                gasto.getDescripcion(),
                gasto.getMetodoPago(),
                gasto.getCategoria().getId(),
                gasto.getCategoria().getNombre(),
                OrigenGasto.de(gasto),
                gasto.getTicket() != null ? gasto.getTicket().getId() : null,
                vehiculoDe(gasto),
                registroDe(gasto)
        );
    }

    private Long vehiculoDe(Gasto gasto) {

        if (gasto.getRepostaje() != null) return gasto.getRepostaje().getVehiculo().getId();
        if (gasto.getAceite() != null) return gasto.getAceite().getVehiculo().getId();
        if (gasto.getNeumatico() != null) return gasto.getNeumatico().getVehiculo().getId();
        if (gasto.getMantenimiento() != null) return gasto.getMantenimiento().getVehiculo().getId();
        if (gasto.getItv() != null) return gasto.getItv().getVehiculo().getId();

        return null;
    }

    private Long registroDe(Gasto gasto) {

        if (gasto.getRepostaje() != null) return gasto.getRepostaje().getId();
        if (gasto.getAceite() != null) return gasto.getAceite().getId();
        if (gasto.getNeumatico() != null) return gasto.getNeumatico().getId();
        if (gasto.getMantenimiento() != null) return gasto.getMantenimiento().getId();
        if (gasto.getItv() != null) return gasto.getItv().getId();

        return null;
    }
}
