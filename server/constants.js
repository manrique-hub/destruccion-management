export const ESTADOS = {
  BORRADOR: "Borrador",
  PENDIENTE_AREA: "Pendiente Área",
  PENDIENTE_COSTOS: "Pendiente Costos",
  PENDIENTE_HSE: "Pendiente HSE&S",
  RECHAZADA_AREA: "Rechazada por Área",
  RECHAZADA_COSTOS: "Rechazada por Costos",
  RECHAZADA_HSE: "Rechazada por HSE&S",
  FINALIZADA: "Finalizada",
};

export const ROLES = {
  ADMIN: "Administrador",
  SOLICITANTE: "Solicitante",
  AREA: "Aprobador Área",
  COSTOS: "Costos",
  HSE: "HSE & S",
};

export const ACTIONS = {
  AREA_TO_COSTOS: "area-costos",
  AREA_TO_HSE: "area-hse",
  AREA_REJECT: "area-rechazar",
  COSTOS_APPROVE: "costos-aprobar",
  COSTOS_REJECT: "costos-rechazar",
  HSE_APPROVE: "hse-finalizar",
  HSE_REJECT: "hse-rechazar",
};

export const MAX_PAGE_SIZE = 200;
export const DEFAULT_PAGE_SIZE = 25;
