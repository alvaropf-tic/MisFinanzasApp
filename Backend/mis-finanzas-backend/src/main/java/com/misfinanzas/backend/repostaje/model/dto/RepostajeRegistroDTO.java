package com.misfinanzas.backend.repostaje.model.dto;

import com.misfinanzas.backend.gasto.model.MetodoPago;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

// Hace falta el trip (kilometrosRecorridos) o la lectura del cuentakilómetros; lo normal es solo el trip.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RepostajeRegistroDTO {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "Los litros son obligatorios")
    @DecimalMin(value = "0.01", message = "Los litros deben ser mayores que 0")
    private BigDecimal litros;

    @NotNull(message = "El precio total es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio total debe ser mayor que 0")
    private BigDecimal precioTotal;

    // Opcional: el del surtidor. Si no llega se calcula como precioTotal / litros.
    @DecimalMin(value = "0.001", message = "El precio por litro debe ser mayor que 0")
    private BigDecimal precioLitro;

    @Min(value = 1, message = "Los km recorridos deben ser mayores que 0")
    private Integer kilometrosRecorridos;

    @Min(value = 0, message = "Los kilómetros no pueden ser negativos")
    private Integer cuentakilometros;

    // Por defecto, depósito lleno
    private Boolean lleno;

    private BigDecimal consumoOrdenador;

    private BigDecimal velocidadMedia;

    @Size(max = 500, message = "Las notas no pueden superar los 500 caracteres")
    private String notas;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;
}
