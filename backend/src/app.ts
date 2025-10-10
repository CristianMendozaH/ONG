import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

// --- Middlewares de seguridad y utilidad ---
app.use(helmet());
// Esta configuración de CORS es adecuada para desarrollo
app.use(cors({ origin: true, credentials: true })); 
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --- Rutas de la aplicación ---
app.get('/', (_req, res) => res.send('Backend OK ✅'));

// La siguiente línea es la solución clave.
// Le dice a Express que todas las rutas definidas en el archivo './routes/index.js'
// deben tener el prefijo '/api'. Esto hace que coincida con las llamadas del frontend.
app.use('/api', routes);


// --- Middlewares para manejo de errores ---
app.use(notFound);
app.use(errorHandler);

export default app;