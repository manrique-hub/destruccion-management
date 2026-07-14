import type { AuthUser, RegisterInput } from "@/app/types/auth";

type JsonRecord = Record<string, any>;

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000/api";

export class ApiRequestError extends Error {
  status: number;
  code?: string | null;
  detail?: string;

  constructor(message: string, status: number, code?: string | null, detail?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

function extractErrorMessage(raw: string, status: number) {
  if (!raw) return `Error ${status}`;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed?.error) return parsed.error;
    if (parsed?.message) return parsed.message;
  } catch {
    // Ignore JSON parsing errors and use raw text.
  }

  return raw;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    let code: string | null = null;
    let detail: string | undefined;

    try {
      const parsed = JSON.parse(text);
      code = parsed?.code || null;
      detail = parsed?.detail;
    } catch {
      // Ignore parse issues for non-JSON errors.
    }

    throw new ApiRequestError(extractErrorMessage(text, res.status), res.status, code, detail);
  }

  return res.json() as Promise<T>;
}

export interface BootstrapResponse {
  users: AuthUser[];
  actas: JsonRecord[];
  notificaciones: JsonRecord[];
}

export interface PagedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const api = {
  getBootstrap: () => request<BootstrapResponse>("/bootstrap"),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (input: RegisterInput) =>
    request<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listActas: (params?: { page?: number; pageSize?: number; estado?: string; search?: string }) => {
    const usp = new URLSearchParams();
    if (params?.page) usp.set("page", String(params.page));
    if (params?.pageSize) usp.set("pageSize", String(params.pageSize));
    if (params?.estado) usp.set("estado", params.estado);
    if (params?.search) usp.set("search", params.search);
    const qs = usp.toString();
    return request<PagedResponse<JsonRecord>>(`/actas${qs ? `?${qs}` : ""}`);
  },
  getActa: (id: string) => request<{ acta: JsonRecord; notificaciones: JsonRecord[] }>(`/actas/${id}`),
  createActa: (payload: JsonRecord) =>
    request<{ acta: JsonRecord }>("/actas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateActa: (id: string, payload: JsonRecord) =>
    request<{ acta: JsonRecord }>(`/actas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteActa: (id: string) =>
    request<{ ok: boolean }>(`/actas/${id}`, {
      method: "DELETE",
    }),
  submitActa: (id: string, user: JsonRecord) =>
    request<JsonRecord>(`/actas/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ user }),
    }),
  decideActa: (id: string, payload: { action: string; comentario?: string; user: JsonRecord }) =>
    request<JsonRecord>(`/actas/${id}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listUsers: (params?: { page?: number; pageSize?: number; search?: string; rol?: string; estado?: string }) => {
    const usp = new URLSearchParams();
    if (params?.page) usp.set("page", String(params.page));
    if (params?.pageSize) usp.set("pageSize", String(params.pageSize));
    if (params?.search) usp.set("search", params.search);
    if (params?.rol) usp.set("rol", params.rol);
    if (params?.estado) usp.set("estado", params.estado);
    const qs = usp.toString();
    return request<PagedResponse<AuthUser>>(`/users${qs ? `?${qs}` : ""}`);
  },
  updateUser: (id: string, payload: AuthUser) =>
    request<{ user: AuthUser }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<{ ok: boolean; user: AuthUser }>(`/users/${id}`, {
      method: "DELETE",
    }),
  changeUserPassword: (id: string, password: string) =>
    request<{ ok: boolean; user: AuthUser }>(`/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),
  listNotifications: (params: { userId: string; page?: number; pageSize?: number; unreadOnly?: boolean }) => {
    const usp = new URLSearchParams();
    usp.set("userId", params.userId);
    if (params.page) usp.set("page", String(params.page));
    if (params.pageSize) usp.set("pageSize", String(params.pageSize));
    if (typeof params.unreadOnly === "boolean") usp.set("unreadOnly", String(params.unreadOnly));
    return request<PagedResponse<JsonRecord>>(`/notificaciones?${usp.toString()}`);
  },
  markNotificationRead: (id: string) =>
    request<{ notification: JsonRecord }>(`/notificaciones/${id}/read`, {
      method: "PATCH",
    }),
};
