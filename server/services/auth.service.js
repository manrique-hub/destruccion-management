import bcrypt from "bcryptjs";
import { query, queryOne } from "../db.js";
import { badRequest, pendingApproval, unauthorized } from "../utils/errors.js";
import { mapUser } from "./mapping.service.js";
import { getUsuariosSchema, isBitLike } from "./usersSchema.service.js";
import { sendTemplatedEmail } from "./email.service.js";

function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}

export async function login(email, password) {
  if (!email || !password) throw badRequest("Credenciales incompletas");

  const s = await getUsuariosSchema();
  const loginColumn = s.usuario || s.correoPersonal || s.correoCorporativo;
  if (!loginColumn) throw badRequest("No existe columna de usuario de ingreso en Usuarios");

  const row = await queryOne(
    `
    SELECT TOP 1
      ${s.idExpr} AS id,
      ${s.nombreExpr} AS nombre,
      ${s.usuarioExpr} AS usuario,
      ${s.correoPersonalExpr} AS correo_personal,
      ${s.correoCorporativoExpr} AS correo_corporativo,
      ${s.rolExpr} AS rol,
      ${s.estadoExpr} AS estado,
      ${s.activoExpr} AS activo,
      ${s.cargoExpr} AS cargo,
      ${s.passwordExpr} AS contrasena
    FROM Usuarios
    WHERE LOWER([${loginColumn}]) = LOWER(@email)
  `,
    { email: normalizeEmail(email) }
  );

  if (!row) throw unauthorized("Usuario o contrasena invalidos");

  const rawPwd = row.contrasena || "";
  const isHash = rawPwd.startsWith("$2a$") || rawPwd.startsWith("$2b$") || rawPwd.startsWith("$2y$");
  const isValid = isHash ? await bcrypt.compare(password, rawPwd) : password === rawPwd;

  if (!isValid) throw unauthorized("Usuario o contrasena invalidos");
  const user = mapUser(row);
  if (!user.activo) {
    throw pendingApproval(
      "Tu usuario aun esta pendiente de aprobacion. Si lo necesitas urgente, comunicate con el administrador de la aplicacion para habilitar tu ingreso."
    );
  }

  return user;
}

export async function register(input) {
  const { nombre, cargo, email, correoCoporativo, password, rol, areaAprobador } = input || {};
  if (!nombre || !email || !password || !rol) throw badRequest("Datos incompletos");
  if (rol === "Aprobador Área" && !String(areaAprobador || "").trim()) {
    throw badRequest("Debes seleccionar el area del aprobador");
  }

  const s = await getUsuariosSchema();

  const normalizedEmail = normalizeEmail(email);
  const existsWhere = [`LOWER([${s.usuario}]) = LOWER(@email)`];
  if (s.correoPersonal) existsWhere.push(`LOWER([${s.correoPersonal}]) = LOWER(@email)`);
  if (s.correoCorporativo) existsWhere.push(`LOWER([${s.correoCorporativo}]) = LOWER(@email)`);

  const exists = await queryOne(
    `SELECT TOP 1 ${s.idExpr} AS id FROM Usuarios WHERE ${existsWhere.join(" OR ")}`,
    { email: normalizedEmail }
  );
  if (exists) throw badRequest("Ya existe un usuario con ese correo");

  const hash = await bcrypt.hash(password, 10);

  const cols = [];
  const vals = [];
  const params = {};
  const add = (col, param, value) => {
    if (!col) return;
    cols.push(`[${col}]`);
    vals.push(`@${param}`);
    params[param] = value;
  };

  add(s.nombre, "nombre", String(nombre).trim());
  add(s.usuario, "usuario", normalizedEmail);
  add(s.password, "contrasena", hash);
  add(s.rol, "rol", rol);
  add(s.correoPersonal, "correoPersonal", normalizedEmail);
  add(s.correoCorporativo, "correoCorporativo", normalizeEmail(correoCoporativo) || normalizedEmail);
  add(s.cargo, "cargo", String(cargo || "").trim());
  add(s.areaAsignada, "areaAsignada", String(areaAprobador || "").trim() || null);

  if (s.estado) {
    const estadoType = s.typeByName?.[String(s.estado).toLowerCase()];
    add(s.estado, "estado", isBitLike(estadoType) ? 0 : "Pendiente");
  } else if (s.activo) {
    add(s.activo, "activo", 0);
  }

  if (!cols.length) throw badRequest("No se pudo mapear columnas para registro de usuario");

  const out = (col, alias) => (col ? `INSERTED.[${col}] AS ${alias}` : `NULL AS ${alias}`);

  const row = await queryOne(
    `
    INSERT INTO Usuarios (${cols.join(", ")})
    OUTPUT
      ${out(s.id || s.usuario, "id")},
      ${out(s.nombre, "nombre")},
      ${out(s.usuario, "usuario")},
      ${out(s.correoPersonal, "correo_personal")},
      ${out(s.correoCorporativo, "correo_corporativo")},
      ${out(s.rol, "rol")},
      ${out(s.estado, "estado")},
      ${out(s.activo, "activo")},
      ${out(s.cargo, "cargo")}
    VALUES (${vals.join(", ")})
  `,
    params
  );

  // Best-effort email: no bloquea registro si falla SMTP.
  try {
    const targetEmail =
      normalizeEmail(correoCoporativo) ||
      normalizeEmail(email) ||
      row?.correo_corporativo ||
      row?.correo_personal ||
      row?.usuario;

    await sendTemplatedEmail({
      to: targetEmail,
      title: "Registro recibido - pendiente de aprobacion",
      message:
        "Tu cuenta fue registrada correctamente y esta pendiente de aprobacion por un administrador. Recibiras una notificacion cuando quede activa.",
      ctaLabel: "Abrir sistema",
      ctaUrl: process.env.APP_BASE_URL || "http://localhost:5173",
    });
  } catch (_error) {
    // Ignorado: el flujo principal no depende de SMTP.
  }

  return mapUser(row);
}
