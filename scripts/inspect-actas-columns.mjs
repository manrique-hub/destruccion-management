import "dotenv/config";
import { query } from "../server/db.js";

const rows = await query(`
  SELECT c.name, ty.name AS type_name, c.max_length, c.is_nullable, c.is_identity
  FROM sys.columns c
  INNER JOIN sys.tables t ON t.object_id = c.object_id
  INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
  WHERE t.name = 'Actas'
  ORDER BY c.column_id
`);

console.log(JSON.stringify(rows, null, 2));
