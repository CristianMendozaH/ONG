import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey
} from 'sequelize-typescript';

export type EquipmentStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado' | 'asignado';

@Table({
  tableName: 'equipments',
  timestamps: true
})
export class Equipment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(50),
    unique: true,
    allowNull: false
  })
  code!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    unique: true,
  })
  serial?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  type!: string;

  @Default('disponible')
  @Column({
    type: DataType.ENUM('disponible', 'prestado', 'mantenimiento', 'dañado', 'asignado'),
    allowNull: false
  })
  status!: EquipmentStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description?: string;

  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  createdBy!: string;

  // La relación @BelongsTo ya había sido eliminada.
}