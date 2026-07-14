import { query } from "../server/db.js";

const sql = `
SELECT
  fk.name AS fk_name,
  tp.name AS parent_table,
  cp.name AS parent_col,
  tr.name AS ref_table,
  cr.name AS ref_col
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables tp ON tp.object_id = fkc.parent_object_id
JOIN sys.columns cp ON cp.object_id = fkc.parent_object_id AND cp.column_id = fkc.parent_column_id
JOIN sys.tables tr ON tr.object_id = fkc.referenced_object_id
JOIN sys.columns cr ON cr.object_id = fkc.referenced_object_id AND cr.column_id = fkc.referenced_column_id
WHERE tr.name = 'Actas'
ORDER BY tp.name;
`;

const rows = await query(sql);
console.log(JSON.stringify(rows, null, 2));
