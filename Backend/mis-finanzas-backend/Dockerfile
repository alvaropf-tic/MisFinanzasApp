# Backend de Mis Finanzas para el homelab (Raspberry Pi 4, arm64; también vale en x86)
# Se compila dentro de la imagen: no hace falta Java ni Maven en la Pi

# ---------- Compilación ----------
FROM maven:3.9-eclipse-temurin-21 AS compilacion
WORKDIR /src

# Primero solo el pom: las dependencias quedan en caché mientras no cambie
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B -DskipTests package && cp target/*.jar /app.jar

# ---------- Ejecución ----------
FROM eclipse-temurin:21-jre

# Usuario sin privilegios; las fotos de los tickets van en /app/data (volumen)
RUN useradd --system --uid 10001 --home /app misfinanzas \
    && mkdir -p /app/data/tickets \
    && chown -R misfinanzas /app
WORKDIR /app
COPY --from=compilacion /app.jar app.jar
USER misfinanzas

ENV SPRING_PROFILES_ACTIVE=prod \
    TICKETS_DIR=/app/data/tickets \
    MANAGEMENT_ADDRESS=0.0.0.0 \
    JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseSerialGC -XX:MaxMetaspaceSize=160m"

EXPOSE 8090 8091

# Comprueba la salud por el puerto de gestión (no se publica fuera del contenedor)
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8091/actuator/health >/dev/null 2>&1 || curl -fs http://127.0.0.1:8091/actuator/health >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
