import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

export type EquipmentStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';

// Cambiado el nombre de la tabla a 'Equipos' para coincidir con tu migración y el estándar del proyecto.
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

  // =======================================================================
  // ++ CAMBIO REALIZADO AQUÍ ++
  // Se añade el campo 'serial' para el número de serie del equipo.
  // Es opcional (allowNull: true), pero si existe, debe ser único (unique: true).
  // =======================================================================
  @Column({
    type: DataType.STRING(100), // Se define una longitud máxima
    allowNull: true,
    unique: true,
  })
  serial?: string;

  @Column(DataType.STRING)
  type!: string; // laptop/proyector/tablet/etc

  @Default('disponible')
  @Column(DataType.STRING)
  status!: EquipmentStatus;

  @Column(DataType.TEXT)
  description?: string;
}