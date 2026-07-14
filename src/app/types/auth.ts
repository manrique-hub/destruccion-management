export type Rol = "Administrador" | "Solicitante" | "Aprobador Área" | "Costos" | "HSE & S";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  correoCoporativo: string;
  rol: Rol;
  activo: boolean;
  cargo?: string;
}

export interface RegisterInput {
  nombre: string;
  email: string;
  correoCoporativo: string;
  password: string;
  rol: Rol;
  areaAprobador?: string;
}

export const APPROVER_ROLES: Rol[] = ["Aprobador Área", "Costos", "HSE & S"];
