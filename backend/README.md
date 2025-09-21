# Backend API - Sistema de Gestión

## 🚀 Tecnologías Utilizadas

- **Node.js** v18+ - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **Sequelize** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación mediante tokens
- **bcrypt** - Encriptación de contraseñas
- **Joi** - Validación de esquemas
- **Winston** - Sistema de logging

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, JWT, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── middlewares/     # Middlewares personalizados
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades y helpers
│   └── app.js           # Configuración principal de Express
├── migrations/          # Migraciones de base de datos
├── seeders/            # Datos de prueba
├── tests/              # Tests unitarios e integración
├── .env.example        # Ejemplo de variables de entorno
├── package.json
└── server.js           # Punto de entrada
```

## ⚙️ Configuración del Entorno

### Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_gestion
DB_USER=postgres
DB_PASSWORD=tu_password

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=debug

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_app
```

## 🗄️ Base de Datos

### Configuración PostgreSQL

1. **Instalar PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows - Descargar desde postgresql.org
   ```

2. **Crear base de datos:**
   ```sql
   CREATE DATABASE sistema_gestion;
   CREATE USER tu_usuario WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE sistema_gestion TO tu_usuario;
   ```

### Migraciones y Seeders

```bash
# Ejecutar migraciones
npm run migrate

# Ejecutar seeders (datos de prueba)
npm run seed

# Revertir última migración
npm run migrate:undo

# Crear nueva migración
npm run migration:create -- --name nombre_de_la_migracion

# Crear nuevo seeder
npm run seed:create -- --name nombre_del_seeder
```

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar variables de entorno
nano .env

# Ejecutar migraciones
npm run migrate

# Poblar con datos de prueba (opcional)
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con nodemon (hot reload)
npm start            # Servidor de producción

# Base de Datos
npm run migrate      # Ejecutar migraciones
npm run migrate:undo # Revertir migración
npm run seed         # Ejecutar seeders
npm run db:reset     # Reset completo de la DB

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con coverage

# Linting y formato
npm run lint         # ESLint
npm run lint:fix     # ESLint con autofix
npm run format       # Prettier

# Producción
npm run build        # Build para producción
```

## 🛣️ Rutas de la API

### Autenticación
```
POST   /api/auth/login      # Iniciar sesión
POST   /api/auth/register   # Registrar usuario
POST   /api/auth/logout     # Cerrar sesión
GET    /api/auth/me         # Obtener usuario actual
POST   /api/auth/refresh    # Renovar token
```

### Usuarios
```
GET    /api/users           # Listar usuarios (admin)
GET    /api/users/:id       # Obtener usuario por ID
PUT    /api/users/:id       # Actualizar usuario
DELETE /api/users/:id       # Eliminar usuario (admin)
POST   /api/users           # Crear usuario (admin)
```

### Perfil
```
GET    /api/profile         # Obtener perfil actual
PUT    /api/profile         # Actualizar perfil
PUT    /api/profile/password # Cambiar contraseña
```

## 🔐 Sistema de Autenticación

### JWT Implementation

```javascript
// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Middleware de Roles

```javascript
// Verificar roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Permisos insuficientes' 
      });
    }
    next();
  };
};

// Uso: requireRole(['admin', 'tech'])
```

## 🗃️ Modelos de Base de Datos

### Modelo User

```javascript
// models/User.js
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'tech', 'user'),
    defaultValue: 'user'
  }
});
```

## 📊 Logging

Sistema de logs con Winston:

```javascript
// Configuración en config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

## 🧪 Testing

### Configuración de Tests

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Ejemplo de Test

```javascript
// tests/auth.test.js
describe('Auth Controller', () => {
  test('POST /auth/login should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});
```

## 🚀 Despliegue

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Variables de Producción

```bash
NODE_ENV=production
DB_HOST=tu_db_host
DB_NAME=sistema_gestion_prod
JWT_SECRET=jwt_secret_super_seguro_para_produccion
LOG_LEVEL=error
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de conexión a DB:**
   ```bash
   # Verificar que PostgreSQL esté ejecutándose
   sudo systemctl status postgresql
   
   # Verificar credenciales en .env
   ```

2. **Puerto en uso:**
   ```bash
   # Cambiar puerto en .env o matar proceso
   lsof -ti:3000 | xargs kill -9
   ```

3. **Error en migraciones:**
   ```bash
   # Reset completo de la DB
   npm run db:reset
   ```

## 📚 Recursos Adicionales

- [Documentación de Express.js](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 👨‍💻 Desarrollado por

**Cristian Daniel Mendoza Hernández**
- Email: cristian.mendoza@example.com