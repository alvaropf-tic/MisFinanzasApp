package com.misfinanzas.backend.gasto.model;

// Indica de dónde viene un gasto. No se guarda en la base de datos: se calcula a partir de sus relaciones.
public enum OrigenGasto {
    MANUAL,
    REPOSTAJE,
    ACEITE,
    NEUMATICO,
    MANTENIMIENTO,
    ITV,
    TICKET;

    public static OrigenGasto de(Gasto gasto) {

        if (gasto.getRepostaje() != null) return REPOSTAJE;
        if (gasto.getAceite() != null) return ACEITE;
        if (gasto.getNeumatico() != null) return NEUMATICO;
        if (gasto.getMantenimiento() != null) return MANTENIMIENTO;
        if (gasto.getItv() != null) return ITV;
        if (gasto.getTicket() != null) return TICKET;

        return MANUAL;
    }
}
