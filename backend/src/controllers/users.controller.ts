import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function listUsers(_req: Request, res: Response) {
  const rows = await User.findAll({ order: [['createdAt', 'DESC']] });
  res.json(rows);
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Faltan campos' });
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, rounds);
  const user = await User.create({ name, email, passwordHash, role, active: true });
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { name, role, active } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  await user.update({ name, role, active });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  await user.destroy();
  res.sendStatus(204);
}

// --- FUNCIÓN MODIFICADA ---
// Renombrada de 'resetPassword' a 'changePassword'
export async function changePassword(req: Request, res: Response) {
  // Se obtiene 'newPassword' del body para coincidir con la petición de Angular
  const { newPassword } = req.body;

  // Se valida que la nueva contraseña exista
  if (!newPassword) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida' });
  }

  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  // Se usa 'newPassword' para generar el hash
  const passwordHash = await bcrypt.hash(newPassword, rounds);

  // Aquí podrías agregar lógica adicional, como guardar la opción 'forcePasswordChange'
  await user.update({ passwordHash /* , passwordReset: req.body.forcePasswordChange */ });
  
  // Se envía una respuesta exitosa
  res.status(200).json({ message: 'Contraseña cambiada correctamente' });
}
// --- FIN DE LA FUNCIÓN MODIFICADA ---