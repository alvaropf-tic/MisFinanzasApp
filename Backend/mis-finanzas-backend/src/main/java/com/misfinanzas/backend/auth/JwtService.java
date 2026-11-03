package com.misfinanzas.backend.auth;

import com.misfinanzas.backend.usuario.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    // HS256 necesita una clave de al menos 256 bits (32 bytes)
    private static final int LONGITUD_MINIMA_SECRETO = 32;

    private final SecretKey secretKey;
    private final long expiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration) {

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("No se ha configurado el secreto JWT. Define la variable de entorno JWT_SECRET");
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < LONGITUD_MINIMA_SECRETO) {
            throw new IllegalStateException("El secreto JWT debe tener al menos " + LONGITUD_MINIMA_SECRETO + " caracteres");
        }

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.expiration = expiration;
    }

    public String generarToken(Usuario usuario) {

        Date fechaActual = new Date();
        Date fechaExpiracion = new Date(
                fechaActual.getTime() + expiration
        );

        return Jwts.builder()
                .subject(usuario.getNombreUsuario())
                .claim("id", usuario.getId())
                .claim("rol", usuario.getRol().name())
                .issuedAt(fechaActual)
                .expiration(fechaExpiracion)
                .signWith(secretKey)
                .compact();
    }

    public Jws<Claims> validarToken(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
    }
}
