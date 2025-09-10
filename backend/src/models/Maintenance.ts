import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Equipment } from './Equipment';

@Table({ tableName: 'maintenances', timestamps: true })
export class Maintenance extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Equipment)
  @Column(DataType.UUID)
  equipmentId!: string;

  @Column(DataType.DATEONLY)
  scheduledDate!: string;

  @Column(DataType.STRING)   // preventivo/correctivo/predictivo/emergencia
  type!: string;

  @Column(DataType.STRING)   // alta/media/baja
  priority!: string;

  @Default('programado')     // programado/en-proceso/completado/cancelado
  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.STRING)
  technician?: string;

  @Column(DataType.TEXT)
  description?: string;

  // 👇 para poder hacer include del equipo en consultas
  @BelongsTo(() => Equipment, 'equipmentId')
  equipment?: Equipment;
}
