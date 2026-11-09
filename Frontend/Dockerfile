# Frontend de Mis Finanzas para el homelab: se compila la web y la sirve Nginx,
# que además reenvía /api al backend (misma dirección para todo, sin CORS)

# ---------- Compilación ----------
FROM node:22-alpine AS compilacion
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# ---------- Servidor web ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /src/www /usr/share/nginx/html
EXPOSE 80
