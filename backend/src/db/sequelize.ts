import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env.js';

// ++ PASO 1: Importa los modelos que faltaban
import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';
import { Config } from '../models/Config.js'; // <-- AÑADIDO
import { Assignment } from '../models/Assignment.js'; // <-- AÑADIDO

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.pass,
  logging: false,

  // ++ PASO 2: Añade los modelos al array
  models: [
    User,
    Equipment,
    Loan,
    Maintenance,
    Config,      // <-- AÑADIDO
    Assignment   // <-- AÑADIDO
  ], 
});

// Relaciones (si no las pusiste aún)
Equipment.hasMany(Loan, { foreignKey: 'equipmentId' });
Loan.belongsTo(Equipment, { foreignKey: 'equipmentId' });

Equipment.hasMany(Maintenance, { foreignKey: 'equipmentId' });
Maintenance.belongsTo(Equipment, { foreignKey: 'equipmentId' });