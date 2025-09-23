import { Router } from 'express';
// Se agrega `deleteUser` a la lista de importaciones del controlador
import { listUsers, createUser, updateUser, changePassword, deleteUser } from '../controllers/users.controller.js';
import { auth, requireRole } from '../middleware/auth';

const r = Router();
r.use(auth, requireRole('admin'));

r.get('/', listUsers);
r.post('/', createUser);
r.put('/:id', updateUser);
r.delete('/:id', deleteUser);
r.post('/:id/change-password', changePassword);

export default r;