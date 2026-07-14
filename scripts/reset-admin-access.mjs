import "dotenv/config";
import bcrypt from "bcryptjs";
import { execute, query } from "../server/db.js";
import { getUsuariosSchema, isBitLike } from "../server/services/usersSchema.service.js";

const target = "admin.principal@humax.co";
const tempPwd = "AdminTemp2026*";

const s = await getUsuariosSchema();
const loginCol = s.usuario;
const rolCol = s.rol;
const estadoCol = s.estado;
const activoCol = s.activo;
const pwdCol = s.password;

if (!loginCol || !pwdCol) {
  throw new Error("No se detectaron columnas login/password");
}

const hash = await bcrypt.hash(tempPwd, 10);
const params = { target, hash };
const sets = [`[${pwdCol}] = @hash`];

if (estadoCol) {
  const t = s.typeByName?.[String(estadoCol).toLowerCase()];
  sets.push(isBitLike(t) ? `[${estadoCol}] = 1` : `[${estadoCol}] = 'Activo'`);
}
if (activoCol) {
  sets.push(`[${activoCol}] = 1`);
}

const updateMain = await execute(
  `UPDATE Usuarios SET ${sets.join(", ")} WHERE LOWER([${loginCol}]) = LOWER(@target)`,
  params
);

let deactivated = 0;
if (rolCol) {
  const adminFilter = `LOWER(CAST([${rolCol}] as nvarchar(100))) in ('admin','administrador')`;
  const whereOther = `${adminFilter} AND LOWER([${loginCol}]) <> LOWER(@target)`;
  const setsOff = [];

  if (estadoCol) {
    const t = s.typeByName?.[String(estadoCol).toLowerCase()];
    setsOff.push(isBitLike(t) ? `[${estadoCol}] = 0` : `[${estadoCol}] = 'Inactivo'`);
  }
  if (activoCol) {
    setsOff.push(`[${activoCol}] = 0`);
  }

  if (setsOff.length) {
    const offRes = await execute(`UPDATE Usuarios SET ${setsOff.join(", ")} WHERE ${whereOther}`, { target });
    deactivated = offRes.rowsAffected?.[0] || 0;
  }
}

const check = await query(
  `SELECT TOP 1 [${loginCol}] AS login FROM Usuarios WHERE LOWER([${loginCol}]) = LOWER(@target)`,
  { target }
);

console.log(
  JSON.stringify(
    {
      target,
      found: check.length > 0,
      updated: updateMain.rowsAffected?.[0] || 0,
      deactivated,
      tempPwd,
    },
    null,
    2
  )
);
