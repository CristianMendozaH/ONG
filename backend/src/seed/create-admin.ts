import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../db/sequelize.js';
import { User } from '../models/User.js';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // asegura tablas en dev

  const email = process.env.ADMIN_EMAIL!;
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    console.log('Admin ya existe:', email);
    process.exit(0);
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, rounds);

  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Administrador',
    email,
    passwordHash: hash,
    role: 'admin',
    active: true,
  });

  console.log('Admin creado ✅', { id: admin.id, email: admin.email });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
