import { query, queryOne, transaction } from "../db.js";
import { ACTIONS, ESTADOS, ROLES } from "../constants.js";
import { badRequest, notFound } from "../utils/errors.js";
import { mapActa, mapHistory, mapNotification } from "./mapping.service.js";
import { getActasColumnsMap, getActasKeySpec, normalizeActaIdInput } from "./schemaInspector.service.js";
import { getUsuariosSchema, isBitLike } from "./usersSchema.service.js";
import { sendTemplatedEmail } from "./email.service.js";

function actionToState(action) {
  return {
    [ACTIONS.AREA_TO_COSTOS]: ESTADOS.PENDIENTE_COSTOS,
    [ACTIONS.AREA_TO_HSE]: ESTADOS.PENDIENTE_HSE,
    [ACTIONS.AREA_REJECT]: ESTADOS.RECHAZADA_AREA,
    [ACTIONS.COSTOS_APPROVE]: ESTADOS.PENDIENTE_HSE,
    [ACTIONS.COSTOS_REJECT]: ESTADOS.RECHAZADA_COSTOS,
    [ACTIONS.HSE_APPROVE]: ESTADOS.FINALIZADA,
    [ACTIONS.HSE_REJECT]: ESTADOS.RECHAZADA_HSE,
  }[action];
}

function canApplyAction(acta, action, role) {
  if (!acta) return false;
  if (acta.estado === ESTADOS.FINALIZADA) return false;

  if (role === ROLES.AREA && acta.estado === ESTADOS.PENDIENTE_AREA) {
    return [ACTIONS.AREA_TO_COSTOS, ACTIONS.AREA_TO_HSE, ACTIONS.AREA_REJECT].includes(action);
  }
  if (role === ROLES.COSTOS && acta.estado === ESTADOS.PENDIENTE_COSTOS) {
    return [ACTIONS.COSTOS_APPROVE, ACTIONS.COSTOS_REJECT].includes(action);
  }
  if (role === ROLES.HSE && acta.estado === ESTADOS.PENDIENTE_HSE) {
    return [ACTIONS.HSE_APPROVE, ACTIONS.HSE_REJECT].includes(action);
  }
  if (role === ROLES.ADMIN) return true;
  return false;
}

function makeActionLabel(action) {
  return {
    [ACTIONS.AREA_TO_COSTOS]: "Aprobó y envió a Costos",
    [ACTIONS.AREA_TO_HSE]: "Aprobó y envió a HSE&S",
    [ACTIONS.AREA_REJECT]: "Rechazó (Área)",
    [ACTIONS.COSTOS_APPROVE]: "Aprobó (Costos)",
    [ACTIONS.COSTOS_REJECT]: "Rechazó (Costos)",
    [ACTIONS.HSE_APPROVE]: "Finalizó el acta (HSE&S)",
    [ACTIONS.HSE_REJECT]: "Rechazó (HSE&S)",
  }[action];
}

function keyArea(v) {
  return String(v || "").trim().toLowerCase();
}

function roleIds(directory, role) {
  return directory?.byRole?.[role] || [];
}

function areaApproverIds(directory, areaName) {
  const key = keyArea(areaName);
  const scoped = key ? directory?.areaApproversByArea?.[key] || [] : [];
  return scoped.length ? scoped : roleIds(directory, ROLES.AREA);
}

function getTargetsByAction(action, acta, directory) {
  const areaIds = areaApproverIds(directory, acta.area);
  if (action === ACTIONS.AREA_TO_COSTOS) return [acta.creado_por_id, ...roleIds(directory, ROLES.COSTOS)];
  if (action === ACTIONS.AREA_TO_HSE) return [acta.creado_por_id, ...roleIds(directory, ROLES.HSE)];
  if (action === ACTIONS.AREA_REJECT) return [acta.creado_por_id, ...roleIds(directory, ROLES.ADMIN)];
  if (action === ACTIONS.COSTOS_APPROVE) return [acta.creado_por_id, ...areaIds, ...roleIds(directory, ROLES.HSE)];
  if (action === ACTIONS.COSTOS_REJECT) return [acta.creado_por_id, ...areaIds, ...roleIds(directory, ROLES.ADMIN)];
  if (action === ACTIONS.HSE_APPROVE || action === ACTIONS.HSE_REJECT) {
    const costs = acta.paso_por_costos ? roleIds(directory, ROLES.COSTOS) : [];
    return [acta.creado_por_id, ...areaIds, ...roleIds(directory, ROLES.ADMIN), ...costs];
  }
  return [];
}

async function getUsersDirectory() {
  const s = await getUsuariosSchema();
  const idExpr = s.id ? `[${s.id}]` : `[${s.usuario}]`;
  const rolExpr = s.rol ? `[${s.rol}]` : "NULL";
  const areaExpr = s.areaAsignada ? `[${s.areaAsignada}]` : "NULL";

  let activeWhere = "1=1";
  if (s.estado) {
    const t = s.typeByName?.[String(s.estado).toLowerCase()];
    activeWhere = isBitLike(t)
      ? `[${s.estado}] IN (1)`
      : `LOWER(CAST([${s.estado}] AS NVARCHAR(100))) IN ('activo','aprobado','true','1')`;
  } else if (s.activo) {
    activeWhere = `[${s.activo}] IN (1)`;
  }

  const rows = await query(`SELECT ${idExpr} AS id, ${rolExpr} AS rol, ${areaExpr} AS area_asignada FROM Usuarios WHERE ${activeWhere}`);
  const byRole = rows.reduce((acc, row) => {
    if (!acc[row.rol]) acc[row.rol] = [];
    acc[row.rol].push(row.id);
    return acc;
  }, {});

  const areaApproversByArea = rows
    .filter((r) => r.rol === ROLES.AREA)
    .reduce((acc, row) => {
      const key = keyArea(row.area_asignada);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row.id);
      return acc;
    }, {});

  return { byRole, areaApproversByArea };
}

async function getEmailsByUserIds(userIds = []) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return [];

  const s = await getUsuariosSchema();
  const idExpr = s.id ? `[${s.id}]` : `[${s.usuario}]`;
  const mailExpr = s.correoCorporativo
    ? `[${s.correoCorporativo}]`
    : s.correoPersonal
      ? `[${s.correoPersonal}]`
      : `[${s.usuario}]`;

  const valuesSql = ids.map((v, i) => `(@id${i})`).join(",");
  const params = {};
  ids.forEach((v, i) => {
    params[`id${i}`] = v;
  });

  const rows = await query(
    `
    SELECT ${mailExpr} AS email
    FROM Usuarios
    WHERE ${idExpr} IN (${valuesSql})
  `,
    params
  );

  return [...new Set(rows.map((r) => String(r.email || "").trim()).filter(Boolean))];
}

export async function listActas({ search, estado, page, pageSize, offset }) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const where = ["1=1"];
  const params = { pageSize, offset };

  if (estado) {
    where.push("a.estado = @estado");
    params.estado = estado;
  }

  if (search) {
    where.push("(a.consecutivo LIKE @search OR a.solicitante LIKE @search OR a.area LIKE @search)");
    params.search = `%${search}%`;
  }

  const whereSql = where.join(" AND ");

  const totalRow = await queryOne(`SELECT COUNT(1) AS total FROM Actas a WHERE ${whereSql}`, params);
  const rows = await query(
    `
    SELECT a.${actasIdColumn} AS id, a.consecutivo, a.solicitante, a.correo_solicitante, a.area, a.cargo,
           a.fecha, a.estado, a.fecha_creacion, a.fecha_finalizacion, a.ceco,
           a.tipo_destruccion, a.observaciones, a.creado_por_id, a.paso_por_costos, a.datos_bloqueados
    FROM Actas a
    WHERE ${whereSql}
    ORDER BY a.fecha_creacion DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `,
    params
  );

  return {
    total: Number(totalRow?.total || 0),
    page,
    pageSize,
    items: rows.map(mapActa),
  };
}

export async function getActaById(id) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const normalizedId = normalizeActaIdInput(id, keySpec);
  const idText = String(normalizedId);
  const row = await queryOne(
    `
    SELECT ${actasIdColumn} AS id, consecutivo, solicitante, correo_solicitante, area, cargo, fecha, estado,
           fecha_creacion, fecha_finalizacion, ceco, tipo_destruccion, observaciones,
           creado_por_id, paso_por_costos, datos_bloqueados
    FROM Actas
    WHERE ${actasIdColumn} = @id
  `,
    { id: normalizedId }
  );
  if (!row) throw notFound("Acta");

  const historial = await query(
    `
    SELECT id, usuario, rol, accion, observaciones, fecha, estado_anterior, estado_nuevo
    FROM HistorialAprobaciones
    WHERE CAST(acta_id AS NVARCHAR(255)) = @idText
    ORDER BY fecha DESC
  `,
    { idText }
  );

  const notificaciones = await query(
    `
    SELECT n.id, n.usuario_id, n.acta_id, n.mensaje, n.tipo, n.leida, n.fecha, a.consecutivo AS acta_numero
    FROM Notificaciones n
    INNER JOIN Actas a ON CAST(a.${actasIdColumn} AS NVARCHAR(255)) = CAST(n.acta_id AS NVARCHAR(255))
    WHERE CAST(n.acta_id AS NVARCHAR(255)) = @idText
    ORDER BY n.fecha DESC
  `,
    { idText }
  );

  const acta = mapActa(row);
  acta.historial = historial.map(mapHistory);

  return { acta, notificaciones: notificaciones.map(mapNotification) };
}

export async function createActa(payload) {
  const keySpec = await getActasKeySpec();
  const actasCols = await getActasColumnsMap();
  const actasIdColumn = keySpec.column;
  const {
    solicitanteNombre,
    solicitanteCargo,
    solicitanteCorreo,
    areaGeneradora,
    ceco,
    tipoDestruccion,
    observaciones,
    creadoPorId,
  } = payload || {};

  if (!solicitanteNombre || !solicitanteCorreo || !areaGeneradora) {
    throw badRequest("Faltan campos requeridos para crear la acta");
  }

  const col = (name) => actasCols[String(name).toLowerCase()] || null;

  const colConsecutivo = col("consecutivo") || col("NumeroActa");
  const colNumeroActaLegacy = col("NumeroActa");
  const colSolicitante = col("solicitante") || col("Responsable");
  const colResponsableLegacy = col("Responsable");
  const colCorreoSolicitante = col("correo_solicitante") || col("applicant_email");
  const colArea = col("area") || col("AreaGeneradora");
  const colAreaLegacy = col("AreaGeneradora");
  const colCargo = col("cargo");
  const colFecha = col("fecha") || col("FechaRegistro");
  const colFechaRegistroLegacy = col("FechaRegistro");
  const colEstado = col("estado") || col("Estado") || col("status");
  const colEstadoLegacy = col("Estado");
  const colCeco = col("ceco") || col("CECO");
  const colTipoDestruccion = col("tipo_destruccion");
  const colObservaciones = col("observaciones") || col("Observaciones");
  const colCreadoPorId = col("creado_por_id") || col("current_approver");
  const colPasoPorCostos = col("paso_por_costos");
  const colDatosBloqueados = col("datos_bloqueados");

  if (!colConsecutivo || !colSolicitante || !colArea || !colFecha || !colEstado) {
    throw badRequest("La tabla Actas no tiene columnas mínimas compatibles para crear registros");
  }

  const row = await transaction(async (tx) => {
    const seqRow = await tx("SELECT NEXT VALUE FOR SeqActas AS seq");
    const seq = Number(seqRow[0].seq);
    const year = new Date().getFullYear();
    const numero = `ACT-${year}-${String(seq).padStart(6, "0")}`;

    const manualKeyNeeded = !keySpec.isIdentity && actasIdColumn.toLowerCase() !== "consecutivo";
    let manualId = null;
    if (manualKeyNeeded) {
      if (keySpec.isNumeric) {
        const nextIdRow = await tx(
          `SELECT ISNULL(MAX([${actasIdColumn}]), 0) + 1 AS nextId FROM Actas WITH (UPDLOCK, HOLDLOCK)`
        );
        manualId = Number(nextIdRow[0]?.nextId || 1);
      } else {
        // Para llaves de texto (ej. IdActa) reutilizamos el consecutivo como identificador estable.
        manualId = numero;
      }
    }

    const pairs = [];
    const seenCols = new Set();
    const addPair = (columnName, valueSql) => {
      if (!columnName) return;
      const k = String(columnName).toLowerCase();
      if (seenCols.has(k)) return;
      seenCols.add(k);
      pairs.push({ c: columnName, v: valueSql });
    };

    addPair(manualKeyNeeded ? actasIdColumn : null, "@manualId");
    addPair(colConsecutivo, "@consecutivo");
    addPair(colNumeroActaLegacy, "@consecutivo");
    addPair(colSolicitante, "@solicitante");
    addPair(colResponsableLegacy, "@solicitante");
    addPair(colCorreoSolicitante, "@correoSolicitante");
    addPair(colArea, "@area");
    addPair(colAreaLegacy, "@area");
    addPair(colCargo, "@cargo");
    addPair(colFecha, "CAST(GETDATE() AS DATE)");
    addPair(colFechaRegistroLegacy, "CAST(GETDATE() AS DATE)");
    addPair(colEstado, "@estado");
    addPair(colEstadoLegacy, "@estado");
    addPair(colCeco, "@ceco");
    addPair(colTipoDestruccion, "@tipoDestruccion");
    addPair(colObservaciones, "@observaciones");
    addPair(colCreadoPorId, "@creadoPorId");
    addPair(colPasoPorCostos, "0");
    addPair(colDatosBloqueados, "0");

    const insertColumns = pairs.map((p) => `[${p.c}]`);
    const insertValues = pairs.map((p) => p.v);

    const created = await tx(
      `
      INSERT INTO Actas (
        ${insertColumns.join(", ")}
      )
      OUTPUT INSERTED.${actasIdColumn} AS id, INSERTED.consecutivo, INSERTED.solicitante, INSERTED.correo_solicitante,
             INSERTED.area, INSERTED.cargo, INSERTED.fecha, INSERTED.estado, INSERTED.fecha_creacion,
             INSERTED.fecha_finalizacion, INSERTED.ceco, INSERTED.tipo_destruccion, INSERTED.observaciones,
             INSERTED.creado_por_id, INSERTED.paso_por_costos, INSERTED.datos_bloqueados
      VALUES (
        ${insertValues.join(", ")}
      )
    `,
      {
        manualId,
        consecutivo: numero,
        solicitante: solicitanteNombre,
        correoSolicitante: solicitanteCorreo,
        area: areaGeneradora,
        cargo: solicitanteCargo || "",
        estado: ESTADOS.BORRADOR,
        ceco: ceco || "",
        tipoDestruccion: tipoDestruccion || "",
        observaciones: observaciones || "",
        creadoPorId: Number(creadoPorId) || null,
      }
    );

    return created[0];
  });

  return mapActa(row);
}

export async function updateActa(id, payload) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const normalizedId = normalizeActaIdInput(id, keySpec);
  const existing = await queryOne(`SELECT ${actasIdColumn} AS id, estado, datos_bloqueados FROM Actas WHERE ${actasIdColumn} = @id`, { id: normalizedId });
  if (!existing) throw notFound("Acta");
  if (existing.estado !== ESTADOS.BORRADOR || existing.datos_bloqueados) {
    throw badRequest("Solo se puede editar una acta en borrador");
  }

  const row = await queryOne(
    `
    UPDATE Actas
       SET solicitante = @solicitante,
           correo_solicitante = @correoSolicitante,
           area = @area,
           cargo = @cargo,
           ceco = @ceco,
           tipo_destruccion = @tipoDestruccion,
           observaciones = @observaciones,
           fecha_actualizacion = SYSDATETIME()
        OUTPUT INSERTED.${actasIdColumn} AS id, INSERTED.consecutivo, INSERTED.solicitante, INSERTED.correo_solicitante,
           INSERTED.area, INSERTED.cargo, INSERTED.fecha, INSERTED.estado, INSERTED.fecha_creacion,
           INSERTED.fecha_finalizacion, INSERTED.ceco, INSERTED.tipo_destruccion, INSERTED.observaciones,
           INSERTED.creado_por_id, INSERTED.paso_por_costos, INSERTED.datos_bloqueados
        WHERE ${actasIdColumn} = @id
  `,
    {
      id: normalizedId,
      solicitante: payload.solicitanteNombre,
      correoSolicitante: payload.solicitanteCorreo,
      area: payload.areaGeneradora,
      cargo: payload.solicitanteCargo || "",
      ceco: payload.ceco || "",
      tipoDestruccion: payload.tipoDestruccion || "",
      observaciones: payload.observaciones || "",
    }
  );

  return mapActa(row);
}

export async function submitActa(id, user) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const normalizedId = normalizeActaIdInput(id, keySpec);
  const actaIdValue = keySpec.isNumeric ? Number(normalizedId) : String(normalizedId);
  const acta = await queryOne(`SELECT *, ${actasIdColumn} AS id FROM Actas WHERE ${actasIdColumn} = @id`, { id: normalizedId });
  if (!acta) throw notFound("Acta");
  if (acta.estado !== ESTADOS.BORRADOR) throw badRequest("La acta ya fue enviada");

  let approverIds = [];
  const usersDirectory = await getUsersDirectory();
  approverIds = areaApproverIds(usersDirectory, acta.area);

  await transaction(async (tx) => {
    await tx(
      `
      UPDATE Actas
      SET estado = @estado,
          datos_bloqueados = 1,
          fecha_actualizacion = SYSDATETIME()
      WHERE ${actasIdColumn} = @id
    `,
      { id: normalizedId, estado: ESTADOS.PENDIENTE_AREA }
    );

    await tx(
      `
      INSERT INTO HistorialAprobaciones (acta_id, usuario_id, usuario, rol, accion, observaciones, estado_anterior, estado_nuevo)
      VALUES (@actaId, @usuarioId, @usuario, @rol, @accion, @obs, @anterior, @nuevo)
    `,
      {
        actaId: actaIdValue,
        usuarioId: Number(user.id) || null,
        usuario: user.nombre,
        rol: user.rol,
        accion: "Envio a aprobacion de Area",
        obs: "",
        anterior: ESTADOS.BORRADOR,
        nuevo: ESTADOS.PENDIENTE_AREA,
      }
    );

    for (const approverId of approverIds) {
      await tx(
        `INSERT INTO Notificaciones (usuario_id, acta_id, mensaje, tipo, leida)
         VALUES (@usuarioId, @actaId, @mensaje, @tipo, 0)`,
        {
          usuarioId: Number(approverId),
          actaId: actaIdValue,
          mensaje: `Nueva acta pendiente de revision de Area: ${acta.consecutivo}`,
          tipo: "acta-pendiente",
        }
      );
    }
  });

  try {
    const emails = await getEmailsByUserIds(approverIds);
    await sendTemplatedEmail({
      to: emails,
      title: `Nueva acta pendiente de Area: ${acta.consecutivo}`,
      message: `Se ha enviado una acta para tu revision. Numero: ${acta.consecutivo}.`,
      ctaLabel: "Revisar acta",
      ctaUrl: process.env.APP_BASE_URL || "http://localhost:5173",
    });
  } catch (_error) {
    // No bloquear el flujo por fallo de correo.
  }

  return getActaById(id);
}

export async function decideActa(id, { action, comentario, user }) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const normalizedId = normalizeActaIdInput(id, keySpec);
  const actaIdValue = keySpec.isNumeric ? Number(normalizedId) : String(normalizedId);
  const acta = await queryOne(`SELECT *, ${actasIdColumn} AS id FROM Actas WHERE ${actasIdColumn} = @id`, { id: normalizedId });
  if (!acta) throw notFound("Acta");

  if (!canApplyAction(acta, action, user.rol)) {
    throw badRequest("No puedes ejecutar esta accion en el estado actual");
  }

  const newState = actionToState(action);
  if (!newState) throw badRequest("Accion invalida");

  const requiresComment = [ACTIONS.AREA_REJECT, ACTIONS.COSTOS_REJECT, ACTIONS.HSE_REJECT].includes(action);
  if (requiresComment && !String(comentario || "").trim()) {
    throw badRequest("Debes incluir observacion para rechazos");
  }

  const usersDirectory = await getUsersDirectory();
  const targets = [...new Set(getTargetsByAction(action, acta, usersDirectory).filter(Boolean))];

  await transaction(async (tx) => {
    await tx(
      `
      UPDATE Actas
      SET estado = @estado,
          fecha_actualizacion = SYSDATETIME(),
          fecha_finalizacion = CASE WHEN @estado IN (@final, @rejA, @rejC, @rejH) THEN SYSDATETIME() ELSE fecha_finalizacion END,
          paso_por_costos = CASE WHEN @action = @areaToCostos THEN 1 ELSE paso_por_costos END
      WHERE ${actasIdColumn} = @id
    `,
      {
        id: normalizedId,
        estado: newState,
        final: ESTADOS.FINALIZADA,
        rejA: ESTADOS.RECHAZADA_AREA,
        rejC: ESTADOS.RECHAZADA_COSTOS,
        rejH: ESTADOS.RECHAZADA_HSE,
        action,
        areaToCostos: ACTIONS.AREA_TO_COSTOS,
      }
    );

    await tx(
      `
      INSERT INTO HistorialAprobaciones (acta_id, usuario_id, usuario, rol, accion, observaciones, estado_anterior, estado_nuevo)
      VALUES (@actaId, @usuarioId, @usuario, @rol, @accion, @obs, @anterior, @nuevo)
    `,
      {
        actaId: actaIdValue,
        usuarioId: Number(user.id) || null,
        usuario: user.nombre,
        rol: user.rol,
        accion: makeActionLabel(action),
        obs: comentario || "",
        anterior: acta.estado,
        nuevo: newState,
      }
    );

    const msg = `${acta.consecutivo}: ${makeActionLabel(action)}`;
    const type = action.includes("rechazar") ? "acta-rechazada" : newState === ESTADOS.FINALIZADA ? "acta-finalizada" : "acta-actualizada";

    for (const target of targets) {
      await tx(
        `INSERT INTO Notificaciones (usuario_id, acta_id, mensaje, tipo, leida)
         VALUES (@usuarioId, @actaId, @mensaje, @tipo, 0)`,
        {
          usuarioId: Number(target),
          actaId: actaIdValue,
          mensaje: msg,
          tipo: type,
        }
      );
    }
  });

  try {
    const emails = await getEmailsByUserIds(targets);
    await sendTemplatedEmail({
      to: emails,
      title: `Actualizacion de acta: ${acta.consecutivo}`,
      message: `${makeActionLabel(action)}. Estado actual: ${newState}.${comentario ? ` Observacion: ${comentario}` : ""}`,
      ctaLabel: "Abrir sistema",
      ctaUrl: process.env.APP_BASE_URL || "http://localhost:5173",
    });
  } catch (_error) {
    // No bloquear el flujo por fallo SMTP.
  }

  return getActaById(id);
}

export async function listHistorialByActa(id) {
  const idText = String(id);
  const rows = await query(
    `
    SELECT id, usuario, rol, accion, observaciones, fecha, estado_anterior, estado_nuevo
    FROM HistorialAprobaciones
    WHERE CAST(acta_id AS NVARCHAR(255)) = @idText
    ORDER BY fecha DESC
  `,
    { idText }
  );
  return rows.map(mapHistory);
}

export async function getOverviewStats() {
  const rows = await query(`
    SELECT
      COUNT(1) AS total,
      SUM(CASE WHEN estado LIKE 'Pendiente%' THEN 1 ELSE 0 END) AS pendientes,
      SUM(CASE WHEN estado = 'Finalizada' THEN 1 ELSE 0 END) AS finalizadas,
      SUM(CASE WHEN estado LIKE 'Rechazada%' THEN 1 ELSE 0 END) AS rechazadas,
      SUM(CASE WHEN fecha_creacion >= DATEADD(MONTH, -1, SYSDATETIME()) THEN 1 ELSE 0 END) AS ultimos30dias
    FROM Actas
  `);

  return rows[0] || { total: 0, pendientes: 0, finalizadas: 0, rechazadas: 0, ultimos30dias: 0 };
}

export async function deleteActa(id) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const normalizedId = normalizeActaIdInput(id, keySpec);

  const existing = await queryOne(`SELECT ${actasIdColumn} AS id FROM Actas WHERE ${actasIdColumn} = @id`, { id: normalizedId });
  if (!existing) throw notFound("Acta");

  const escapeIdent = (value) => String(value || "").replace(/]/g, "]]"
  );

  const fkRefs = await query(
    `
    SELECT tp.name AS parent_table, cp.name AS parent_col
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON tp.object_id = fkc.parent_object_id
    JOIN sys.columns cp ON cp.object_id = fkc.parent_object_id AND cp.column_id = fkc.parent_column_id
    JOIN sys.tables tr ON tr.object_id = fkc.referenced_object_id
    JOIN sys.columns cr ON cr.object_id = fkc.referenced_object_id AND cr.column_id = fkc.referenced_column_id
    WHERE tr.name = 'Actas' AND cr.name = @actaPk
  `,
    { actaPk: actasIdColumn }
  );

  for (const ref of fkRefs) {
    const tableName = escapeIdent(ref.parent_table);
    const colName = escapeIdent(ref.parent_col);
    await query(`DELETE FROM [${tableName}] WHERE [${colName}] = @id`, { id: normalizedId });
  }

  // Compatibilidad con el esquema moderno (sin FK declaradas).
  await query(`IF OBJECT_ID('Notificaciones', 'U') IS NOT NULL DELETE FROM Notificaciones WHERE CAST(acta_id AS NVARCHAR(255)) = @idText`, {
    idText: String(normalizedId),
  });
  await query(`IF OBJECT_ID('HistorialAprobaciones', 'U') IS NOT NULL DELETE FROM HistorialAprobaciones WHERE CAST(acta_id AS NVARCHAR(255)) = @idText`, {
    idText: String(normalizedId),
  });
  await query(`DELETE FROM Actas WHERE ${actasIdColumn} = @id`, { id: normalizedId });

  return { ok: true };
}
