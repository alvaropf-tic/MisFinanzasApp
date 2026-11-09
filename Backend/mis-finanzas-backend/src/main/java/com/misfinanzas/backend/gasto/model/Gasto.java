package com.misfinanzas.backend.gasto.model;

import com.misfinanzas.backend.aceite.model.Aceite;
import com.misfinanzas.backend.categoria.model.Categoria;
import com.misfinanzas.backend.gasto.GastoMetricasListener;
import com.misfinanzas.backend.gastoRecurrente.model.GastoRecurrente;
import com.misfinanzas.backend.itv.model.ITV;
import com.misfinanzas.backend.mantenimiento.model.Mantenimiento;
import com.misfinanzas.backend.neumatico.model.Neumatico;
import com.misfinanzas.backend.repostaje.model.Repostaje;
import com.misfinanzas.backend.ticket.model.Ticket;
import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "gastos")
@EntityListeners(GastoMetricasListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repostaje_id", unique = true)
    private Repostaje repostaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mantenimiento_id", unique = true)
    private Mantenimiento mantenimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aceite_id", unique = true)
    private Aceite aceite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "neumatico_id", unique = true)
    private Neumatico neumatico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itv_id", unique = true)
    private ITV itv;

    // Al borrar el gasto (también desde un registro de vehículo) se borra su ticket; la foto la borra TicketArchivoListener
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
    @JoinColumn(name = "ticket_id", unique = true)
    private Ticket ticket;

    // Recurrente que generó este gasto (suscripciones, alquiler...). Varios gastos por recurrente.
    // Al borrar el recurrente se pone a null: los gastos ya cobrados se quedan en el historial.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gasto_recurrente_id")
    private GastoRecurrente gastoRecurrente;
}
