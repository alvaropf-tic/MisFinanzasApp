package com.misfinanzas.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

// Swagger UI: http://localhost:8090/swagger-ui.html
// Pulsa "Authorize" y pega el token del login para probar los endpoints protegidos
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA_JWT = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("Mis Finanzas API")
                        .description("API REST de la app de finanzas personales: gastos, ingresos, presupuestos, vehículos, tickets y estadísticas.")
                        .version("v1"))
                .components(new Components()
                        .addSecuritySchemes(ESQUEMA_JWT, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA_JWT));
    }

    // El registro y el login son públicos: se les quita el candado en la documentación
    @Bean
    public OpenApiCustomizer endpointsPublicos() {

        return openApi -> {
            quitarSeguridad(openApi, "/api/usuarios");
            quitarSeguridad(openApi, "/api/auth/login");
        };
    }

    private void quitarSeguridad(OpenAPI openApi, String ruta) {

        if (openApi.getPaths() != null && openApi.getPaths().get(ruta) != null && openApi.getPaths().get(ruta).getPost() != null) {
            openApi.getPaths().get(ruta).getPost().setSecurity(List.of());
        }
    }
}
