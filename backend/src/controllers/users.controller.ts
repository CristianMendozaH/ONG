import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
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

export async function resetPassword(req: Request, res: Response) {
  const { password } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, rounds);
  await user.update({ passwordHash });
  res.json({ ok: true });
}
