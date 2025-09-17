import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey } from 'sequelize-typescript';
import { Equipment } from './Equipment';

export type LoanStatus = 'activo' | 'devuelto' | 'atrasado' | 'multa';

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

  @Column(DataType.DATEONLY)
  loanDate!: string;       // YYYY-MM-DD

  @Column(DataType.DATEONLY)
  dueDate!: string;

  @Column(DataType.DATEONLY)
  returnDate?: string;

  @Default('activo')
  @Column(DataType.STRING)
  status!: LoanStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  overdueDays!: number;

  @Default(0)
  @Column(DataType.DECIMAL(10,2))
  totalFine!: number;

  @Column(DataType.TEXT)
  observations?: string;
}
