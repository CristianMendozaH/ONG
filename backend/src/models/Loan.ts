import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Equipment } from './Equipment';
import { User } from './User';

export type LoanStatus = 'prestado' | 'devuelto' | 'atrasado';

@Table({ tableName: 'loans', timestamps: true })
export class Loan extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Equipment)
  @Column(DataType.UUID)
  equipmentId!: string;

  @Column(DataType.STRING)
  borrowerName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Participante',
  })
  borrowerType!: 'Colaborador' | 'Participante';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  borrowerContact?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  responsiblePartyName?: string;

  @Column(DataType.DATEONLY)
  loanDate!: string;

  @Column(DataType.DATEONLY)
  dueDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  returnDate?: string;

  @Default('prestado')
  @Column(DataType.STRING)
  status!: LoanStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  overdueDays!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  totalFine!: number;

  @Column(DataType.TEXT)
  observations?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  conditionOnReturn?: 'excelente' | 'bueno' | 'regular' | 'dañado';

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  registeredById!: string;

  @BelongsTo(() => User, 'registeredById')
  registrar?: User;

  @BelongsTo(() => Equipment)
  equipment?: Equipment;
}