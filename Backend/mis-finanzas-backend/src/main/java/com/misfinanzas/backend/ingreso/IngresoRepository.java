package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.ingreso.model.Ingreso;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import com.misfinanzas.backend.ingresoRecurrente.model.IngresoRecurrente;
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

public interface IngresoRepository extends JpaRepository<Ingreso, Long> {

    // Todos los filtros son opcionales: si llegan a null no se aplican
    default Page<Ingreso> buscarIngresos(Long usuarioId, LocalDateTime inicio, LocalDateTime fin, Long categoriaIngresoId, MetodoIngreso metodoIngreso, String patron, Pageable pageable) {

        return buscarIngresosFiltrados(usuarioId, inicio == null, inicio, fin == null, fin, categoriaIngresoId == null, categoriaIngresoId,
                metodoIngreso == null, metodoIngreso, patron == null, patron, pageable);
    }

    // Cada filtro vacío se indica con un booleano: PostgreSQL no admite "? IS NULL" con un parámetro sin tipo
    @Query("""
    SELECT i
    FROM Ingreso i
    WHERE i.usuario.id = :usuarioId
      AND (:sinInicio = true OR i.fecha >= :inicio)
      AND (:sinFin = true OR i.fecha < :fin)
      AND (:sinCategoria = true OR i.categoriaIngreso.id = :categoriaIngresoId)
      AND (:sinMetodo = true OR i.metodoIngreso = :metodoIngreso)
      AND (:sinTexto = true OR LOWER(i.descripcion) LIKE :patron)
    """)
    Page<Ingreso> buscarIngresosFiltrados(@Param("usuarioId") Long usuarioId,
                                          @Param("sinInicio") boolean sinInicio, @Param("inicio") LocalDateTime inicio,
                                          @Param("sinFin") boolean sinFin, @Param("fin") LocalDateTime fin,
                                          @Param("sinCategoria") boolean sinCategoria, @Param("categoriaIngresoId") Long categoriaIngresoId,
                                          @Param("sinMetodo") boolean sinMetodo, @Param("metodoIngreso") MetodoIngreso metodoIngreso,
                                          @Param("sinTexto") boolean sinTexto, @Param("patron") String patron,
                                          Pageable pageable);

    Optional<Ingreso> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCategoriaIngresoId(Long categoriaIngresoId);

    // Ingresos ya cobrados de un recurrente que se va a borrar: se conservan, pero sin el enlace
    @Modifying
    @Query("UPDATE Ingreso i SET i.ingresoRecurrente = NULL WHERE i.ingresoRecurrente = :recurrente")
    void desvincularDeRecurrente(@Param("recurrente") IngresoRecurrente recurrente);

    @Query("""
    SELECT COALESCE(SUM(i.importe), 0)
    FROM Ingreso i
    WHERE i.usuario.id = :usuarioId
      AND i.ingresoRecurrente IS NOT NULL
      AND i.fecha >= :inicio
      AND i.fecha < :fin
    """)
    BigDecimal sumarIngresosRecurrentesEntreFechas(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("""
    SELECT COALESCE(SUM(i.importe), 0)
    FROM Ingreso i
    WHERE i.usuario.id = :usuarioId
      AND i.fecha >= :inicio
      AND i.fecha < :fin
    """)
    BigDecimal sumarIngresosEntreFechas(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("""
    SELECT i.categoriaIngreso.id,
           i.categoriaIngreso.nombre,
           COALESCE(SUM(i.importe), 0)
    FROM Ingreso i
    WHERE i.usuario.id = :usuarioId
      AND i.fecha >= :inicio
      AND i.fecha < :fin
    GROUP BY i.categoriaIngreso.id,
             i.categoriaIngreso.nombre
    ORDER BY SUM(i.importe) DESC
    """)
    List<Object[]> sumarIngresosPorCategoria(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
