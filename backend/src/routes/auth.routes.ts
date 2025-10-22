import { Router } from 'express';
// --- ACTUALIZADO: Se importan las nuevas funciones del controlador ---
import { login, me, register, resetPassword } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const r = Router();

// --- RUTAS PÚBLICAS (No requieren token) ---
r.post('/login', login);

// --- NUEVAS RUTAS AÑADIDAS ---
r.post('/register', register);
r.post('/reset-password', resetPassword);


// --- RUTA PRIVADA (Requiere un token válido) ---
r.get('/me', auth, me);

export default r;

