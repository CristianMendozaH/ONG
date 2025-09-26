import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Equipment } from './Equipment';
import { User } from './User'; // Asumimos que el asignado es un usuario del sistema

export type AssignmentStatus = 'activa' | 'finalizada';

@Table({ tableName: 'assignments', timestamps: true })
export class Assignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Equipment)
  @Column(DataType.UUID)
  equipmentId!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string; // El colaborador al que se le asigna

  @Default(DataType.NOW)
  @Column(DataType.DATEONLY)
  assignmentDate!: string; // Fecha de asignación

  @Column({ type: DataType.DATEONLY, allowNull: true })
  returnDate?: string; // Fecha en que se devuelve (cuando finaliza la asignación)

  @Default('activa')
  @Column(DataType.STRING)
  status!: AssignmentStatus;

  @Column(DataType.TEXT)
  observations?: string; // Para notas como "Acta de entrega #123 firmada"

  // Relaciones para poder hacer `include` en las consultas
  @BelongsTo(() => Equipment)
  equipment?: Equipment;

  @BelongsTo(() => User)
  user?: User;
}

export default Assignment;