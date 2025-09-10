import { Router } from 'express';
import { login, me } from '../controllers/auth.controller'; // 👈 sin .js
import { auth } from '../middleware/auth';                 // 👈 carpeta singular

const r = Router();

r.post('/login', login);
r.get('/me', auth, me);

export default r;
