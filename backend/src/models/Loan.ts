import { Table, Column, Model, DataType, Default, PrimaryKey } from 'sequelize-typescript';

export type LoanStatus = 'prestado' | 'devuelto' | 'atrasado';

@Table({ tableName: 'loans', timestamps: true })
export class Loan extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  // LIMPIEZA: Se eliminó el decorador @ForeignKey de aquí
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

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: true,
  })
  accessories?: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  conditionOnReturn?: 'excelente' | 'bueno' | 'regular' | 'dañado';

  // LIMPIEZA: Se eliminó el decorador @ForeignKey de aquí
  @Column(DataType.UUID)
  registeredById!: string;

  // LIMPIEZA: Las relaciones @BelongsTo y las propiedades 'registrar' y 'equipment' fueron eliminadas.
}