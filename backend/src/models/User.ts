import { Table, Column, Model, DataType, Default, PrimaryKey, HasMany } from 'sequelize-typescript';
import { Equipment } from './Equipment'; // ++ AÑADIDO: Importa el modelo Equipment

type Role = 'admin' | 'tecnico' | 'user';

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
  @Column(DataType.STRING)
  role!: Role;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  // =======================================================================
  // ++ AÑADIDO: Define la relación "uno a muchos" con Equipment ++
  // Un usuario puede tener muchos equipos registrados.
  // =======================================================================
  @HasMany(() => Equipment)
  equipments!: Equipment[];

  // Ocultar passwordHash en respuestas JSON
  toJSON() {
    const values = { ...this.get() } as any;
    delete values.passwordHash;
    return values;
  }
}