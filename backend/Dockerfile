# backend/Dockerfile

# 1. Usar una imagen base oficial de Node.js (versión LTS)
FROM node:18-alpine AS base

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de dependencias
COPY package*.json ./

# 4. Instalar dependencias de producción
RUN npm install --only=production

# 5. Copiar el resto del código de la aplicación
COPY . .

# 6. Exponer el puerto en el que corre el backend (AJUSTADO)
EXPOSE 4000

# 7. El comando para iniciar la aplicación cuando el contenedor se ejecute
CMD ["npm", "start"]