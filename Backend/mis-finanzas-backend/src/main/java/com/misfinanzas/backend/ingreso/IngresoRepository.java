package com.misfinanzas.backend.ingreso;

import com.misfinanzas.backend.ingreso.model.Ingreso;
import com.misfinanzas.backend.ingreso.model.MetodoIngreso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IngresoRepository extends JpaRepository<Ingreso, Long> {

    // Todos los filtros son opcionales: si llegan a null no se aplican
    @Query("""
    SELECT i
    FROM Ingreso i
    WHERE i.usuario.id = :usuarioId
      AND (:inicio IS NULL OR i.fecha >= :inicio)
      AND (:fin IS NULL OR i.fecha < :fin)
      AND (:categoriaIngresoId IS NULL OR i.categoriaIngreso.id = :categoriaIngresoId)
      AND (:metodoIngreso IS NULL OR i.metodoIngreso = :metodoIngreso)
      AND (:patron IS NULL OR LOWER(i.descripcion) LIKE :patron)
    """)
    Page<Ingreso> buscarIngresos(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin, @Param("categoriaIngresoId") Long categoriaIngresoId, @Param("metodoIngreso") MetodoIngreso metodoIngreso, @Param("patron") String patron, Pageable pageable);

    Optional<Ingreso> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCategoriaIngresoId(Long categoriaIngresoId);

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
