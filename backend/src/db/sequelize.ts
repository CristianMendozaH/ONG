import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env.js';

import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';
import { Config } from '../models/Config.js';
import { Assignment } from '../models/Assignment.js';
import { Collaborator } from '../models/Collaborator.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.pass,
  logging: false,

  models: [
    User,
    Equipment,
    Loan,
    Maintenance,
    Config,
    Assignment,
    Collaborator
  ], 
});

// =======================================================================
// DEFINICIÓN DE RELACIONES
// =======================================================================

// -- ELIMINADO: Se quitaron las líneas de User <-> Equipment de aquí
// porque ya están definidas en los modelos con los decoradores.

// --- Relaciones de Equipos ---
Equipment.hasMany(Loan, { foreignKey: 'equipmentId' });
Loan.belongsTo(Equipment, { foreignKey: 'equipmentId' });

Equipment.hasMany(Maintenance, { foreignKey: 'equipmentId' });
Maintenance.belongsTo(Equipment, { foreignKey: 'equipmentId' });

// --- Relaciones para Asignaciones ---
Equipment.hasMany(Assignment, { foreignKey: 'equipmentId' });
Assignment.belongsTo(Equipment, { foreignKey: 'equipmentId' });

Collaborator.hasMany(Assignment, { foreignKey: 'collaboratorId' });
Assignment.belongsTo(Collaborator, { foreignKey: 'collaboratorId' });