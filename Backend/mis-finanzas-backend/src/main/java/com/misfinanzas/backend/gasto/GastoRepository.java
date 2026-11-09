package com.misfinanzas.backend.gasto;

import com.misfinanzas.backend.aceite.model.Aceite;
import com.misfinanzas.backend.gasto.model.Gasto;
import com.misfinanzas.backend.gasto.model.MetodoPago;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.itv.model.ITV;
import com.misfinanzas.backend.mantenimiento.model.Mantenimiento;
import com.misfinanzas.backend.neumatico.model.Neumatico;
import com.misfinanzas.backend.repostaje.model.Repostaje;
import com.misfinanzas.backend.ticket.model.Ticket;
import com.misfinanzas.backend.usuario.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GastoRepository extends JpaRepository<Gasto, Long> {

    // Todos los filtros son opcionales: si llegan a null no se aplican
    default Page<Gasto> buscarGastos(Long usuarioId, LocalDateTime inicio, LocalDateTime fin, Long categoriaId, MetodoPago metodoPago, String patron, Pageable pageable) {

        return buscarGastosFiltrados(usuarioId, inicio == null, inicio, fin == null, fin, categoriaId == null, categoriaId,
                metodoPago == null, metodoPago, patron == null, patron, pageable);
    }

    // Cada filtro vacío se indica con un booleano: PostgreSQL no admite "? IS NULL" con un parámetro sin tipo
    @Query("""
    SELECT g
    FROM Gasto g
    WHERE g.usuario.id = :usuarioId
      AND (:sinInicio = true OR g.fecha >= :inicio)
      AND (:sinFin = true OR g.fecha < :fin)
      AND (:sinCategoria = true OR g.categoria.id = :categoriaId)
      AND (:sinMetodo = true OR g.metodoPago = :metodoPago)
      AND (:sinTexto = true OR LOWER(g.descripcion) LIKE :patron)
    """)
    Page<Gasto> buscarGastosFiltrados(@Param("usuarioId") Long usuarioId,
                                      @Param("sinInicio") boolean sinInicio, @Param("inicio") LocalDateTime inicio,
                                      @Param("sinFin") boolean sinFin, @Param("fin") LocalDateTime fin,
                                      @Param("sinCategoria") boolean sinCategoria, @Param("categoriaId") Long categoriaId,
                                      @Param("sinMetodo") boolean sinMetodo, @Param("metodoPago") MetodoPago metodoPago,
                                      @Param("sinTexto") boolean sinTexto, @Param("patron") String patron,
                                      Pageable pageable);

    Optional<Gasto> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCategoriaId(Long categoriaId);

    @Query("""
    SELECT COALESCE(SUM(g.importe), 0)
    FROM Gasto g
    WHERE g.usuario = :usuario
      AND g.fecha >= :inicio
      AND g.fecha < :fin""")
    BigDecimal sumarGastosEntreFechas(@Param("usuario") Usuario usuario, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("""
       SELECT g.categoria.id, g.categoria.nombre, COALESCE(SUM(g.importe), 0)
       FROM Gasto g
       WHERE g.usuario = :usuario
         AND g.fecha >= :inicio
         AND g.fecha < :fin
       GROUP BY g.categoria.id, g.categoria.nombre
       ORDER BY SUM(g.importe) DESC""")
    List<Object[]> sumarGastosPorCategoria(@Param("usuario") Usuario usuario, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("""
    SELECT g.metodoPago, COALESCE(SUM(g.importe), 0)
    FROM Gasto g
    WHERE g.usuario = :usuario
      AND g.fecha >= :inicio
      AND g.fecha < :fin
    GROUP BY g.metodoPago
    ORDER BY SUM(g.importe) DESC
    """)
    List<Object[]> sumarGastosPorMetodoPago(@Param("usuario") Usuario usuario, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    List<Gasto> findByUsuarioAndFechaGreaterThanEqualAndFechaLessThan(Usuario usuario, LocalDateTime inicio, LocalDateTime fin);

    Optional<Gasto> findByRepostaje(Repostaje repostaje);

    Optional<Gasto> findByMantenimiento(Mantenimiento mantenimiento);

    Optional<Gasto> findByAceite(Aceite aceite);

    Optional<Gasto> findByNeumatico(Neumatico neumatico);

    Optional<Gasto> findByItv(ITV itv);

    Optional<Gasto> findByTicket(Ticket ticket);

    boolean existsByTicket(Ticket ticket);

    // Gastos ya cobrados de un recurrente que se va a borrar: se conservan, pero sin el enlace
    @Modifying
    @Query("UPDATE Gasto g SET g.gastoRecurrente = NULL WHERE g.gastoRecurrente = :recurrente")
    void desvincularDeRecurrente(@Param("recurrente") GastoRecurrente recurrente);

    @Query("""
    SELECT COALESCE(SUM(g.importe), 0)
    FROM Gasto g
    WHERE g.usuario = :usuario
      AND g.gastoRecurrente IS NOT NULL
      AND g.fecha >= :inicio
      AND g.fecha < :fin""")
    BigDecimal sumarGastosRecurrentesEntreFechas(@Param("usuario") Usuario usuario, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
