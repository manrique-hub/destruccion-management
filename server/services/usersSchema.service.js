import { query } from "../db.js";

let cachedSchema = null;

function has(cols, name) {
  return cols.includes(name.toLowerCase());
}

function fold(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function first(cols, candidates) {
  for (const c of candidates) {
    if (has(cols, c)) return c;
  }
  return null;
}

function firstByFragments(cols, fragments) {
  const foldedCols = cols.map((c) => ({ raw: c, folded: fold(c) }));
  for (const col of foldedCols) {
    if (fragments.every((f) => col.folded.includes(f))) {
      return col.raw;
    }
  }
  return null;
}

function colExpr(col) {
  return col ? `[${col}]` : "NULL";
}

export async function getUsuariosSchema() {
  if (cachedSchema) return cachedSchema;

  const rows = await query(`
    SELECT c.name, ty.name AS type_name
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE t.name = 'Usuarios'
  `);

  const cols = rows.map((r) => String(r.name).toLowerCase());
  const typeByName = rows.reduce((acc, r) => {
    acc[String(r.name).toLowerCase()] = String(r.type_name || "").toLowerCase();
    return acc;
  }, {});

  const schema = {
    id: first(cols, ["id", "usuario_id", "user_id"]),
    nombre: first(cols, ["nombre", "nombre_completo", "full_name"]),
    usuario: first(cols, ["usuario", "username", "user_login", "email"]),
    correoPersonal: first(cols, ["correo_personal", "email", "correo"]),
    correoCorporativo: first(cols, ["correo_corporativo", "correo_coporativo", "correo_empresa", "correo_corp"]),
    rol: first(cols, ["rol", "role"]),
    estado: first(cols, ["estado", "status"]),
    activo: first(cols, ["activo", "is_active"]),
    cargo: first(cols, ["cargo", "puesto", "position"]),
    areaAsignada: first(cols, ["area_asignada", "area", "area_responsable", "departamento"]),
    password: first(cols, ["contraseña", "contrasena", "password", "clave"]),
  };

  if (!schema.usuario) {
    schema.usuario =
      firstByFragments(cols, ["usuario"]) ||
      firstByFragments(cols, ["user"]) ||
      firstByFragments(cols, ["login"]) ||
      firstByFragments(cols, ["correo"]) ||
      firstByFragments(cols, ["mail"]);
  }

  if (!schema.password) {
    schema.password =
      firstByFragments(cols, ["contra"]) ||
      firstByFragments(cols, ["pass"]) ||
      firstByFragments(cols, ["clave"]);
  }

  if (!schema.correoPersonal) {
    schema.correoPersonal = firstByFragments(cols, ["correo"]) || firstByFragments(cols, ["mail"]);
  }

  if (!schema.correoCorporativo) {
    schema.correoCorporativo =
      firstByFragments(cols, ["corpor"]) ||
      firstByFragments(cols, ["empresa"]) ||
      null;
  }

  if (!schema.nombre) {
    schema.nombre = firstByFragments(cols, ["nombre"]) || firstByFragments(cols, ["name"]);
  }

  if (!schema.rol) {
    schema.rol = firstByFragments(cols, ["rol"]) || firstByFragments(cols, ["role"]);
  }

  if (!schema.estado) {
    schema.estado = firstByFragments(cols, ["estado"]) || firstByFragments(cols, ["status"]);
  }

  if (!schema.activo) {
    schema.activo = firstByFragments(cols, ["activo"]) || firstByFragments(cols, ["active"]);
  }

  if (!schema.cargo) {
    schema.cargo = firstByFragments(cols, ["cargo"]) || firstByFragments(cols, ["puesto"]) || firstByFragments(cols, ["position"]);
  }

  if (!schema.areaAsignada) {
    schema.areaAsignada =
      firstByFragments(cols, ["area", "asign"]) ||
      firstByFragments(cols, ["area", "respons"]) ||
      firstByFragments(cols, ["depart"]) ||
      firstByFragments(cols, ["area"]);
  }

  if (!schema.usuario || !schema.password) {
    throw new Error("La tabla Usuarios no tiene columnas minimas para login (usuario/password)");
  }

  cachedSchema = {
    ...schema,
    typeByName,
    idExpr: schema.id ? colExpr(schema.id) : colExpr(schema.usuario),
    nombreExpr: colExpr(schema.nombre),
    usuarioExpr: colExpr(schema.usuario),
    correoPersonalExpr: colExpr(schema.correoPersonal),
    correoCorporativoExpr: colExpr(schema.correoCorporativo),
    rolExpr: colExpr(schema.rol),
    estadoExpr: colExpr(schema.estado),
    activoExpr: colExpr(schema.activo),
    cargoExpr: colExpr(schema.cargo),
    areaAsignadaExpr: colExpr(schema.areaAsignada),
    passwordExpr: colExpr(schema.password),
  };

  return cachedSchema;
}

export function isBitLike(typeName) {
  return ["bit", "tinyint", "smallint", "int"].includes(String(typeName || "").toLowerCase());
}

export function clearUsuariosSchemaCache() {
  cachedSchema = null;
}
