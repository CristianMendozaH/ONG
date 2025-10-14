import { User } from '../models/User.js';
import { Equipment } from '../models/Equipment.js';
import { Loan } from '../models/Loan.js';
import { Maintenance } from '../models/Maintenance.js';
import { Assignment } from '../models/Assignment.js';
import { Collaborator } from '../models/Collaborator.js';

export function defineAssociations() {
  // --- Relaciones de User ---
  User.hasMany(Equipment, { foreignKey: 'createdBy', as: 'equipments' });
  Equipment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  User.hasMany(Loan, { foreignKey: 'registeredById', as: 'loansRegistered' });
  Loan.belongsTo(User, { foreignKey: 'registeredById', as: 'registeredBy' });

  // 👇 --- INICIO DE LA CORRECCIÓN --- 👇
  // Un Usuario crea muchas Asignaciones
  User.hasMany(Assignment, { foreignKey: 'createdById', as: 'createdAssignments' });
  Assignment.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
  // 👆 --- FIN DE LA CORRECCIÓN --- 👆


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