package com.misfinanzas.backend.config;

import com.misfinanzas.backend.auth.JwtAuthFilter;
import com.misfinanzas.backend.common.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JsonMapper jsonMapper;

    // Actuator va en un puerto aparte que solo escucha en 127.0.0.1 (ver application.properties)
    private final int puertoGestion;

    // Consola H2 y Swagger solo se abren si están activados (perfil dev)
    private final boolean consolaH2Activada;
    private final boolean swaggerActivado;
    private final boolean paginaPruebasActivada;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, JsonMapper jsonMapper,
                          @Value("${management.server.port}") int puertoGestion,
                          @Value("${spring.h2.console.enabled:false}") boolean consolaH2Activada,
                          @Value("${springdoc.api-docs.enabled:true}") boolean swaggerActivado,
                          @Value("${app.pagina-pruebas.enabled:false}") boolean paginaPruebasActivada) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.jsonMapper = jsonMapper;
        this.puertoGestion = puertoGestion;
        this.consolaH2Activada = consolaH2Activada;
        this.swaggerActivado = swaggerActivado;
        this.paginaPruebasActivada = paginaPruebasActivada;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                // Usa el bean CorsConfigurationSource de CorsConfig
                .cors(Customizer.withDefaults())

                // sameOrigin: la consola H2 (que usa frames) funciona, pero otra web no puede meter la API en un iframe
                .headers(headers ->
                        headers.frameOptions(frame -> frame.sameOrigin())
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> {

                    if (consolaH2Activada) {
                        auth.requestMatchers("/h2-console/**").permitAll();
                    }

                    // Documentación de la API
                    if (swaggerActivado) {
                        auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll();
                    }

                    // Página para probar todos los endpoints: http://localhost:8090/pruebas.html
                    if (paginaPruebasActivada) {
                        auth.requestMatchers("/pruebas.html").permitAll();
                    }

                    auth
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Health en el puerto principal: solo dice si el servidor está vivo y listo
                        .requestMatchers("/livez", "/readyz").permitAll()

                        // Todo Actuator, pero solo en el puerto de gestión (inaccesible desde fuera de la máquina)
                        .requestMatchers(request -> request.getLocalPort() == puertoGestion).permitAll()

                        .anyRequest().authenticated();
                })

                // Sin token o con token inválido: 401. Autenticado pero sin permiso: 403.
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                escribirError(response, HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para acceder a este recurso", request.getRequestURI())
                        )
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                escribirError(response, HttpStatus.FORBIDDEN, "No tienes permiso para acceder a este recurso", request.getRequestURI())
                        )
                )

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    private void escribirError(HttpServletResponse response, HttpStatus status, String mensaje, String path) throws IOException {

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(jsonMapper.writeValueAsString(new ErrorResponse(status, mensaje, path)));
    }
}
