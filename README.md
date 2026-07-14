
  # Destruction Management System

  This is a code bundle for Destruction Management System. The original project is available at https://www.figma.com/design/PzZVvQHuQ73xSpWb16Cd10/Destruction-Management-System.

  ## Running the code (Local)

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the frontend.

  Run `npm run api` to start the backend API (SQL Server).

  Run `npm run dev:all` to run both frontend and backend.

  ## Architecture changes

  - Auth screens were moved to pages:
    - `src/app/pages/LoginPage.tsx`
    - `src/app/pages/RegisterPage.tsx`
  - Theme mode (light/dark) is handled by `src/app/hooks/useThemeMode.ts`.
  - API client is in `src/app/services/api.ts`.
  - Backend is in `server/index.js` and `server/db.js`.

  ## Connect your .bak (SQL Server)

  1. Restore your `.bak` to SQL Server (SSMS: Databases > Restore Database).
  2. Copy `.env.example` to `.env` and set DB credentials.
  3. Ensure the restored DB contains tables:
     - `Usuarios`
     - `Actas`
     - `Notificaciones`
  4. Start API with `npm run api`.

  The app calls `VITE_API_BASE_URL` and falls back to local mock data when the API is unreachable.

  ## Backend API (producción)

  El backend ahora incluye:

  - Inicialización automática de esquema e índices SQL para soportar alto volumen.
  - Pool de conexiones configurable (recomendado para 500+ actas/mes).
  - Rutas REST con paginación para evitar cargas masivas en memoria.
  - Flujo completo de estados con historial y notificaciones transaccionales.

  Endpoints principales:

  - `GET /api/health`
  - `GET /api/bootstrap?page=1&pageSize=25`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/actas?page=1&pageSize=25&estado=&search=`
  - `POST /api/actas`
  - `GET /api/actas/:id`
  - `PUT /api/actas/:id`
  - `POST /api/actas/:id/submit`
  - `POST /api/actas/:id/decision`
  - `GET /api/actas/:id/historial`
  - `GET /api/actas/stats/overview`
  - `GET /api/users?page=1&pageSize=25`
  - `PATCH /api/users/:id/status`
  - `PATCH /api/users/:id/role`
  - `GET /api/notificaciones?userId=1&page=1&pageSize=25`
  - `PATCH /api/notificaciones/:id/read`

  ## Correos electronicos (SMTP)

  El backend ya puede enviar correos reales en:

  - Registro de usuario (acuse de cuenta pendiente)
  - Envio de acta a aprobacion de Area
  - Decisiones de aprobacion/rechazo/finalizacion

  Configura en `.env`:

  - `EMAIL_ENABLED=true`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
  - `APP_BASE_URL`
  