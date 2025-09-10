import 'dotenv/config';
import bcrypt from 'bcrypt';
import { sequelize } from '../db/sequelize.js';
import { User } from '../models/User.js';

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const newPass = process.env.ADMIN_PASSWORD || '';
  if (!email || !newPass) {
    console.error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD en .env');
    process.exit(1);
  }

  await sequelize.authenticate();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error('No existe el usuario con ese email:', email);
    process.exit(1);
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const hash = await bcrypt.hash(newPass, rounds);

  await user.update({ passwordHash: hash, active: true });
  console.log('Contraseña del admin actualizada ✅', { email });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
