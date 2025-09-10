import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.pass,
  models: [User, Equipment, Loan, Maintenance], // <-- ¡IMPORTANTE!
  logging: false
});

// Relaciones (si no las pusiste aún)
Equipment.hasMany(Loan, { foreignKey: 'equipmentId' });
Loan.belongsTo(Equipment, { foreignKey: 'equipmentId' });

Equipment.hasMany(Maintenance, { foreignKey: 'equipmentId' });
Maintenance.belongsTo(Equipment, { foreignKey: 'equipmentId' });
