import sql from "mssql";

const config = {
  server: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "DestruccionActas",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
  },
  pool: {
    min: 0,
    max: Number(process.env.DB_POOL_MAX || 30),
    idleTimeoutMillis: 30000,
  },
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT || 30000),
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 15000),
};

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

export async function query(sqlText, params = {}) {
  const pool = await getPool();
  const request = pool.request();

  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === "object" && "type" in value) {
      request.input(key, value.type, value.value);
    } else {
      request.input(key, value);
    }
  });

  const result = await request.query(sqlText);
  return result.recordset;
}

export async function queryOne(sqlText, params = {}) {
  const rows = await query(sqlText, params);
  return rows[0] || null;
}

export async function execute(sqlText, params = {}) {
  const pool = await getPool();
  const request = pool.request();

  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === "object" && "type" in value) {
      request.input(key, value.type, value.value);
    } else {
      request.input(key, value);
    }
  });

  return request.query(sqlText);
}

export async function transaction(work) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  const txQuery = async (sqlText, params = {}) => {
    const request = new sql.Request(tx);
    Object.entries(params).forEach(([key, value]) => {
      if (value && typeof value === "object" && "type" in value) {
        request.input(key, value.type, value.value);
      } else {
        request.input(key, value);
      }
    });
    const result = await request.query(sqlText);
    return result.recordset;
  };

  try {
    const result = await work(txQuery);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export { sql };
