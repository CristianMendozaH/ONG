import { Table, Column, Model, DataType, Default, PrimaryKey, HasMany } from 'sequelize-typescript';
import { Equipment } from './Equipment';
import { Loan } from './Loan';

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

  // Relación "uno a muchos" con Equipment
  @HasMany(() => Equipment, { foreignKey: 'createdBy' }) // Es buena práctica ser explícito aquí también
  equipments!: Equipment[];

  // ++ MODIFICADO: Se especifica la llave foránea para la relación con Loan ++
  @HasMany(() => Loan, { foreignKey: 'registeredById' })
  loans!: Loan[];

  // Ocultar passwordHash en respuestas JSON
  toJSON() {
    const values = { ...this.get() } as any;
    delete values.passwordHash;
    return values;
  }
}