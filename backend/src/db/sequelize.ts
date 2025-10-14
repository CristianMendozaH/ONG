import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env.js';

// Importación de todos los modelos de la aplicación
import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';
import { Config } from '../models/Config.js';
import { Assignment } from '../models/Assignment.js';
import { Collaborator } from '../models/Collaborator.js';

// 1. Se importa la nueva función que define todas las asociaciones
import { defineAssociations } from './associations.js';

// Creación de la instancia de Sequelize
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.pass,
  logging: false, // Puedes ponerlo en `true` para ver las consultas SQL en la consola
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

// 2. Se llama a la función aquí para configurar todas las relaciones
// Esto asegura que todos los modelos estén cargados antes de intentar crear las asociaciones.
defineAssociations();