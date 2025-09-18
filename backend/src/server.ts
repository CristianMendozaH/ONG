import 'dotenv/config';
import app from './app';
import { sequelize } from './config/database'; // asegúrate de exportar `sequelize` ahí

const PORT = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  try {
    // Conexión a la base de datos
    await sequelize.authenticate();
    await sequelize.sync(); // { alter: true } si estás en dev y lo necesitas
    console.log('✅ DB conectada y sincronizada');

    // Inicia el servidor para que escuche peticiones
    app.listen(PORT, () => {
      console.log(`🚀 API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

bootstrap();