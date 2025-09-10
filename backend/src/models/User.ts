import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

type Role = 'admin' | 'tech' | 'user';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column({ type: DataType.STRING, unique: true })
  email!: string;

  @Column(DataType.STRING)
  passwordHash!: string;

  @Default('user')
  @Column(DataType.STRING) // 'admin' | 'tech' | 'user'
  role!: Role;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  // Ocultar passwordHash en respuestas JSON
  toJSON() {
    const values = { ...this.get() } as any;
    delete values.passwordHash;
    return values;
  }
}
