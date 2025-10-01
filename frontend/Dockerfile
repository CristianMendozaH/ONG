# frontend/Dockerfile

# --- ETAPA 1: Compilación (Build) ---
FROM node:18-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar todo el código fuente (línea duplicada eliminada)
COPY . .

# Compilar la aplicación de Angular para producción
RUN npm run build -- --configuration production

# --- ETAPA 2: Servidor Web (Serve) ---
FROM nginx:1.23-alpine

# ⚠️ ¡AJUSTE CRÍTICO AQUÍ!
# Reemplaza "tu-nombre-de-proyecto" con el nombre real de la carpeta en /dist
COPY --from=build /usr/src/app/dist/tu-nombre-de-proyecto /usr/share/nginx/html

# Exponer el puerto 80 (puerto estándar de Nginx)
EXPOSE 80
