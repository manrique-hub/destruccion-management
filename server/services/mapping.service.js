export function mapUser(row) {
  const parseActive = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const s = String(value).trim().toLowerCase();
    if (["1", "true", "activo", "activa", "aprobado"].includes(s)) return true;
    if (["0", "false", "inactivo", "pendiente", "bloqueado", "denegado"].includes(s)) return false;
    return null;
  };

  const activeFromEstado = parseActive(row.estado);
  const activeFromFlag = parseActive(row.activo);

  let activo = false;
  if (activeFromEstado !== null && activeFromFlag !== null) {
    // Si existen ambas señales, deben estar activas ambas para permitir ingreso.
    activo = activeFromEstado && activeFromFlag;
  } else if (activeFromEstado !== null) {
    activo = activeFromEstado;
  } else if (activeFromFlag !== null) {
    activo = activeFromFlag;
  }

  return {
    id: String(row.id || "").trim(),
    nombre: String(row.nombre || "").trim(),
    email: String(row.usuario || row.correo_personal || row.correo_corporativo || "").trim(),
    correoCoporativo: String(row.correo_corporativo || row.correo_personal || "").trim(),
    rol: String(row.rol || "").trim(),
    activo,
    cargo: String(row.cargo || "").trim(),
  };
}

export function mapActa(row) {
  return {
    id: String(row.id),
    numeroActa: row.consecutivo,
    fechaSolicitud: row.fecha,
    solicitanteNombre: row.solicitante,
    solicitanteCargo: row.cargo,
    solicitanteCorreo: row.correo_solicitante,
    datosGeneralesBloqueados: Boolean(row.datos_bloqueados),
    areaGeneradora: row.area,
    ceco: row.ceco || "",
    tipoDestruccion: row.tipo_destruccion || "",
    observaciones: row.observaciones || "",
    estado: row.estado,
    productos: [],
    historial: [],
    fechaCreacion: row.fecha_creacion,
    creadoPorId: row.creado_por_id ? String(row.creado_por_id) : "",
    creadoPorNombre: row.solicitante,
    pasoPorCostos: Boolean(row.paso_por_costos),
  };
}

export function mapNotification(row) {
  return {
    id: String(row.id),
    paraUserId: String(row.usuario_id),
    tipo: row.tipo,
    actaId: String(row.acta_id),
    actaNumero: row.acta_numero || "",
    mensaje: row.mensaje,
    fecha: row.fecha,
    leida: Boolean(row.leida),
  };
}

export function mapHistory(row) {
  return {
    id: String(row.id),
    usuario: row.usuario || "Sistema",
    rol: row.rol,
    accion: row.accion,
    observaciones: row.observaciones || "",
    fecha: row.fecha,
    estadoAnterior: row.estado_anterior,
    estadoNuevo: row.estado_nuevo,
  };
}
