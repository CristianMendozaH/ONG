import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'; // <-- 1. LA IMPORTACIÓN CORRECTA
import { User } from '../models/User.js';
import { env } from '../config/env.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; role: string; iat: number; exp: number; }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'El email y la contraseña son obligatorios.' });
    }

    const user = await User.findOne({ where: { email, active: true } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const jwtPayload = {
      sub: user.id,
      role: user.role,
    };

    // 2. LA LLAMADA CORRECTA (usando el objeto 'jwt')
    const token = jwt.sign(
  jwtPayload,
  env.jwtSecret as jwt.Secret,
  { expiresIn: '2h' }
  );
    res.status(200).json({ token, user });

  } catch (error) {
    console.error('Error en el proceso de login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Token inválido, no se encontró ID de usuario.' });
    }

    const user = await User.findByPk(userId);

    if (!user || !user.active) {
      return res.status(404).json({ message: 'Usuario no encontrado o ha sido desactivado.' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}