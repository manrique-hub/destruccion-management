import { query } from "../db.js";

let actasKeySpecCache = null;
let actasColumnsMapCache = null;

function isNumericSqlType(typeName) {
  return ["tinyint", "smallint", "int", "bigint", "decimal", "numeric", "float", "real"].includes(String(typeName || "").toLowerCase());
}

async function getColumnType(columnName) {
  const row = await query(`
    SELECT TOP 1 ty.name AS type_name
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE t.name = 'Actas' AND c.name = @columnName
  `, { columnName });

  return row[0]?.type_name || "nvarchar";
}

async function getIdentityInfo(columnName) {
  const row = await query(
    `
    SELECT TOP 1 c.is_identity
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = 'Actas' AND c.name = @columnName
  `,
    { columnName }
  );

  return Boolean(row[0]?.is_identity);
}

export async function getActasKeySpec() {
  if (actasKeySpecCache) return actasKeySpecCache;

  const rows = await query(`
    SELECT c.name
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = 'Actas'
      AND c.name IN ('id', 'acta_id')
    ORDER BY CASE WHEN c.name = 'id' THEN 0 ELSE 1 END
  `);

  if (rows.length > 0) {
    const column = rows[0].name;
    const typeName = await getColumnType(column);
    const isIdentity = await getIdentityInfo(column);
    actasKeySpecCache = { column, isNumeric: isNumericSqlType(typeName), isIdentity };
    return actasKeySpecCache;
  }

  const pkRows = await query(`
    SELECT TOP 1 c.name
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    INNER JOIN sys.tables t ON t.object_id = i.object_id
    WHERE t.name = 'Actas' AND i.is_primary_key = 1
    ORDER BY ic.key_ordinal
  `);

  if (pkRows.length > 0) {
    const column = pkRows[0].name;
    const typeName = await getColumnType(column);
    const isIdentity = await getIdentityInfo(column);
    actasKeySpecCache = { column, isNumeric: isNumericSqlType(typeName), isIdentity };
    return actasKeySpecCache;
  }

  const consecutivoRows = await query(`
    SELECT c.name
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = 'Actas' AND c.name = 'consecutivo'
  `);

  if (consecutivoRows.length > 0) {
    actasKeySpecCache = { column: "consecutivo", isNumeric: false, isIdentity: false };
    return actasKeySpecCache;
  }

  throw new Error("No se encontro una llave compatible en Actas");
}

export async function getActasColumnsMap() {
  if (actasColumnsMapCache) return actasColumnsMapCache;

  const rows = await query(`
    SELECT c.name
    FROM sys.columns c
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = 'Actas'
  `);

  const map = rows.reduce((acc, r) => {
    const raw = String(r.name);
    acc[raw.toLowerCase()] = raw;
    return acc;
  }, {});

  actasColumnsMapCache = map;
  return map;
}

export function clearActasSchemaCache() {
  actasKeySpecCache = null;
  actasColumnsMapCache = null;
}

export function normalizeActaIdInput(id, keySpec) {
  if (keySpec.isNumeric) return Number(id);
  return String(id);
}
