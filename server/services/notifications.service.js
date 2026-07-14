import { query, queryOne } from "../db.js";
import { mapNotification } from "./mapping.service.js";
import { notFound } from "../utils/errors.js";
import { getActasKeySpec } from "./schemaInspector.service.js";

export async function listNotifications({ userId, unreadOnly, page, pageSize, offset }) {
  const keySpec = await getActasKeySpec();
  const actasIdColumn = keySpec.column;
  const where = ["n.usuario_id = @userId"];
  const params = { userId: Number(userId), pageSize, offset };

  if (unreadOnly) where.push("n.leida = 0");

  const whereSql = where.join(" AND ");
  const totalRow = await queryOne(`SELECT COUNT(1) AS total FROM Notificaciones n WHERE ${whereSql}`, params);

  const rows = await query(
    `
    SELECT n.id, n.usuario_id, n.acta_id, n.mensaje, n.tipo, n.leida, n.fecha, a.consecutivo AS acta_numero
    FROM Notificaciones n
    INNER JOIN Actas a ON a.${actasIdColumn} = n.acta_id
    WHERE ${whereSql}
    ORDER BY n.fecha DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `,
    params
  );

  return {
    total: Number(totalRow?.total || 0),
    page,
    pageSize,
    items: rows.map(mapNotification),
  };
}

export async function markNotificationRead(id) {
  const row = await queryOne(
    `
    UPDATE Notificaciones
    SET leida = 1
    OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.acta_id, INSERTED.mensaje, INSERTED.tipo, INSERTED.leida, INSERTED.fecha
    WHERE id = @id
  `,
    { id: Number(id) }
  );

  if (!row) throw notFound("Notificacion");
  return mapNotification(row);
}
