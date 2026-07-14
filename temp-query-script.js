import dotenv from "dotenv";
dotenv.config();

import { query, sql } from "./server/db.js";

async function main() {
  try {
    console.log("Connecting database and running queries...");
    
    console.log("\n--- Columnas de la tabla Usuarios ---");
    const columnsQuery = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Usuarios'";
    const columns = await query(columnsQuery);
    console.table(columns);

    console.log("\n--- 3 Registros de ejemplo de la tabla Usuarios ---");
    const recordsQuery = "SELECT TOP 3 * FROM Usuarios";
    const records = await query(recordsQuery);
    console.log(JSON.stringify(records, null, 2));

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    // Close the connection pool
    await sql.close();
    process.exit(0);
  }
}

main();
