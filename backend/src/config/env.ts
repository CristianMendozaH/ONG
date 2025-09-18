import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? 'sistema_equipos',
    user: process.env.DB_USER ?? 'postgres',
    pass: process.env.DB_PASS ?? '12345879',
  },
  finePerDay: Number(process.env.FINE_PER_DAY ?? 5),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h', // <-- LÍNEA AÑADIDA
};