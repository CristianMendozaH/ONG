import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

// NO importamos BelongsTo ni User aquí para mantener el modelo limpio de relaciones

export type CollaboratorType = 'Colaborador' | 'Becado';

@Table({ tableName: 'collaborators', timestamps: true })
export class Collaborator extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ field: 'full_name', type: DataType.STRING })
  fullName!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  position?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  program?: string;
  
  @Column({ type: DataType.STRING, allowNull: true })
  contact?: string;

  @Default('Colaborador')
  @Column({ type: DataType.STRING, allowNull: false })
  type!: CollaboratorType;

  @Default(true)
  @Column({ field: 'is_active', type: DataType.BOOLEAN })
  isActive!: boolean;

  @Column({ field: 'createdById', type: DataType.UUID, allowNull: true })
  createdById?: string;

  // La propiedad 'creator' y el decorador @BelongsTo han sido eliminados.
  // La relación ahora se maneja exclusivamente en 'associations.ts'.
}