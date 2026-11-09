package com.misfinanzas.backend.ticket;

import com.misfinanzas.backend.ticket.model.Ticket;
import jakarta.persistence.PostRemove;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

// Borra la foto del disco cuando se borra un ticket, venga de donde venga (su gasto, un registro de vehículo...)
@Component
public class TicketArchivoListener {

    private static final Logger log = LoggerFactory.getLogger(TicketArchivoListener.class);

    private final Path directorioImagenes;

    public TicketArchivoListener(@Value("${app.tickets.directorio}") String directorioImagenes) {
        this.directorioImagenes = Path.of(directorioImagenes).toAbsolutePath().normalize();
    }

    @PostRemove
    public void alBorrar(Ticket ticket) {

        if (ticket.getRutaImagen() == null) {
            return;
        }

        Path archivo = directorioImagenes.resolve(ticket.getRutaImagen()).normalize();

        // Un nombre manipulado nunca sale del directorio de imágenes
        if (!archivo.startsWith(directorioImagenes)) {
            return;
        }

        try {
            Files.deleteIfExists(archivo);
        } catch (IOException e) {
            log.warn("No se pudo borrar la imagen {}: {}", ticket.getRutaImagen(), e.getMessage());
        }
    }
}
