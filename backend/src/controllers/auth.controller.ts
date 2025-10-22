import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

// Interfaz para que TypeScript conozca la propiedad 'user' en el objeto 'req'
interface AuthenticatedRequest extends Request {
  user?: { sub: string; role: string; iat: number; exp: number; }
}

// --- Tu función de login (sin cambios) ---
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

    if (!env.jwtSecret) {
      throw new Error('JWT_SECRET no está definida en el archivo .env');
    }

    const token = jwt.sign(jwtPayload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as any,
    });

    res.status(200).json({ token, user });

  } catch (error) {
    console.error('Error en el proceso de login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

// --- NUEVA FUNCIÓN DE REGISTRO PÚBLICO ---
export async function register(req: Request, res: Response) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'El nombre, email y contraseña son obligatorios.' });
    }

    // 1. Verificar si el correo ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    // 2. Hashear la contraseña (usando bcryptjs como en tu login)
    const rounds = 10;
    const passwordHash = await bcryptjs.hash(password, rounds);

    // 3. Crear el nuevo usuario (con un rol por defecto, ej. 'tecnico')
    const newUser = await User.create({
      name: nombre,
      email,
      passwordHash,
      role: 'tecnico', // O el rol por defecto que prefieras para nuevos registros
      active: true
    });

    // 4. Enviar respuesta exitosa (sin devolver el hash)
    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: newUser.active
    });

  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

// --- NUEVA FUNCIÓN PARA RESTABLECER CONTRASEÑA ---
export async function resetPassword(req: Request, res: Response) {
  try {
    // El frontend envía 'email' y 'nuevaContrasena'
    const { email, nuevaContrasena } = req.body;

    if (!email || !nuevaContrasena) {
      return res.status(400).json({ message: 'El email y la nueva contraseña son requeridos.' });
    }

    // 1. Encontrar al usuario por su email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Por seguridad, puedes dar un mensaje genérico, pero para desarrollo esto es más claro.
      return res.status(404).json({ message: 'No se encontró un usuario con ese correo electrónico.' });
    }

    // 2. Hashear la nueva contraseña
    const rounds = 10;
    const passwordHash = await bcryptjs.hash(nuevaContrasena, rounds);

    // 3. Actualizar al usuario con el nuevo hash
    await user.update({ passwordHash });

    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}


// --- Tu función 'me' (sin cambios) ---
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
