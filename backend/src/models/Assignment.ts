import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Equipment } from './Equipment';
import { Collaborator } from './Collaborator';

export type AssignmentStatus = 'assigned' | 'released';

@Table({ tableName: 'assignments', timestamps: true })
export class Assignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  // Correcto: Ambos decoradores van juntos, encima de la propiedad.
  @ForeignKey(() => Equipment)
  @Column({ field: 'equipment_id', type: DataType.UUID })
  equipmentId!: string;

  // Correcto: Ambos decoradores van juntos, encima de la propiedad.
  @ForeignKey(() => Collaborator)
  @Column({ field: 'collaborator_id', type: DataType.UUID })
  collaboratorId!: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATEONLY, field: 'assignment_date' }) // También aplica el 'field' aquí por consistencia
  assignmentDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'release_date' }) // Y aquí
  releaseDate?: string;

  @Default('assigned')
  @Column(DataType.STRING)
  status!: AssignmentStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  observations?: string;

  // Relaciones
  @BelongsTo(() => Equipment)
  equipment?: Equipment;

  @BelongsTo(() => Collaborator)
  collaborator?: Collaborator;
}