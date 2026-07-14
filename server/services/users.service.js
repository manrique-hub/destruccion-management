import bcrypt from "bcryptjs";
import { query, queryOne } from "../db.js";
import { mapUser } from "./mapping.service.js";
import { badRequest, notFound } from "../utils/errors.js";
import { getUsuariosSchema, isBitLike } from "./usersSchema.service.js";

export async function listUsers({ search, rol, estado, pageSize, offset, page }) {
  const s = await getUsuariosSchema();
  const where = ["1=1"];
  const params = { pageSize, offset };

  if (rol && s.rol) {
    where.push(`u.[${s.rol}] = @rol`);
    params.rol = rol;
  }
  if (estado && s.estado) {
    where.push(`u.[${s.estado}] = @estado`);
    params.estado = estado;
  }
  if (search) {
    const searchFields = [];
    if (s.nombre) searchFields.push(`u.[${s.nombre}] LIKE @search`);
    if (s.usuario) searchFields.push(`u.[${s.usuario}] LIKE @search`);
    if (s.correoCorporativo) searchFields.push(`u.[${s.correoCorporativo}] LIKE @search`);
    if (s.correoPersonal) searchFields.push(`u.[${s.correoPersonal}] LIKE @search`);
    if (searchFields.length) where.push(`(${searchFields.join(" OR ")})`);
    params.search = `%${search}%`;
  }

  const whereSql = where.join(" AND ");
  const totalRow = await queryOne(`SELECT COUNT(1) AS total FROM Usuarios u WHERE ${whereSql}`, params);

  const rows = await query(
    `
    SELECT
      ${s.idExpr.replace("NULL", `u.[${s.usuario}]`)} AS id,
      ${s.nombre ? `u.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `u.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `u.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `u.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `u.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `u.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `u.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `u.[${s.cargo}]` : "NULL"} AS cargo
    FROM Usuarios u
    WHERE ${whereSql}
    ORDER BY ${s.id ? `u.[${s.id}] DESC` : `u.[${s.usuario}] DESC`}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `,
    params
  );

  return { total: Number(totalRow?.total || 0), page, pageSize, items: rows.map(mapUser) };
}

export async function updateUserStatus(id, activo) {
  const s = await getUsuariosSchema();
  const idWhere = s.id ? `[${s.id}] = @id` : `[${s.usuario}] = @id`;
  const params = { id: s.id ? Number(id) : String(id) };

  if (!s.estado && !s.activo) throw badRequest("No hay columna de estado en Usuarios");

  let setSql = "";
  if (s.estado) {
    const estadoType = s.typeByName?.[String(s.estado).toLowerCase()];
    setSql = `[${s.estado}] = @estado`;
    params.estado = isBitLike(estadoType) ? (activo ? 1 : 0) : (activo ? "Activo" : "Inactivo");
  } else {
    setSql = `[${s.activo}] = @activo`;
    params.activo = activo ? 1 : 0;
  }

  const row = await queryOne(
    `
    UPDATE Usuarios
    SET ${setSql}
    OUTPUT
      ${s.id ? `INSERTED.[${s.id}]` : `INSERTED.[${s.usuario}]`} AS id,
      ${s.nombre ? `INSERTED.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `INSERTED.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `INSERTED.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `INSERTED.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `INSERTED.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `INSERTED.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `INSERTED.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `INSERTED.[${s.cargo}]` : "NULL"} AS cargo
    WHERE ${idWhere}
  `,
    params
  );

  if (!row) throw notFound("Usuario");
  return mapUser(row);
}

export async function updateUserRole(id, rol) {
  if (!rol) throw badRequest("Rol requerido");

  const s = await getUsuariosSchema();
  if (!s.rol) throw badRequest("No hay columna rol en Usuarios");

  const idWhere = s.id ? `[${s.id}] = @id` : `[${s.usuario}] = @id`;

  const row = await queryOne(
    `
    UPDATE Usuarios
    SET [${s.rol}] = @rol
    OUTPUT
      ${s.id ? `INSERTED.[${s.id}]` : `INSERTED.[${s.usuario}]`} AS id,
      ${s.nombre ? `INSERTED.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `INSERTED.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `INSERTED.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `INSERTED.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `INSERTED.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `INSERTED.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `INSERTED.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `INSERTED.[${s.cargo}]` : "NULL"} AS cargo
    WHERE ${idWhere}
  `,
    { id: s.id ? Number(id) : String(id), rol }
  );

  if (!row) throw notFound("Usuario");
  return mapUser(row);
}

export async function updateUser(id, payload) {
  const s = await getUsuariosSchema();
  const { nombre, email, correoCoporativo, rol, activo, cargo } = payload || {};

  const assigns = [];
  const params = { id: s.id ? Number(id) : String(id) };
  const add = (col, param, value) => {
    if (!col) return;
    assigns.push(`[${col}] = @${param}`);
    params[param] = value;
  };

  add(s.nombre, "nombre", String(nombre || "").trim());
  add(s.usuario, "usuario", String(email || "").trim().toLowerCase());
  add(s.correoPersonal, "correoPersonal", String(email || "").trim().toLowerCase());
  add(s.correoCorporativo, "correoCorporativo", String(correoCoporativo || email || "").trim().toLowerCase());
  add(s.rol, "rol", rol);
  add(s.cargo, "cargo", String(cargo || "").trim());

  if (s.estado) {
    const estadoType = s.typeByName?.[String(s.estado).toLowerCase()];
    add(s.estado, "estado", isBitLike(estadoType) ? (activo ? 1 : 0) : (activo ? "Activo" : "Inactivo"));
  }
  else if (s.activo) add(s.activo, "activo", activo ? 1 : 0);

  if (!assigns.length) throw badRequest("No hay columnas actualizables en Usuarios");

  const idWhere = s.id ? `[${s.id}] = @id` : `[${s.usuario}] = @id`;

  const row = await queryOne(
    `
    UPDATE Usuarios
    SET ${assigns.join(", ")}
    OUTPUT
      ${s.id ? `INSERTED.[${s.id}]` : `INSERTED.[${s.usuario}]`} AS id,
      ${s.nombre ? `INSERTED.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `INSERTED.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `INSERTED.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `INSERTED.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `INSERTED.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `INSERTED.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `INSERTED.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `INSERTED.[${s.cargo}]` : "NULL"} AS cargo
    WHERE ${idWhere}
  `,
    params
  );

  if (!row) throw notFound("Usuario");
  return mapUser(row);
}

export async function deleteUser(id) {
  const s = await getUsuariosSchema();
  const idWhere = s.id ? `[${s.id}] = @id` : `[${s.usuario}] = @id`;

  const row = await queryOne(
    `
    DELETE FROM Usuarios
    OUTPUT
      ${s.id ? `DELETED.[${s.id}]` : `DELETED.[${s.usuario}]`} AS id,
      ${s.nombre ? `DELETED.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `DELETED.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `DELETED.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `DELETED.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `DELETED.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `DELETED.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `DELETED.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `DELETED.[${s.cargo}]` : "NULL"} AS cargo
    WHERE ${idWhere}
  `,
    { id: s.id ? Number(id) : String(id) }
  );

  if (!row) throw notFound("Usuario");
  return mapUser(row);
}

export async function updateUserPassword(id, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw badRequest("La nueva contrasena debe tener minimo 6 caracteres");
  }

  const s = await getUsuariosSchema();
  if (!s.password) throw badRequest("No hay columna de contrasena en Usuarios");

  const hash = await bcrypt.hash(String(newPassword), 10);
  const idType = s.id ? s.typeByName?.[String(s.id).toLowerCase()] : null;
  const numericIdTypes = ["tinyint", "smallint", "int", "bigint", "decimal", "numeric", "float", "real"];
  const isNumericId = idType ? numericIdTypes.includes(String(idType).toLowerCase()) : false;
  const idValue = s.id ? (isNumericId ? Number(id) : String(id || "").trim()) : String(id || "").trim();

  if (isNumericId && Number.isNaN(idValue)) {
    throw badRequest("Identificador de usuario invalido");
  }

  const idWhere = s.id
    ? (isNumericId ? `[${s.id}] = @id` : `LOWER(LTRIM(RTRIM([${s.id}]))) = LOWER(@id)`)
    : `LOWER(LTRIM(RTRIM([${s.usuario}]))) = LOWER(@id)`;

  const row = await queryOne(
    `
    UPDATE Usuarios
    SET [${s.password}] = @hash
    OUTPUT
      ${s.id ? `INSERTED.[${s.id}]` : `INSERTED.[${s.usuario}]`} AS id,
      ${s.nombre ? `INSERTED.[${s.nombre}]` : "NULL"} AS nombre,
      ${s.usuario ? `INSERTED.[${s.usuario}]` : "NULL"} AS usuario,
      ${s.correoPersonal ? `INSERTED.[${s.correoPersonal}]` : "NULL"} AS correo_personal,
      ${s.correoCorporativo ? `INSERTED.[${s.correoCorporativo}]` : "NULL"} AS correo_corporativo,
      ${s.rol ? `INSERTED.[${s.rol}]` : "NULL"} AS rol,
      ${s.estado ? `INSERTED.[${s.estado}]` : "NULL"} AS estado,
      ${s.activo ? `INSERTED.[${s.activo}]` : "NULL"} AS activo,
      ${s.cargo ? `INSERTED.[${s.cargo}]` : "NULL"} AS cargo
    WHERE ${idWhere}
  `,
    { id: idValue, hash }
  );

  if (!row) throw notFound("Usuario");
  return mapUser(row);
}
