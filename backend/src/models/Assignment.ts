// Archivo completo: src/models/Assignment.ts

import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Equipment } from './Equipment.js';
import { Collaborator } from './Collaborator.js';
import { User } from './User.js'; // <-- Asegúrate de importar tu modelo User

// ✅ Tipo de estado actualizado para incluir 'donated'
export type AssignmentStatus = 'assigned' | 'released' | 'donated';

@Table({ tableName: 'assignments', timestamps: true })
export class Assignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Equipment)
  @Column({ field: 'equipment_id', type: DataType.UUID })
  equipmentId!: string;

  @ForeignKey(() => Collaborator)
  @Column({ field: 'collaborator_id', type: DataType.UUID })
  collaboratorId!: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATEONLY, field: 'assignment_date' })
  assignmentDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'release_date' })
  releaseDate?: string;

  @Default('assigned')
  @Column(DataType.STRING)
  status!: AssignmentStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  observations?: string;

  // --- ✅ INICIO: CAMPOS ACTUALIZADOS Y AÑADIDOS ---

  @Column({ 
    type: DataType.ARRAY(DataType.TEXT), 
    allowNull: true 
  })
  accessories?: string[];

  @ForeignKey(() => User) // <-- Enlace a la tabla de Usuarios
  @Column({ 
    field: 'createdById', // <-- Guarda el ID del usuario
    type: DataType.UUID, 
    allowNull: true 
  })
  createdById?: string;
  
  // --- FIN DE CAMPOS ---

  // Relaciones
  @BelongsTo(() => Equipment)
  equipment?: Equipment;

  @BelongsTo(() => Collaborator)
  collaborator?: Collaborator;

  @BelongsTo(() => User) // <-- Define la relación
  creator?: User;
}