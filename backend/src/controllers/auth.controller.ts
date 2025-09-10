import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email y password requeridos' });

  const user = await User.findOne({ where: { email, active: true } });
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: process.env.JWT_EXPIRES || '2d' });
  res.json({ token, user });
}

export async function me(_req: Request, res: Response) {
  res.json({ user: ( _req as any ).user });
}
