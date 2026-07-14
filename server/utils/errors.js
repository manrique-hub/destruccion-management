export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(entity = "Recurso") {
  return new ApiError(404, `${entity} no encontrado`);
}

export function badRequest(message) {
  return new ApiError(400, message);
}

export function unauthorized(message = "No autorizado") {
  return new ApiError(401, message);
}

export function forbidden(message = "Prohibido", code = "FORBIDDEN") {
  return new ApiError(403, message, code);
}

export function pendingApproval(message = "Cuenta pendiente de aprobacion") {
  return new ApiError(403, message, "ACCOUNT_PENDING_APPROVAL");
}

export function conflict(message = "Conflicto") {
  return new ApiError(409, message);
}
