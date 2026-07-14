import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, makePageMeta } from "../utils/pagination.js";
import { query, queryOne } from "../db.js";
import { mapActa, mapNotification, mapUser } from "../services/mapping.service.js";
import { getActasKeySpec } from "../services/schemaInspector.service.js";

export const bootstrapRouter = Router();

bootstrapRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const keySpec = await getActasKeySpec();
    const actasIdColumn = keySpec.column;
    const { page, pageSize, offset } = getPagination(req.query);

    const users = await query(
      `
      SELECT id, nombre, usuario, correo_personal, correo_corporativo, rol, estado, cargo
      FROM Usuarios
      ORDER BY id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `,
      { offset, pageSize }
    );

    const usersTotal = await queryOne("SELECT COUNT(1) AS total FROM Usuarios");

    const actas = await query(
      `
            SELECT ${actasIdColumn} AS id, consecutivo, solicitante, correo_solicitante, area, cargo, fecha, estado,
             fecha_creacion, fecha_finalizacion, ceco, tipo_destruccion, observaciones,
             creado_por_id, paso_por_costos, datos_bloqueados
      FROM Actas
      ORDER BY id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `,
      { offset, pageSize }
    );

    const actasTotal = await queryOne("SELECT COUNT(1) AS total FROM Actas");

    const notificaciones = await query(
      `
      SELECT n.id, n.usuario_id, n.acta_id, n.mensaje, n.tipo, n.leida, n.fecha, a.consecutivo AS acta_numero
      FROM Notificaciones n
      INNER JOIN Actas a ON a.${actasIdColumn} = n.acta_id
      ORDER BY n.id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `,
      { offset, pageSize }
    );

    const notifTotal = await queryOne("SELECT COUNT(1) AS total FROM Notificaciones");

    res.json({
      users: users.map(mapUser),
      usersMeta: makePageMeta(Number(usersTotal?.total || 0), page, pageSize),
      actas: actas.map(mapActa),
      actasMeta: makePageMeta(Number(actasTotal?.total || 0), page, pageSize),
      notificaciones: notificaciones.map(mapNotification),
      notificacionesMeta: makePageMeta(Number(notifTotal?.total || 0), page, pageSize),
    });
  })
);
