import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

export type AssignmentStatus = 'assigned' | 'released' | 'donated';

@Table({ tableName: 'assignments', timestamps: true })
export class Assignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  // LIMPIEZA: Se eliminó el decorador @ForeignKey
  @Column({ field: 'equipment_id', type: DataType.UUID })
  equipmentId!: string;

  // LIMPIEZA: Se eliminó el decorador @ForeignKey
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

  @Column({ 
    type: DataType.ARRAY(DataType.TEXT), 
    allowNull: true 
  })
  accessories?: string[];

  // LIMPIEZA: Se eliminó el decorador @ForeignKey
  @Column({ 
    field: 'createdById',
    type: DataType.UUID, 
    allowNull: true 
  })
  createdById?: string;

  // LIMPIEZA: Todas las relaciones @BelongsTo y sus propiedades fueron eliminadas.
}