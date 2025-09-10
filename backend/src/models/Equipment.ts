import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

export type EquipmentStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';

@Table({ tableName: 'equipments', timestamps: true })
export class Equipment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.STRING, unique: true })
  code!: string; // p.ej. EQ001

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  type!: string; // laptop/proyector/tablet/etc

  @Default('disponible')
  @Column(DataType.STRING)
  status!: EquipmentStatus;

  @Column(DataType.TEXT)
  description?: string;
}
