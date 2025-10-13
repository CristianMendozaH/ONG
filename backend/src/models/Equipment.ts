import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { User } from './User.js';

// Este tipo se usa para asegurar el tipado en el código de TypeScript (backend y frontend).
export type EquipmentStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado' | 'asignado';

@Table({
  tableName: 'equipments',
  timestamps: true // Habilita createdAt y updatedAt automáticamente
})
export class Equipment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(50),  // Se define una longitud máxima para optimización.
    unique: true,               // El código debe ser único en la tabla.
    allowNull: false            // Es un campo obligatorio.
  })
  code!: string;

  @Column({
    type: DataType.STRING(100), // Se define una longitud máxima.
    allowNull: false            // Es un campo obligatorio.
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,            // El número de serie es opcional.
    unique: true,               // Pero si existe, debe ser único.
  })
  serial?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false            // Es un campo obligatorio.
  })
  type!: string;

  @Default('disponible')
  @Column({
    // Se usa ENUM para restringir los valores posibles a nivel de base de datos.
    // Esto previene que se guarden estados inválidos.
    type: DataType.ENUM('disponible', 'prestado', 'mantenimiento', 'dañado', 'asignado'),
    allowNull: false
  })
  status!: EquipmentStatus;

  @Column({
    type: DataType.TEXT,        // TEXT para descripciones largas.
    allowNull: true             // La descripción es opcional.
  })
  description?: string;

  // --- Relación con el Usuario Creador ---

  @ForeignKey(() => User)       // Define la llave foránea hacia el modelo User.
  @Column({
    type: DataType.UUID,
    allowNull: false            // Un equipo siempre debe tener un usuario creador.
  })
  createdBy!: string;

  // Define la relación para poder hacer `include` y obtener los datos del creador.
  @BelongsTo(() => User, 'createdBy')
  creator!: User;
}