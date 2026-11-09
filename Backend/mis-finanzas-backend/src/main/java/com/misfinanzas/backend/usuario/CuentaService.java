package com.misfinanzas.backend.usuario;

import com.misfinanzas.backend.usuario.model.Usuario;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

// Borra la cuenta y TODOS sus datos (derecho de supresión del RGPD). Va en orden para no romper las claves
// ajenas: primero lo que apunta a otras tablas (gastos, ingresos...) y al final el usuario.
@Service
public class CuentaService {

    private static final Logger log = LoggerFactory.getLogger(CuentaService.class);

    // Entidad y condición que la une al usuario (:u es el id), en orden de borrado. Los borrados masivos no admiten
    // joins: lo que cuelga de un vehículo u objetivo se busca con una subconsulta
    private static final List<String> BORRADOS = List.of(
            "Gasto e WHERE e.usuario.id = :u",
            "Ticket e WHERE e.usuario.id = :u",
            "Ingreso e WHERE e.usuario.id = :u",
            "GastoRecurrente e WHERE e.usuario.id = :u",
            "IngresoRecurrente e WHERE e.usuario.id = :u",
            "Repostaje e WHERE e.vehiculo.id IN (SELECT v.id FROM Vehiculo v WHERE v.usuario.id = :u)",
            "Aceite e WHERE e.vehiculo.id IN (SELECT v.id FROM Vehiculo v WHERE v.usuario.id = :u)",
            "Neumatico e WHERE e.vehiculo.id IN (SELECT v.id FROM Vehiculo v WHERE v.usuario.id = :u)",
            "Mantenimiento e WHERE e.vehiculo.id IN (SELECT v.id FROM Vehiculo v WHERE v.usuario.id = :u)",
            "ITV e WHERE e.vehiculo.id IN (SELECT v.id FROM Vehiculo v WHERE v.usuario.id = :u)",
            "Vehiculo e WHERE e.usuario.id = :u",
            "Presupuesto e WHERE e.usuario.id = :u",
            "Categoria e WHERE e.usuario.id = :u",
            "CategoriaIngreso e WHERE e.usuario.id = :u",
            "Aportacion e WHERE e.objetivo.id IN (SELECT o.id FROM Objetivo o WHERE o.usuario.id = :u)",
            "Objetivo e WHERE e.usuario.id = :u",
            "Recordatorio e WHERE e.usuario.id = :u",
            "Usuario e WHERE e.id = :u"
    );

    private final EntityManager entityManager;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path directorioImagenes;

    public CuentaService(EntityManager entityManager, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, @Value("${app.tickets.directorio}") String directorioImagenes) {
        this.entityManager = entityManager;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.directorioImagenes = Path.of(directorioImagenes).toAbsolutePath().normalize();
    }

    @Transactional
    public void eliminarCuenta(String password, Usuario usuario) {

        Usuario actual = usuarioRepository.findById(usuario.getId()).orElseThrow();

        // 400 y no 401: un 401 haría que el frontend cerrara la sesión sin explicar nada
        if (!passwordEncoder.matches(password, actual.getPassword())) {
            throw new IllegalArgumentException("La contraseña no es correcta");
        }

        // Las fotos de los tickets se borran del disco solo si la base de datos se borró bien
        List<String> fotos = entityManager.createQuery("SELECT t.rutaImagen FROM Ticket t WHERE t.usuario.id = :u AND t.rutaImagen IS NOT NULL", String.class)
                .setParameter("u", actual.getId())
                .getResultList();

        for (String borrado : BORRADOS) {
            entityManager.createQuery("DELETE FROM " + borrado).setParameter("u", actual.getId()).executeUpdate();
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                fotos.forEach(CuentaService.this::borrarFoto);
            }
        });

        log.info("Cuenta {} eliminada con todos sus datos", actual.getId());
    }

    private void borrarFoto(String nombre) {

        Path archivo = directorioImagenes.resolve(nombre).normalize();

        if (!archivo.startsWith(directorioImagenes)) {
            return;
        }

        try {
            Files.deleteIfExists(archivo);
        } catch (IOException e) {
            log.warn("No se pudo borrar la foto {}: {}", nombre, e.getMessage());
        }
    }
}
