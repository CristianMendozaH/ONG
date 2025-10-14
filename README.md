# Sistema de Gestión - Full Stack Application

## 📋 Descripción del Proyecto

Sistema de gestión full-stack desarrollado con Angular (frontend) y Node.js con Express (backend). La aplicación incluye un sistema de autenticación robusto con diferentes niveles de roles (admin, tech, user) y gestión de usuarios mediante Angular Signals para un manejo reactivo del estado.

## 🏗️ Arquitectura del Proyecto

```
proyecto/
├── frontend/          # Aplicación Angular
├── backend/           # API REST con Node.js + Express
├── docker-compose.yml # Configuración para desarrollo
└── README.md         # Este archivo
```

## ✨ Características Principales

- **Frontend Angular** con Signals para manejo reactivo del estado
- **Backend Node.js** con Express y Sequelize ORM
- **Base de datos PostgreSQL** con migraciones automáticas
- **Sistema de autenticación** con JWT
- **Roles de usuario** (admin, tech, user) con permisos granulares
- **Containerización** con Docker para desarrollo

## 🔧 Requisitos del Sistema

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Docker** y **Docker Compose** (opcional, para desarrollo)

## 🚀 Instalación y Configuración

### Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio:**
   ```bash
   git clone [url-del-repositorio]
   cd proyecto
   ```

2. **Levantar todos los servicios:**
   ```bash
   docker-compose up -d
   ```

3. **La aplicación estará disponible en:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

### Opción 2: Instalación Manual

1. **Configurar Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con tus configuraciones
   npm run migrate
   npm run dev
   ```

2. **Configurar Frontend:**
   ```bash
   cd frontend
   npm install
   cp src/environments/environment.example.ts src/environments/environment.ts
   # Editar environment.ts según sea necesario
   ng serve
   ```

## 🌐 URLs de Acceso

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000
- **Documentación API:** http://localhost:3000/api-docs (Swagger)

## 👥 Usuarios de Prueba

El sistema incluye usuarios de prueba para cada rol:

```typescript
// Admin - Acceso completo
email: cristian.mendoza@example.com
role: admin

// Tech - Acceso técnico
email: tech@example.com  
role: tech

// User - Acceso básico
email: user@example.com
role: user
```

## 🔐 Sistema de Roles

- **Admin:** Acceso completo a todas las funcionalidades
- **Tech:** Acceso técnico, puede realizar operaciones especializadas
- **User:** Acceso básico a funciones estándar

## 📚 Documentación Adicional

- [Backend README](./backend/README.md) - Detalles técnicos del servidor
- [Frontend README](./frontend/README.md) - Configuración de Angular

## 🛠️ Comandos Útiles

```bash
# Desarrollo con Docker
docker-compose up -d              # Levantar servicios
docker-compose down               # Detener servicios
docker-compose logs -f [servicio] # Ver logs

# Desarrollo local
npm run dev:backend               # Solo backend
npm run dev:frontend              # Solo frontend
npm run dev                       # Ambos simultáneamente
```

## 📝 Variables de Entorno

Cada servicio requiere su propio archivo de configuración:
- Backend: `/backend/.env`
- Frontend: `/frontend/src/environments/environment.ts`

Revisa los README específicos de cada directorio para más detalles.

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit de cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Cristian Daniel Mendoza Hernández**
- Email: cristian8mendoza8@gmail.com