import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js'; // 👈 sin .js
import { auth } from '../middleware/auth.js';                 // 👈 carpeta singular

const r = Router();

r.post('/login', login);
r.get('/me', auth, me);

export default r;
