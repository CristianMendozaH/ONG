import { Request, Response } from 'express';
import { Config } from '../models/Config';

function parse(v: string) {
  try { return JSON.parse(v); } catch { return v; }
}

export async function getAll(_req: Request, res: Response) {
  const rows = await Config.findAll();
  const data: Record<string, any> = {};
  for (const r of rows) data[r.key] = parse(r.value);
  res.json(data);
}

export async function getKey(req: Request, res: Response) {
  const row = await Config.findByPk(req.params.key);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  res.json({ key: row.key, value: parse(row.value), category: row.category });
}

export async function setKey(req: Request, res: Response) {
  const { key } = req.params;
  const { value, category } = req.body;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  const [row] = await Config.upsert({ key, value: str, category });
  res.json({ key, value, category: row.category ?? category });
}
