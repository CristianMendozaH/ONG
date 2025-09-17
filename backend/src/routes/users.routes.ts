import { Router } from 'express';
// Se agrega `deleteUser` a la lista de importaciones del controlador
import { listUsers, createUser, updateUser, resetPassword, deleteUser } from '../controllers/users.controller.js';
import { auth, requireRole } from '../middleware/auth';

const r = Router();
r.use(auth, requireRole('admin'));

r.get('/', listUsers);
r.post('/', createUser);
r.put('/:id', updateUser);
r.delete('/:id', deleteUser); // <-- SE AÑADIÓ ESTA LÍNEA
r.post('/:id/reset-password', resetPassword);

export default r;