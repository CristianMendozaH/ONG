import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

export type EquipmentStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado' | 'asignado';

@Table({ tableName: 'equipments', timestamps: true })
export class Equipment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.STRING, unique: true })
  code!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    unique: true,
  })
  serial?: string;

  @Column(DataType.STRING)
  type!: string;

  @Default('disponible')
  @Column(DataType.STRING)
  status!: EquipmentStatus;

  @Column(DataType.TEXT)
  description?: string;

  // ++ AÑADIDO: Define la columna y la relación con el usuario ++
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdBy!: string;

  @BelongsTo(() => User, 'createdBy')
  creator!: User;
}