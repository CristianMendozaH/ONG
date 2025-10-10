import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'config', timestamps: true })
export class Config extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  key!: string;

  @Column(DataType.TEXT)
  value!: string;

  @Column(DataType.STRING)
  category?: string;
}

export default Config;