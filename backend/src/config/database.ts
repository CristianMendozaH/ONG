import { Sequelize } from 'sequelize';

const dbUrl = process.env.DATABASE_URL!;
const ssl = process.env.DB_SSL === 'true';

export const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
  } catch (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
}
