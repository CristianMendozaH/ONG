// src/app/shared/interfaces/models.ts

// Usuario
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tech' | 'user';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Equipo
export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  status: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Préstamo
export interface Loan {
  id: string;
  equipmentId: string;
  equipment?: Equipment; // Populated en el frontend
  borrowerName: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  overdueDays?: number;
  totalFine?: number;
  status: 'prestado' | 'devuelto';
  createdAt: string;
  updatedAt: string;
}

// Mantenimiento
export interface Maintenance {
  id: string;
  equipmentId: string;
  equipment?: Equipment; // Populated en el frontend
  scheduledDate: string;
  type: 'preventivo' | 'correctivo' | 'predictivo' | 'emergencia';
  priority: 'alta' | 'media' | 'baja';
  status: 'programado' | 'en-proceso' | 'completado' | 'cancelado';
  technician?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// KPIs para el Dashboard
export interface KPIs {
  totalEquipos: number;
  prestados: number;
  disponibles: number;
  atrasos: number;
  enMantenimiento: number;
}

// Actividad reciente
export interface Activity {
  loans: Loan[];
  maintenances: Maintenance[];
}

// Configuración
export interface Config {
  key: string;
  value: string;
}

// DTOs para formularios
export interface CreateEquipmentDto {
  code: string;
  name: string;
  type: string;
  status: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';
  description?: string;
}

export interface CreateLoanDto {
  equipmentId: string;
  borrowerName: string;
  dueDate: string;
}

export interface ReturnLoanDto {
  returnDate?: string;
}

export interface CreateMaintenanceDto {
  equipmentId: string;
  scheduledDate: string;
  type: 'preventivo' | 'correctivo' | 'predictivo' | 'emergencia';
  priority: 'alta' | 'media' | 'baja';
  description?: string;
  technician?: string;
}

export interface UpdateMaintenanceDto {
  scheduledDate?: string;
  type?: 'preventivo' | 'correctivo' | 'predictivo' | 'emergencia';
  priority?: 'alta' | 'media' | 'baja';
  status?: 'programado' | 'en-proceso' | 'completado' | 'cancelado';
  technician?: string;
  description?: string;
}

// Auth
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response genérica
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Error response
export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}
