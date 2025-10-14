import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'collaborators', timestamps: true })
export class Collaborator extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ field: 'full_name', type: DataType.STRING })
  fullName!: string;

  @Column(DataType.STRING)
  position!: string;

  @Column(DataType.STRING)
  program!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  contact?: string;

  @Default(true)
  @Column({ field: 'is_active', type: DataType.BOOLEAN })
  isActive!: boolean;
}