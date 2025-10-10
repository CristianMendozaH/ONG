import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'maintenances', timestamps: true })
export class Maintenance extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  // LIMPIEZA: Se eliminó el decorador @ForeignKey
  @Column(DataType.UUID)
  equipmentId!: string;

  @Column(DataType.DATEONLY)
  scheduledDate!: string;
  
  @Column(DataType.DATEONLY)
  performedDate?: string;

  @Column(DataType.STRING)
  type!: string;

  @Column(DataType.STRING)
  priority!: string;

  @Default('programado')
  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.STRING)
  technician?: string;

  @Column(DataType.TEXT)
  description?: string;

  // LIMPIEZA: La relación @BelongsTo y la propiedad 'equipment' fueron eliminadas.
}