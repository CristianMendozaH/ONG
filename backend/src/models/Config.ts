import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'config', timestamps: true })
export class Config extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  key!: string;               // p.ej. "finePerDay", "reminderDays"

  @Column(DataType.TEXT)
  value!: string;             // se guarda JSON.stringify(valor)

  @Column(DataType.STRING)
  category?: string;          // opcional: "loans", "smtp", etc.
}

export default Config;
