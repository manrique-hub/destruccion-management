import { execute } from "../db.js";

const ddl = `
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Usuarios')
BEGIN
  CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(180) NOT NULL,
    usuario NVARCHAR(120) NOT NULL UNIQUE,
    [contraseña] NVARCHAR(255) NOT NULL,
    rol NVARCHAR(60) NOT NULL,
    correo_personal NVARCHAR(180) NULL,
    correo_corporativo NVARCHAR(180) NULL,
    estado NVARCHAR(40) NOT NULL DEFAULT 'Pendiente',
    cargo NVARCHAR(120) NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;

IF COL_LENGTH('Usuarios', 'cargo') IS NULL
  ALTER TABLE Usuarios ADD cargo NVARCHAR(120) NULL;

IF COL_LENGTH('Usuarios', 'area_asignada') IS NULL
  ALTER TABLE Usuarios ADD area_asignada NVARCHAR(120) NULL;

IF COL_LENGTH('Usuarios', 'fecha_creacion') IS NULL
  ALTER TABLE Usuarios ADD fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_fecha_creacion DEFAULT SYSDATETIME();

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Actas')
BEGIN
  CREATE TABLE Actas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    consecutivo NVARCHAR(40) NOT NULL UNIQUE,
    solicitante NVARCHAR(180) NOT NULL,
    correo_solicitante NVARCHAR(180) NOT NULL,
    area NVARCHAR(120) NOT NULL,
    cargo NVARCHAR(120) NULL,
    fecha DATE NOT NULL,
    estado NVARCHAR(60) NOT NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_finalizacion DATETIME2 NULL,
    ceco NVARCHAR(80) NULL,
    tipo_destruccion NVARCHAR(120) NULL,
    observaciones NVARCHAR(MAX) NULL,
    creado_por_id INT NULL,
    paso_por_costos BIT NOT NULL DEFAULT 0,
    datos_bloqueados BIT NOT NULL DEFAULT 0
  );
END;

IF COL_LENGTH('Actas', 'fecha_creacion') IS NULL
  ALTER TABLE Actas ADD fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_Actas_fecha_creacion DEFAULT SYSDATETIME();

IF COL_LENGTH('Actas', 'consecutivo') IS NULL
  ALTER TABLE Actas ADD consecutivo NVARCHAR(40) NULL;

IF COL_LENGTH('Actas', 'solicitante') IS NULL
  ALTER TABLE Actas ADD solicitante NVARCHAR(180) NULL;

IF COL_LENGTH('Actas', 'correo_solicitante') IS NULL
  ALTER TABLE Actas ADD correo_solicitante NVARCHAR(180) NULL;

IF COL_LENGTH('Actas', 'area') IS NULL
  ALTER TABLE Actas ADD area NVARCHAR(120) NULL;

IF COL_LENGTH('Actas', 'cargo') IS NULL
  ALTER TABLE Actas ADD cargo NVARCHAR(120) NULL;

IF COL_LENGTH('Actas', 'fecha') IS NULL
  ALTER TABLE Actas ADD fecha DATE NULL;

IF COL_LENGTH('Actas', 'estado') IS NULL
  ALTER TABLE Actas ADD estado NVARCHAR(60) NULL;

IF COL_LENGTH('Actas', 'fecha_actualizacion') IS NULL
  ALTER TABLE Actas ADD fecha_actualizacion DATETIME2 NOT NULL CONSTRAINT DF_Actas_fecha_actualizacion DEFAULT SYSDATETIME();

IF COL_LENGTH('Actas', 'fecha_finalizacion') IS NULL
  ALTER TABLE Actas ADD fecha_finalizacion DATETIME2 NULL;

IF COL_LENGTH('Actas', 'ceco') IS NULL
  ALTER TABLE Actas ADD ceco NVARCHAR(80) NULL;

IF COL_LENGTH('Actas', 'tipo_destruccion') IS NULL
  ALTER TABLE Actas ADD tipo_destruccion NVARCHAR(120) NULL;

IF COL_LENGTH('Actas', 'observaciones') IS NULL
  ALTER TABLE Actas ADD observaciones NVARCHAR(MAX) NULL;

IF COL_LENGTH('Actas', 'creado_por_id') IS NULL
  ALTER TABLE Actas ADD creado_por_id INT NULL;

IF COL_LENGTH('Actas', 'paso_por_costos') IS NULL
  ALTER TABLE Actas ADD paso_por_costos BIT NOT NULL CONSTRAINT DF_Actas_paso_por_costos DEFAULT 0;

IF COL_LENGTH('Actas', 'datos_bloqueados') IS NULL
  ALTER TABLE Actas ADD datos_bloqueados BIT NOT NULL CONSTRAINT DF_Actas_datos_bloqueados DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'HistorialAprobaciones')
BEGIN
  CREATE TABLE HistorialAprobaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    acta_id INT NOT NULL,
    usuario_id INT NULL,
    usuario NVARCHAR(180) NULL,
    rol NVARCHAR(60) NOT NULL,
    accion NVARCHAR(200) NOT NULL,
    observaciones NVARCHAR(MAX) NULL,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    estado_anterior NVARCHAR(60) NOT NULL,
    estado_nuevo NVARCHAR(60) NOT NULL
  );
END;

IF COL_LENGTH('HistorialAprobaciones', 'usuario') IS NULL
  ALTER TABLE HistorialAprobaciones ADD usuario NVARCHAR(180) NULL;

IF COL_LENGTH('HistorialAprobaciones', 'usuario_id') IS NULL
  ALTER TABLE HistorialAprobaciones ADD usuario_id INT NULL;

IF COL_LENGTH('HistorialAprobaciones', 'estado_anterior') IS NULL
  ALTER TABLE HistorialAprobaciones ADD estado_anterior NVARCHAR(60) NOT NULL CONSTRAINT DF_Historial_estado_anterior DEFAULT 'Borrador';

IF COL_LENGTH('HistorialAprobaciones', 'estado_nuevo') IS NULL
  ALTER TABLE HistorialAprobaciones ADD estado_nuevo NVARCHAR(60) NOT NULL CONSTRAINT DF_Historial_estado_nuevo DEFAULT 'Borrador';

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Notificaciones')
BEGIN
  CREATE TABLE Notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    acta_id INT NOT NULL,
    mensaje NVARCHAR(500) NOT NULL,
    tipo NVARCHAR(80) NOT NULL,
    leida BIT NOT NULL DEFAULT 0,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;

IF COL_LENGTH('Notificaciones', 'leida') IS NULL
  ALTER TABLE Notificaciones ADD leida BIT NOT NULL CONSTRAINT DF_Notificaciones_leida DEFAULT 0;

IF COL_LENGTH('Notificaciones', 'fecha') IS NULL
  ALTER TABLE Notificaciones ADD fecha DATETIME2 NOT NULL CONSTRAINT DF_Notificaciones_fecha DEFAULT SYSDATETIME();

IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'SeqActas')
BEGIN
  CREATE SEQUENCE SeqActas AS BIGINT START WITH 1 INCREMENT BY 1;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Actas_Estado_Fecha')
  CREATE INDEX IX_Actas_Estado_Fecha ON Actas (estado, fecha_creacion DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Actas_Area_Fecha')
  CREATE INDEX IX_Actas_Area_Fecha ON Actas (area, fecha_creacion DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Historial_Acta_Fecha')
  CREATE INDEX IX_Historial_Acta_Fecha ON HistorialAprobaciones (acta_id, fecha DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notif_User_Read_Date')
  CREATE INDEX IX_Notif_User_Read_Date ON Notificaciones (usuario_id, leida, fecha DESC);

`;

export async function ensureSchema() {
  await execute(ddl);
}
