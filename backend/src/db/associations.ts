import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';
import { Assignment } from '../models/Assignment.js';
import { Collaborator } from '../models/Collaborator.js';

export function defineAssociations() {
  // --- Relaciones que EMPIEZAN en User (hasMany) ---
  // Cada una de estas relaciones necesita un alias único para que User sepa
  // a qué lista de "hijos" se refiere.
  User.hasMany(Equipment, { foreignKey: 'createdBy', as: 'equipmentsCreated' });
  User.hasMany(Loan, { foreignKey: 'registeredById', as: 'loansRegistered' });
  User.hasMany(Assignment, { foreignKey: 'createdById', as: 'assignmentsCreated' });
  User.hasMany(Collaborator, { foreignKey: 'createdById', as: 'collaboratorsCreated' });

  // --- Relaciones que LLEGAN a User (belongsTo) ---
  // Aquí el alias 'creator' puede ser reutilizado porque el modelo de origen es diferente.
  Equipment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Loan.belongsTo(User, { foreignKey: 'registeredById', as: 'registeredBy' });
  Assignment.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
  Collaborator.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });


  // --- Relaciones de Equipment ---
  Equipment.hasMany(Loan, { foreignKey: 'equipmentId', as: 'loans' });
  Loan.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

  Equipment.hasMany(Maintenance, { foreignKey: 'equipmentId', as: 'maintenances' });
  Maintenance.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipmentUnderMaintenance' });

  Equipment.hasMany(Assignment, { foreignKey: 'equipmentId', as: 'assignments' });
  Assignment.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'assignedEquipment' });


  // --- Relaciones de Collaborator ---
  Collaborator.hasMany(Assignment, { foreignKey: 'collaboratorId', as: 'assignments' });
  Assignment.belongsTo(Collaborator, { foreignKey: 'collaboratorId', as: 'collaborator' });
}