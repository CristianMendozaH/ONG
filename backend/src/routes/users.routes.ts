import { Router } from 'express';
import { listUsers, createUser, updateUser, resetPassword } from '../controllers/users.controller.js';
import { auth, requireRole } from '../middleware/auth';

const r = Router();
r.use(auth, requireRole('admin'));

r.get('/', listUsers);
r.post('/', createUser);
r.put('/:id', updateUser);
r.post('/:id/reset-password', resetPassword);

export default r;
