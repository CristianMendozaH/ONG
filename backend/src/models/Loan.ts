import { Table, Column, Model, DataType, Default, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Equipment } from './Equipment';

// ++ CAMBIO: Alineamos los estados con los usados en el frontend para consistencia.
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

  // ++ CAMBIO: El nombre del usuario final (quien usa el equipo)
  @Column(DataType.STRING)
  borrowerName!: string;

  // =======================================================================
  // ++ NUEVOS CAMPOS AÑADIDOS ++
  // =======================================================================

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Participante', // Valor por defecto
  })
  borrowerType!: 'Colaborador' | 'Participante';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  borrowerContact?: string; // Email o teléfono del solicitante

  // Campos para el responsable (el docente en tu ejemplo)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  responsiblePartyName?: string; // Nombre del responsable si es diferente al borrower

  // =======================================================================

  @Column(DataType.DATEONLY)
  loanDate!: string;

  @Column(DataType.DATEONLY)
  dueDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  returnDate?: string;

  // ++ CAMBIO: El estado por defecto ahora es 'prestado'
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

  // ++ NUEVO: Campo para la condición del equipo al ser devuelto
  @Column({ type: DataType.STRING, allowNull: true })
  conditionOnReturn?: 'excelente' | 'bueno' | 'regular' | 'dañado';

  // Relación para incluir el equipo en las consultas
  @BelongsTo(() => Equipment)
  equipment?: Equipment;
}