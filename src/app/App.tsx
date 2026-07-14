import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import logoFull from "../imports/logoa-3.png";
import logoIcon from "../imports/logi-1.png";
import {
  LayoutDashboard, FileText, PlusCircle, CheckCircle, Settings,
  ChevronRight, Search, Eye, Trash2, Edit3,
  X, Plus, Save, Send, AlertCircle,
  Clock, XCircle, CheckSquare, RefreshCw,
  LogOut, User, Bell, ChevronLeft, ShieldCheck,
  DollarSign, Leaf, UserCheck, Users,
  Lock, Mail, EyeOff, ArrowLeft, Sparkles, Moon, Sun,
  History, TrendingUp, Award, Building, Pencil, ToggleLeft,
  BarChart2
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useThemeMode } from "./hooks/useThemeMode";
import { api } from "./services/api";
import type { AuthUser, RegisterInput, Rol } from "./types/auth";

type Estado =
  | "Borrador"
  | "Pendiente Área"
  | "Pendiente Costos"
  | "Pendiente HSE&S"
  | "Rechazada por Área"
  | "Rechazada por Costos"
  | "Rechazada por HSE&S"
  | "Finalizada";

type ViewName = "dashboard" | "actas" | "nueva-acta" | "ver-acta" | "catalogos" | "aprobaciones" | "usuarios";
type ApprovalAction = "area-costos" | "area-hse" | "area-rechazar" | "costos-aprobar" | "costos-rechazar" | "hse-finalizar" | "hse-rechazar";

interface HistorialItem {
  id: string;
  usuario: string;
  rol: string;
  accion: string;
  observaciones: string;
  fecha: string;
  estadoAnterior: Estado;
  estadoNuevo: Estado;
}

interface Notificacion {
  id: string;
  paraUserId: string;
  tipo: string;
  actaId: string;
  actaNumero: string;
  mensaje: string;
  comentario?: string;
  fecha: string;
  leida: boolean;
  emailEnviado?: boolean;
}

interface Producto {
  id: string;
  empresaResponsable: string;
  descripcion: string;
  codigoSAP: string;
  lote: string;
  ordenProduccion: string;
  tipoControlado: string;
  infoRegulatoria: string;
  clasificacion: string;
  clasificacionObs: string;
  fechaVencimiento: string;
  causalDestruccion: string;
  descripcionCausal: string;
  pesoKg: number;
  unidades: number;
  costoCOP: number;
  registroINVIMA: string;
  observaciones: string;
}

interface Acta {
  id: string;
  numeroActa: string;
  fechaSolicitud: string;
  solicitanteNombre: string;
  solicitanteCargo: string;
  solicitanteCorreo: string;
  datosGeneralesBloqueados: boolean;
  areaGeneradora: string;
  ceco: string;
  tipoDestruccion: string;
  observaciones: string;
  estado: Estado;
  productos: Producto[];
  historial: HistorialItem[];
  fechaCreacion: string;
  creadoPorId: string;
  creadoPorNombre: string;
  pasoPorCostos: boolean;
  comentarioArea?: string;
  comentarioCostos?: string;
  comentarioHSE?: string;
}

interface CatalogoItem {
  id: string;
  valor: string;
  activo: boolean;
}

const CLASIFICACIONES: string[] = [
  "Materia prima",
  "Producto semiterminado",
  "Medicamento (producto terminado)",
  "Productos de devoluciones",
  "Material de empaque",
  "Otro",
];

const CAUSALES: { valor: string; descripcion: string }[] = [
  { valor: "Material o producto vencido", descripcion: "Producto con vida util vencida." },
  { valor: "Producto no conforme", descripcion: "Incumplimiento de especificaciones de calidad." },
  { valor: "Residuos de proceso, control de calidad o desarrollo", descripcion: "Residuos no aprovechables del proceso." },
  { valor: "Producto retirado o devuelto", descripcion: "Producto retirado o devuelto desde mercado." },
  { valor: "Otras causales", descripcion: "" },
];

const EMPRESAS_SEED: CatalogoItem[] = [
  { id: "e1", valor: "Humax", activo: true },
  { id: "e2", valor: "Farmatech", activo: true },
  { id: "e3", valor: "Cambridge", activo: true },
];

const AREAS_SEED: CatalogoItem[] = [
  { id: "a1", valor: "Producción", activo: true },
  { id: "a2", valor: "Control de Calidad", activo: true },
  { id: "a3", valor: "Logística", activo: true },
  { id: "a4", valor: "Almacén", activo: true },
  { id: "a5", valor: "I+D", activo: true },
];

const CECOS_SEED: CatalogoItem[] = [
  { id: "c1", valor: "CC-001 Manufactura", activo: true },
  { id: "c2", valor: "CC-002 Calidad", activo: true },
  { id: "c3", valor: "CC-003 Almacén", activo: true },
];

const TIPOS_DESTRUCCION: string[] = [
  "Incineración",
  "Desnaturalización",
  "Trituración",
  "Disposición con gestor autorizado",
  "Otro",
];

const CHART_COLORS = ["#1E4DD8", "#059669", "#D97706", "#7C3AED", "#DC2626", "#0891B2"];

const MOCK_USERS_RAW: (AuthUser & { password: string })[] = [
  { id: "u1", nombre: "Admin Sistema", email: "admin@humax.co", correoCoporativo: "admin@humax.co", password: "admin123", rol: "Administrador", activo: true, cargo: "Administrador" },
  { id: "u2", nombre: "María Fernanda López", email: "mlopez@humax.co", correoCoporativo: "mlopez@humax.co", password: "user123", rol: "Solicitante", activo: true, cargo: "Analista de Calidad" },
  { id: "u3", nombre: "Carlos Rueda", email: "crueda@humax.co", correoCoporativo: "crueda@humax.co", password: "aprueba1", rol: "Aprobador Área", activo: true, cargo: "Jefe de Control" },
  { id: "u4", nombre: "Valentina Cruz", email: "vcruz@humax.co", correoCoporativo: "vcruz@humax.co", password: "costos1", rol: "Costos", activo: true, cargo: "Analista de Costos" },
  { id: "u5", nombre: "Jorge Castillo", email: "jcastillo@humax.co", correoCoporativo: "jcastillo@humax.co", password: "hse1234", rol: "HSE & S", activo: true, cargo: "Coordinador HSE&S" },
];

const MOCK_ACTAS: Acta[] = [
  {
    id: "1",
    creadoPorId: "u2",
    creadoPorNombre: "María Fernanda López",
    numeroActa: "ACT-2026-000001",
    fechaSolicitud: "2026-06-20",
    solicitanteNombre: "María Fernanda López",
    solicitanteCargo: "Analista de Calidad",
    solicitanteCorreo: "mlopez@humax.co",
    datosGeneralesBloqueados: true,
    areaGeneradora: "Control de Calidad",
    ceco: "CC-002 Calidad",
    tipoDestruccion: "Incineración",
    observaciones: "Destrucción por vencimiento",
    estado: "Pendiente Área",
    productos: [],
    historial: [],
    fechaCreacion: "2026-06-20",
    pasoPorCostos: false,
  },
];

const MOCK_NOTIFICACIONES: Notificacion[] = [];

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("es-CO").format(n);
const genId = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleString("es-CO");

const genNumeroActa = (actas: Acta[]) => {
  const year = new Date().getFullYear();
  const prefix = `ACT-${year}-`;
  const nums = actas.filter((a) => a.numeroActa.startsWith(prefix)).map((a) => parseInt(a.numeroActa.slice(prefix.length)) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
};

const ESTADO_CONFIG: Record<Estado, { color: string; bg: string; dot: string }> = {
  "Borrador": { color: "text-slate-600", bg: "bg-slate-100 border-slate-300", dot: "bg-slate-400" },
  "Pendiente Área": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  "Pendiente Costos": { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  "Pendiente HSE&S": { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  "Rechazada por Área": { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  "Rechazada por Costos": { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  "Rechazada por HSE&S": { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  "Finalizada": { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

const ACTION_LABELS: Record<ApprovalAction, string> = {
  "area-costos": "Aprobó y envió a Costos",
  "area-hse": "Aprobó y envió a HSE&S",
  "area-rechazar": "Rechazó (Área)",
  "costos-aprobar": "Aprobó (Costos)",
  "costos-rechazar": "Rechazó (Costos)",
  "hse-finalizar": "Finalizó el acta (HSE&S)",
  "hse-rechazar": "Rechazó (HSE&S)",
};

const getNewEstado = (action: ApprovalAction): Estado => ({
  "area-costos": "Pendiente Costos",
  "area-hse": "Pendiente HSE&S",
  "area-rechazar": "Rechazada por Área",
  "costos-aprobar": "Pendiente HSE&S",
  "costos-rechazar": "Rechazada por Costos",
  "hse-finalizar": "Finalizada",
  "hse-rechazar": "Rechazada por HSE&S",
}[action] as Estado);

const isRejection = (s: Estado) => s.startsWith("Rechazada");
const isPending = (s: Estado) => s.startsWith("Pendiente");

function EstadoBadge({ estado }: { estado: Estado }) {
  const c = ESTADO_CONFIG[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${c.color} ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      {estado}
    </span>
  );
}

function ProductoModal({
  producto,
  empresas,
  onSave,
  onClose,
}: {
  producto: Producto | null;
  empresas: CatalogoItem[];
  onSave: (p: Producto) => void;
  onClose: () => void;
}) {
  const blank: Producto = {
    id: genId(), empresaResponsable: empresas[0]?.valor || "", descripcion: "", codigoSAP: "",
    lote: "", ordenProduccion: "", tipoControlado: "No Controlado", infoRegulatoria: "",
    clasificacion: CLASIFICACIONES[0], clasificacionObs: "", fechaVencimiento: "",
    causalDestruccion: CAUSALES[0].valor, descripcionCausal: "", pesoKg: 0, unidades: 0,
    costoCOP: 0, registroINVIMA: "", observaciones: "",
  };
  const [form, setForm] = useState<Producto>(producto || blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Producto, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.descripcion.trim()) e.descripcion = "Requerido";
    if (!form.lote.trim()) e.lote = "Requerido";
    if (!form.fechaVencimiento) e.fechaVencimiento = "Requerido";
    if (form.clasificacion === "Otro" && !form.clasificacionObs.trim()) e.clasificacionObs = "Requerido";
    if (form.causalDestruccion === "Otras causales" && !form.descripcionCausal.trim()) e.descripcionCausal = "Requerido";
    if (form.tipoControlado === "Controlado" && !form.infoRegulatoria.trim()) e.infoRegulatoria = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const iCls = (err?: string) => `w-full px-3 py-2 text-sm bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${err ? "border-red-400 bg-red-50" : "border-border"}`;
  const today = new Date().toISOString().split("T")[0];
  const [causalInfo, setCausalInfo] = useState<{
  valor: string;
  descripcion: string;
} | null>(null);

const [causalPendiente, setCausalPendiente] = useState("");

const [otraCausal, setOtraCausal] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10 rounded-t-xl">
          <h3 className="font-semibold text-foreground">{producto ? "Editar Producto" : "Agregar Producto"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {([
            ["Empresa Responsable", "empresaResponsable", "select-empresas"],
            ["Descripción del Producto*", "descripcion", "text"],
            ["Código SAP", "codigoSAP", "mono"],
            ["Número de Lote*", "lote", "mono"],
            ["Orden de Producción", "ordenProduccion", "mono"],
            ["Tipo de Controlado*", "tipoControlado", "select-controlado"],
          ] as [string, keyof Producto, string][]).map(([label, key, type]) => (
            <div key={String(key)} className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">{label}</label>
              {type === "select-empresas" ? (
                <select value={String(form[key])} onChange={(e) => set(key, e.target.value)} className={iCls()}>
                  {empresas.filter(e => e.activo).map(e => <option key={e.id}>{e.valor}</option>)}
                </select>
              ) : type === "select-controlado" ? (
                <select value={String(form[key])} onChange={(e) => set(key, e.target.value)} className={iCls()}>
                  <option>No Controlado</option><option>Controlado</option>
                </select>
              ) : (
                <input value={String(form[key])} onChange={(e) => set(key, e.target.value)}
                  className={iCls(errors[key as string])} style={type === "mono" ? { fontFamily: "var(--font-mono)" } : {}} />
              )}
              {errors[key as string] && <p className="text-xs text-red-600">{errors[key as string]}</p>}
            </div>
          ))}
          {form.tipoControlado === "Controlado" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Información Regulatoria*</label>
              <input value={form.infoRegulatoria} onChange={(e) => set("infoRegulatoria", e.target.value)} className={iCls(errors.infoRegulatoria)} />
              {errors.infoRegulatoria && <p className="text-xs text-red-600">{errors.infoRegulatoria}</p>}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Clasificación*</label>
            <select value={form.clasificacion} onChange={(e) => set("clasificacion", e.target.value)} className={iCls()}>
              {CLASIFICACIONES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {form.clasificacion === "Otro" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Observación Clasificación*</label>
              <input value={form.clasificacionObs} onChange={(e) => set("clasificacionObs", e.target.value)} className={iCls(errors.clasificacionObs)} />
              {errors.clasificacionObs && <p className="text-xs text-red-600">{errors.clasificacionObs}</p>}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Fecha de Vencimiento*</label>
            <input type="date" value={form.fechaVencimiento} onChange={(e) => set("fechaVencimiento", e.target.value)} className={iCls(errors.fechaVencimiento)} />
            {form.fechaVencimiento && form.fechaVencimiento < today && (
              <p className="text-xs text-amber-700 flex items-center gap-1"><AlertCircle size={11} />Producto vencido</p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Causal de Destrucción*</label>
            <select
                value={form.causalDestruccion}
                onChange={(e) => {
                  const causal = CAUSALES.find(c => c.valor === e.target.value);

                  if (!causal) return;

                  setCausalPendiente(causal.valor);
                  setCausalInfo(causal);
                }}
                className={iCls()}
              >
  
              {CAUSALES.map(c => <option key={c.valor}>{c.valor}</option>)}
            </select>
          </div>
          {(["Peso (Kg)*|pesoKg", "Unidades*|unidades", "Costo COP*|costoCOP"] as string[]).map(f => {
            const [label, key] = f.split("|");
            return (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">{label}</label>
                <input type="number" min={0} value={(form as any)[key] || ""} onChange={(e) => set(key as keyof Producto, parseFloat(e.target.value) || 0)} className={iCls()} />
              </div>
            );
          })}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Registro INVIMA</label>
            <input value={form.registroINVIMA} onChange={(e) => set("registroINVIMA", e.target.value)} className={iCls()} style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} className={iCls() + " resize-none"} rows={2} />
          </div>
        </div>
                <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-all"
          >
            Cancelar
          </button>

          <button
            onClick={() => {
              if (validate()) onSave(form);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
          >
            <Save size={14} />
            {producto ? "Actualizar" : "Agregar"}
          </button>
        </div>

        {causalInfo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-xl">
            <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[90%] p-6">

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  ℹ️
                </div>

                <div>
                  <h2 className="font-bold text-lg">
                    {causalInfo.valor}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Verifique que esta sea la causal correcta antes de continuar.
                  </p>
                </div>
              </div>

              <div className="border rounded-xl bg-slate-50 p-4">
                {causalInfo.valor === "Otras causales" ? (
                  <div className="space-y-3">
                    <p className="text-sm">
                      Especifique cuál es la causal de destrucción.
                    </p>

                    <input
                      value={otraCausal}
                      onChange={(e) => setOtraCausal(e.target.value)}
                      placeholder="Ej: Cambio de proceso, solicitud del cliente..."
                      className="w-full border rounded-lg px-3 py-2"
                    />

                    <p className="text-xs text-gray-500">
                      Si no aplica o no desea especificarla, se registrará como <b>N/A</b>.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6">
                    {causalInfo.descripcion}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() => {
                    setCausalInfo(null);
                    setCausalPendiente("");
                  }}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-gray-100"
                >
                  Cambiar selección
                </button>

                <button
                  onClick={() => {
                    set("causalDestruccion", causalPendiente);

                    if (causalPendiente === "Otras causales") {
                      set(
                        "descripcionCausal",
                        otraCausal.trim() === "" ? "N/A" : otraCausal
                      );
                    }

                    setOtraCausal("");
                    setCausalInfo(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  Confirmar
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>

  );
}

// ─── ApprovalActionModal ──────────────────────────────────────────────────────

function ApprovalActionModal({ acta, action, onConfirm, onClose }: {
  acta: Acta; action: ApprovalAction;
  onConfirm: (comentario: string) => void; onClose: () => void;
}) {
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState(false);
  const isReject = action.includes("rechaz");

  const confirm = () => {
    if (isReject && !comentario.trim()) { setError(true); return; }
    onConfirm(comentario.trim());
  };

  const titles: Record<ApprovalAction, string> = {
    "area-costos": "Aprobar y enviar a Costos",
    "area-hse": "Aprobar y enviar a HSE&S",
    "area-rechazar": "Rechazar Acta",
    "costos-aprobar": "Aprobar → enviar a HSE&S",
    "costos-rechazar": "Rechazar Acta (Costos)",
    "hse-finalizar": "Finalizar y cerrar Acta",
    "hse-rechazar": "Rechazar Acta (HSE&S)",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">{titles[action]}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{acta.numeroActa}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Acta:</span> {acta.solicitanteNombre} — {acta.areaGeneradora}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
              Observaciones {isReject ? <span className="text-red-500">*</span> : "(opcional)"}
            </label>
            <textarea value={comentario} onChange={(e) => { setComentario(e.target.value); setError(false); }} rows={3}
              placeholder={isReject ? "Indique el motivo del rechazo para notificar al solicitante..." : "Observaciones adicionales..."}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${error ? "border-red-400 bg-red-50" : "border-border bg-input-background"}`}
            />
            {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />El motivo de rechazo es obligatorio.</p>}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail size={11} /> Se enviará notificación por correo a los involucrados.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-all">Cancelar</button>
          <button onClick={confirm} className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all ${isReject ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}>
            <CheckCircle size={14} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

function NotificationBell({ notificaciones, onRead, onView }: {
  notificaciones: Notificacion[]; onRead: (id: string) => void; onView: (actaId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
        <Bell size={17} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notificaciones</p>
              {unread > 0 && <span className="text-xs text-muted-foreground">{unread} sin leer</span>}
            </div>
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center"><Bell size={24} className="mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Sin notificaciones</p></div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notificaciones.map(n => (
                  <div key={n.id} className={`px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.leida ? "bg-blue-50/60" : ""}`}
                    onClick={() => { onRead(n.id); onView(n.actaId); setOpen(false); }}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.tipo === "acta-rechazada" ? "bg-red-100" : n.tipo === "acta-finalizada" ? "bg-emerald-100" : "bg-blue-100"}`}>
                        {n.tipo.includes("rechaz") ? <XCircle size={13} className="text-red-600" /> : n.tipo.includes("finaliz") ? <CheckSquare size={13} className="text-emerald-600" /> : <Clock size={13} className="text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${!n.leida ? "font-semibold text-foreground" : "text-foreground/80"}`}>{n.mensaje}</p>
                        {n.comentario && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-2">"{n.comentario}"</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-muted-foreground">{n.fecha}</p>
                          {n.emailEnviado && <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><Mail size={9} /> Email enviado</span>}
                        </div>
                      </div>
                      {!n.leida && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── HistorialTimeline ────────────────────────────────────────────────────────

function HistorialTimeline({ historial }: { historial: HistorialItem[] }) {
  if (historial.length === 0) return (
    <div className="p-8 text-center"><History size={24} className="mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Sin movimientos registrados aún.</p></div>
  );
  return (
    <div className="p-5 space-y-0">
      {historial.map((item, i) => {
        const isLast = i === historial.length - 1;
        const isReject = item.estadoNuevo.startsWith("Rechazada");
        const isFinal = item.estadoNuevo === "Finalizada";
        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isFinal ? "bg-emerald-50 border-emerald-400" : isReject ? "bg-red-50 border-red-400" : "bg-blue-50 border-blue-300"}`}>
                {isFinal ? <CheckSquare size={14} className="text-emerald-600" /> : isReject ? <XCircle size={14} className="text-red-600" /> : <CheckCircle size={14} className="text-blue-600" />}
              </div>
              {!isLast && <div className="w-0.5 h-6 bg-border mt-1" />}
            </div>
            <div className={`pb-5 flex-1 min-w-0 ${isLast ? "" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.accion}</p>
                  <p className="text-xs text-muted-foreground">{item.usuario} · <span className="text-primary/70">{item.rol}</span></p>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">{item.fecha}</p>
              </div>
              {item.observaciones && (
                <div className="mt-1.5 px-3 py-2 bg-secondary/50 rounded-lg border border-border text-xs text-muted-foreground italic">"{item.observaciones}"</div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <EstadoBadge estado={item.estadoAnterior} />
                <ChevronRight size={12} className="text-muted-foreground" />
                <EstadoBadge estado={item.estadoNuevo} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard General ────────────────────────────────────────────────────────

function DashboardGeneral({ actas, onView }: { actas: Acta[]; onView: (id: string) => void }) {
  const stats = [
    { label: "Total Actas", value: actas.length, icon: FileText, color: "text-primary", bg: "bg-blue-50" },
    { label: "Pendientes", value: actas.filter(a => isPending(a.estado)).length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Finalizadas", value: actas.filter(a => a.estado === "Finalizada").length, icon: CheckSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rechazadas", value: actas.filter(a => isRejection(a.estado)).length, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];
  const recientes = [...actas].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)).slice(0, 5);
  const totalCosto = actas.flatMap(a => a.productos).reduce((s, p) => s + p.costoCOP, 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-foreground">Dashboard</h1><p className="text-sm text-muted-foreground mt-0.5">Resumen general del sistema de actas de destrucción</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}><s.icon size={18} className={s.color} /></div>
            <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Costo Total Destruido</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalCosto)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Unidades</p>
          <p className="text-2xl font-bold text-foreground">{fmtNum(actas.flatMap(a => a.productos).reduce((s, p) => s + p.unidades, 0))}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold text-sm">Actas Recientes</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/60 text-left">
            {["Número", "Área", "Solicitante", "Estado", ""].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {recientes.map(a => (
              <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-primary font-semibold">{a.numeroActa}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{a.areaGeneradora}</td>
                <td className="px-5 py-3 text-foreground">{a.solicitanteNombre || a.creadoPorNombre}</td>
                <td className="px-5 py-3"><EstadoBadge estado={a.estado} /></td>
                <td className="px-5 py-3"><button onClick={() => onView(a.id)} className="text-primary hover:text-primary/80 transition-colors"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dashboard HSE&S ──────────────────────────────────────────────────────────

function DashboardHSE({ actas }: { actas: Acta[] }) {
  const todos = actas.flatMap(a => a.productos);
  const pendientesHSE = actas
    .filter(a => a.estado === "Pendiente HSE&S")
    .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
    .slice(0, 6);

  // Top 5 productos por unidades destruidas
  const prodMap = new Map<string, number>();
  todos.forEach(p => prodMap.set(p.descripcion, (prodMap.get(p.descripcion) || 0) + p.unidades));
  const topProductos = [...prodMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, v]) => ({ name: n.length > 22 ? n.slice(0, 22) + "…" : n, value: v }));

  // Causales
  const causeMap = new Map<string, number>();
  todos.forEach(p => causeMap.set(p.causalDestruccion, (causeMap.get(p.causalDestruccion) || 0) + 1));
  const causales = [...causeMap.entries()].sort((a, b) => b[1] - a[1])
    .map(([n, v]) => ({ name: n.length > 28 ? n.slice(0, 28) + "…" : n, value: v }));

  // Áreas
  const areaMap = new Map<string, number>();
  actas.forEach(a => a.areaGeneradora && areaMap.set(a.areaGeneradora, (areaMap.get(a.areaGeneradora) || 0) + 1));
  const areas = [...areaMap.entries()].sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ name: n, value: v }));

  // Por mes (últimos 6)
  const meses: string[] = [];
  const mesData: { mes: string; actas: number; kg: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-CO", { month: "short", year: "2-digit" });
    const cnt = actas.filter(a => a.fechaCreacion.startsWith(key)).length;
    const kg = actas.filter(a => a.fechaCreacion.startsWith(key)).flatMap(a => a.productos).reduce((s, p) => s + p.pesoKg, 0);
    mesData.push({ mes: label, actas: cnt, kg: Math.round(kg * 10) / 10 });
  }

  const stats = [
    { label: "Actas HSE procesadas", value: actas.filter(a => ["Finalizada", "Rechazada por HSE&S", "Pendiente HSE&S"].includes(a.estado)).length, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Finalizadas", value: actas.filter(a => a.estado === "Finalizada").length, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rechazadas por HSE&S", value: actas.filter(a => a.estado === "Rechazada por HSE&S").length, color: "text-red-600", bg: "bg-red-50" },
    { label: "Pendientes HSE&S", value: actas.filter(a => a.estado === "Pendiente HSE&S").length, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-foreground">Dashboard HSE&S</h1><p className="text-sm text-muted-foreground mt-0.5">Indicadores ambientales y de seguridad del proceso de destrucción</p></div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-2">Alcance del rol HSE&S</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Revisar y cerrar actas en Pendiente HSE&S.</div>
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Ver historial completo y comentarios previos.</div>
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Finalizar o rechazar con trazabilidad formal.</div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}><Leaf size={16} className={s.color} /></div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Cola operativa HSE&S</p>
          {pendientesHSE.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay actas pendientes en este momento.</p>
          ) : (
            <div className="space-y-2.5">
              {pendientesHSE.map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg border border-border bg-secondary/30">
                  <p className="text-xs font-mono text-primary font-semibold">{a.numeroActa}</p>
                  <p className="text-xs text-foreground truncate">{a.solicitanteNombre || a.creadoPorNombre}</p>
                  <p className="text-[11px] text-muted-foreground">{a.areaGeneradora} · {a.productos.length} producto(s)</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Productos más destruidos (unidades)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProductos} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Bar dataKey="value" fill="#1E4DD8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Causales más frecuentes</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={causales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {causales.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Áreas generadoras de actas</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={areas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Actas" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Actas por mes (últimos 6 meses)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="actas" name="Actas" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Costos ─────────────────────────────────────────────────────────

function DashboardCostos({ actas }: { actas: Acta[] }) {
  const actasCostos = actas.filter(a => a.pasoPorCostos);
  const pendientesList = actas
    .filter(a => a.estado === "Pendiente Costos")
    .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
    .slice(0, 6);
  const pendientes = actas.filter(a => a.estado === "Pendiente Costos").length;
  const aprobadas = actas.filter(a => a.pasoPorCostos && (a.estado === "Pendiente HSE&S" || a.estado === "Finalizada")).length;
  const rechazadas = actas.filter(a => a.estado === "Rechazada por Costos").length;
  const totalCosto = actasCostos.flatMap(a => a.productos).reduce((s, p) => s + p.costoCOP, 0);

  // Costo por CECO
  const cecoMap = new Map<string, number>();
  actasCostos.forEach(a => {
    const costo = a.productos.reduce((s, p) => s + p.costoCOP, 0);
    cecoMap.set(a.ceco || "Sin CECO", (cecoMap.get(a.ceco || "Sin CECO") || 0) + costo);
  });
  const costoCECO = [...cecoMap.entries()].map(([n, v]) => ({ name: n, value: v }));

  // Por mes
  const mesData: { mes: string; aprobadas: number; rechazadas: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("es-CO", { month: "short" });
    const apr = actas.filter(a => a.pasoPorCostos && a.fechaCreacion.startsWith(key) && (a.estado === "Finalizada" || a.estado === "Pendiente HSE&S")).length;
    const rej = actas.filter(a => a.estado === "Rechazada por Costos" && a.fechaCreacion.startsWith(key)).length;
    mesData.push({ mes: label, aprobadas: apr, rechazadas: rej });
  }

  const stats = [
    { label: "Pendientes en Costos", value: pendientes, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Aprobadas por Costos", value: aprobadas, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rechazadas por Costos", value: rechazadas, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total gestionado COP", value: fmt(totalCosto), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", wide: true },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-foreground">Dashboard Costos</h1><p className="text-sm text-muted-foreground mt-0.5">Indicadores financieros del proceso de destrucción</p></div>
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-2">Alcance del rol Costos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Revisar actas en Pendiente Costos.</div>
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Validar impacto económico por CECO y total.</div>
          <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">Aprobar a HSE&S o rechazar con observación.</div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}><s.icon size={16} className={s.color} /></div>
              <p className={`font-bold text-foreground ${s.wide ? "text-lg" : "text-2xl"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Cola operativa Costos</p>
          {pendientesList.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay actas pendientes en Costos.</p>
          ) : (
            <div className="space-y-2.5">
              {pendientesList.map((a) => {
                const costo = a.productos.reduce((s, p) => s + p.costoCOP, 0);
                return (
                  <div key={a.id} className="p-2.5 rounded-lg border border-border bg-secondary/30">
                    <p className="text-xs font-mono text-primary font-semibold">{a.numeroActa}</p>
                    <p className="text-xs text-foreground truncate">{a.solicitanteNombre || a.creadoPorNombre}</p>
                    <p className="text-[11px] text-muted-foreground">{a.areaGeneradora} · {fmt(costo)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Costo destrucciones por CECO (COP)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costoCECO} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" name="COP" fill="#D97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Participación mensual Costos</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="aprobadas" name="Aprobadas" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rechazadas" name="Rechazadas" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── ActasListView ────────────────────────────────────────────────────────────

function ActasListView({ actas, onView, onNew, onDelete }: {
  actas: Acta[]; onView: (id: string) => void; onNew?: () => void; onDelete?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [page, setPage] = useState(0);
  const perPage = 8;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actaEliminar, setActaEliminar] = useState<Acta | null>(null);

  const filtered = actas.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.numeroActa.toLowerCase().includes(q) || a.solicitanteNombre.toLowerCase().includes(q) ||
      a.areaGeneradora.toLowerCase().includes(q) || a.productos.some(p => p.codigoSAP.toLowerCase().includes(q) || p.lote.toLowerCase().includes(q));
    const matchE = filterEstado === "Todos" || a.estado === filterEstado;
    return matchQ && matchE;
  });

  const pages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const ESTADOS: Estado[] = ["Borrador", "Pendiente Área", "Pendiente Costos", "Pendiente HSE&S", "Rechazada por Área", "Rechazada por Costos", "Rechazada por HSE&S", "Finalizada"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-foreground">Consulta de Actas</h1><p className="text-sm text-muted-foreground mt-0.5">{filtered.length} de {actas.length} registros</p></div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar número, solicitante, SAP, lote..." className="w-full pl-9 pr-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(0); }} className="px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none">
          <option>Todos</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/60 text-left">
            {["Número", "Solicitante", "Área", "Fecha", "Productos", "Costo", "Estado", ""].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">No se encontraron actas.</td></tr>}
            {paged.map(a => {
              const costo = a.productos.reduce((s, p) => s + p.costoCOP, 0);
              return (
                <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono text-xs text-primary font-semibold">{a.numeroActa}</span></td>
                  <td className="px-4 py-3 text-foreground text-sm">{a.solicitanteNombre || a.creadoPorNombre}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.areaGeneradora}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.fechaSolicitud}</td>
                  <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold">{a.productos.length}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{fmt(costo)}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={a.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onView(a.id)} className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                      {onDelete && (
                          <button
                            onClick={() => {
                              setActaEliminar(a);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground">Página {page + 1} de {pages}</p>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-secondary disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
              <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-secondary disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
      {showDeleteModal && actaEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-2xl w-[550px] max-w-[95vw] overflow-hidden">

            <div className="p-8">

              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={40} className="text-red-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center">
                Eliminar Acta
              </h2>

              <p className="text-center text-muted-foreground mt-2">
                Está a punto de eliminar la siguiente acta.
              </p>

              <div className="mt-6 bg-slate-50 border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  Número de Acta
                </p>

                <p className="font-mono font-bold text-primary text-lg">
                  {actaEliminar.numeroActa}
                </p>
              </div>

              <div className="mt-5 border border-red-200 bg-red-50 rounded-xl p-4">

                <p className="font-semibold text-red-700 mb-3">
                  ⚠ Esta acción eliminará:
                </p>

                <ul className="text-sm space-y-1">
                  <li>• Información general del acta</li>
                  <li>• Productos registrados</li>
                  <li>• Historial del proceso</li>
                  <li>• Registros asociados</li>
                </ul>

                <p className="mt-4 text-red-700 font-medium">
                  Esta acción no se puede deshacer.
                </p>

              </div>

              <div className="flex justify-center gap-3 mt-8">

                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setActaEliminar(null);
                  }}
                  className="px-5 py-2 border border-border rounded-lg hover:bg-secondary"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => {
                    onDelete?.(actaEliminar.id);
                    setShowDeleteModal(false);
                    setActaEliminar(null);
                  }}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Eliminar Acta
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

// ─── ActaView ─────────────────────────────────────────────────────────────────

function ActaView({ acta, empresas, areas, cecos, isNew, canEdit, onSave, onBack, onUpdateEstado }: {
  acta: Acta; empresas: CatalogoItem[]; areas: CatalogoItem[]; cecos: CatalogoItem[];
  isNew: boolean; canEdit: boolean;
  onSave: (a: Acta) => void; onBack: () => void;
  onUpdateEstado: (id: string) => void;
}) {
  const [form, setForm] = useState<Acta>(acta);
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const isBorrador = form.estado === "Borrador";
  const blocked = form.datosGeneralesBloqueados;
  const editable = canEdit && isBorrador;
  const editableData = canEdit && !blocked;

  const set = (k: keyof Acta, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const totalCosto = form.productos.reduce((s, p) => s + p.costoCOP, 0);
  const totalUnd = form.productos.reduce((s, p) => s + p.unidades, 0);
  const totalKg = form.productos.reduce((s, p) => s + p.pesoKg, 0);

  const handleSaveProducto = (p: any) => {
    const prods = form.productos.find(x => x.id === p.id)
      ? form.productos.map(x => x.id === p.id ? p : x)
      : [...form.productos, p];
    setForm(f => ({ ...f, productos: prods }));
    setEditingProducto(null);
  };

  const handleSave = () => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const iCls = (disabled?: boolean) => `w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${disabled ? "opacity-60 cursor-not-allowed bg-secondary/50" : ""}`;

  const rejectedComment = form.comentarioArea && isRejection(form.estado) && form.estado === "Rechazada por Área" ? form.comentarioArea
    : form.comentarioCostos && form.estado === "Rechazada por Costos" ? form.comentarioCostos
    : form.comentarioHSE && form.estado === "Rechazada por HSE&S" ? form.comentarioHSE
    : undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{isNew ? "Nueva Acta" : form.numeroActa}</h1>
              <EstadoBadge estado={form.estado} />
            </div>
            <p className="text-sm text-muted-foreground">Creada el {form.fechaCreacion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && isBorrador && canEdit && form.productos.length > 0 && form.solicitanteNombre && form.areaGeneradora && (
            <button onClick={() => onUpdateEstado(form.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all">
              <Send size={14} /> Enviar a Aprobación de Área
            </button>
          )}
          {(editable || canEdit) && (
            <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all shadow-sm ${saved ? "bg-emerald-600 text-white" : "bg-primary text-white hover:bg-primary/90"}`}>
              {saved ? <><CheckCircle size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}
            </button>
          )}
        </div>
      </div>

      {/* Rejection banner */}
      {isRejection(form.estado) && rejectedComment && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 mb-1">Acta {form.estado} — Motivo:</p>
            <p className="text-sm text-red-700">{rejectedComment}</p>
          </div>
        </div>
      )}

      {/* Datos Solicitante (bloqueable) */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Datos del Solicitante</h2>
          {blocked && <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 flex items-center gap-1"><Lock size={11} />Bloqueado tras envío</span>}
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ["Nombre del Solicitante*", "solicitanteNombre", "text"],
            ["Cargo*", "solicitanteCargo", "text"],
            ["Correo Corporativo*", "solicitanteCorreo", "email"],
          ].map(([label, key, type]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => set(key as keyof Acta, e.target.value)}
                disabled={!editableData} className={iCls(!editableData)} placeholder={label.replace("*", "")} />
            </div>
          ))}
        </div>
      </div>

      {/* Datos Generales */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/30">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Datos Generales</h2>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número de Acta</label>
            <input value={form.numeroActa} readOnly className={iCls(true) + " font-mono text-xs"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha de Solicitud*</label>
            <input type="date" value={form.fechaSolicitud} onChange={e => set("fechaSolicitud", e.target.value)} disabled={!editable} className={iCls(!editable)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Área Generadora*</label>
            <select value={form.areaGeneradora} onChange={e => set("areaGeneradora", e.target.value)} disabled={!editable} className={iCls(!editable)}>
              <option value="">Seleccione...</option>
              {areas.filter(a => a.activo).map(a => <option key={a.id}>{a.valor}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CECO</label>
            <select value={form.ceco} onChange={e => set("ceco", e.target.value)} disabled={!editable} className={iCls(!editable)}>
              <option value="">Seleccione...</option>
              {cecos.filter(c => c.activo).map(c => <option key={c.id}>{c.valor}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Destrucción</label>
            <select value={form.tipoDestruccion} onChange={e => set("tipoDestruccion", e.target.value)} disabled={!editable} className={iCls(!editable)}>
              <option value="">Seleccione...</option>
              {TIPOS_DESTRUCCION.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</label>
            <div className="px-3 py-2"><EstadoBadge estado={form.estado} /></div>
          </div>
          <div className="col-span-2 lg:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observaciones Generales</label>
            <textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} disabled={!editable} className={iCls(!editable) + " resize-none"} rows={2} />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Productos ({form.productos.length})</h2>
          {editable && (
            <button onClick={() => setEditingProducto("new")} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
              <Plus size={13} /> Agregar
            </button>
          )}
        </div>
        {form.productos.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No hay productos registrados.{editable && <><br /><button onClick={() => setEditingProducto("new")} className="mt-2 text-primary hover:underline">+ Agregar el primero</button></>}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-secondary/50 text-left">
                {["Empresa", "Descripción", "SAP", "Lote", "Clasificación", "Vencimiento", "Kg", "Unidades", "Costo COP", ""].map(h => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {form.productos.map(p => {
                  const vencido = p.fechaVencimiento < new Date().toISOString().split("T")[0];
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2.5">{p.empresaResponsable}</td>
                      <td className="px-3 py-2.5 max-w-36 truncate" title={p.descripcion}>{p.descripcion}</td>
                      <td className="px-3 py-2.5 font-mono text-primary">{p.codigoSAP}</td>
                      <td className="px-3 py-2.5 font-mono">{p.lote}</td>
                      <td className="px-3 py-2.5 max-w-28 truncate">{p.clasificacion}</td>
                      <td className={`px-3 py-2.5 font-mono ${vencido ? "text-red-600 font-semibold" : ""}`}>{p.fechaVencimiento}</td>
                      <td className="px-3 py-2.5 font-mono text-right">{p.pesoKg}</td>
                      <td className="px-3 py-2.5 font-mono text-right">{fmtNum(p.unidades)}</td>
                      <td className="px-3 py-2.5 font-mono text-right">{fmt(p.costoCOP)}</td>
                      <td className="px-3 py-2.5">
                        {editable && (
                          <div className="flex gap-1">
                            <button onClick={() => setEditingProducto(p)} className="p-1 text-primary hover:bg-blue-50 rounded"><Edit3 size={12} /></button>
                            <button onClick={() => setForm(f => ({ ...f, productos: f.productos.filter(x => x.id !== p.id) }))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/50 border-t-2 border-border font-semibold">
                  <td colSpan={6} className="px-3 py-3 text-xs text-muted-foreground uppercase">Totales</td>
                  <td className="px-3 py-3 font-mono text-xs text-right">{totalKg.toFixed(2)} kg</td>
                  <td className="px-3 py-3 font-mono text-xs text-right">{fmtNum(totalUnd)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-right font-bold">{fmt(totalCosto)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <History size={16} className="text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Historial del Proceso</h2>
        </div>
        <HistorialTimeline historial={form.historial} />
      </div>

      {editingProducto !== null && (
        <ProductoModal
          producto={editingProducto === "new" ? null : editingProducto}
          empresas={empresas}
          onSave={handleSaveProducto}
          onClose={() => setEditingProducto(null)}
        />
      )}
    </div>
  );
}

// ─── AprobacionesView ─────────────────────────────────────────────────────────

function AprobacionesView({ actas, rolActual, onAction, onView }: {
  actas: Acta[]; rolActual: Rol;
  onAction: (actaId: string, action: ApprovalAction, comentario: string) => void;
  onView: (id: string) => void;
}) {
  const [modalState, setModalState] = useState<{ acta: Acta; action: ApprovalAction } | null>(null);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");

  const estadoPendiente: Estado =
    rolActual === "Aprobador Área" ? "Pendiente Área" :
    rolActual === "Costos" ? "Pendiente Costos" : "Pendiente HSE&S";

  const pendientes = actas
    .filter(a => a.estado === estadoPendiente)
    .filter((a) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.numeroActa.toLowerCase().includes(q) ||
        (a.solicitanteNombre || "").toLowerCase().includes(q) ||
        (a.areaGeneradora || "").toLowerCase().includes(q);
      const matchArea = areaFilter === "Todas" || a.areaGeneradora === areaFilter;
      return matchSearch && matchArea;
    });
  const historial = actas.filter(a => {
    const hayHistorial = a.historial.some(h => h.rol === rolActual);
    return hayHistorial && a.estado !== estadoPendiente;
  }).slice(0, 6);
  const uniqueAreas = ["Todas", ...new Set(actas.map((a) => a.areaGeneradora).filter(Boolean))];
  const costoPendiente = pendientes.reduce((sum, a) => sum + a.productos.reduce((s, p) => s + p.costoCOP, 0), 0);
  const kgPendiente = pendientes.reduce((sum, a) => sum + a.productos.reduce((s, p) => s + p.pesoKg, 0), 0);
  const roleScope =
    rolActual === "Costos"
      ? {
          title: "Qué puede ver Costos",
          items: [
            "Actas en estado Pendiente Costos",
            "Costo total y detalle económico por acta",
            "Comentarios previos de Área",
          ],
        }
      : rolActual === "HSE & S"
        ? {
            title: "Qué puede ver HSE&S",
            items: [
              "Actas en estado Pendiente HSE&S",
              "Trazabilidad completa y comentarios de etapas previas",
              "Datos de riesgo/ambientales y productos a destruir",
            ],
          }
        : {
            title: "Qué puede ver Aprobador Área",
            items: [
              "Actas de su bandeja de Área",
              "Datos del solicitante y resumen de productos",
              "Opciones de envío a Costos/HSE o rechazo",
            ],
          };

  const openModal = (acta: Acta, action: ApprovalAction) => setModalState({ acta, action });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Aprobaciones — {rolActual}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bandeja organizada de revisión y decisión</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-foreground">{pendientes.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Áreas en cola</p>
          <p className="text-2xl font-bold text-foreground">{new Set(pendientes.map((a) => a.areaGeneradora)).size}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{rolActual === "Costos" ? "Costo en revisión" : "Kg en revisión"}</p>
          <p className="text-2xl font-bold text-foreground">{rolActual === "Costos" ? fmt(costoPendiente) : `${kgPendiente.toFixed(1)} kg`}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-2">{roleScope.title}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {roleScope.items.map((item) => (
            <div key={item} className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, solicitante o área"
            className="w-full pl-9 pr-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none"
        >
          {uniqueAreas.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {pendientes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
          <p className="font-medium text-foreground">Sin actas pendientes</p>
          <p className="text-sm text-muted-foreground mt-1">No hay actas esperando tu revisión.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map(a => {
            const costo = a.productos.reduce((s, p) => s + p.costoCOP, 0);
            return (
              <div key={a.id} className="bg-card border-l-4 border-l-primary border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary font-bold">{a.numeroActa}</span>
                      <EstadoBadge estado={a.estado} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{a.solicitanteNombre}</p>
                    <p className="text-xs text-muted-foreground">{a.solicitanteCargo} · {a.areaGeneradora} · {a.fechaSolicitud}</p>
                    <p className="text-xs text-muted-foreground">{a.productos.length} producto(s) · <span className="font-mono">{fmt(costo)}</span> · {a.tipoDestruccion}</p>
                    {rolActual === "Costos" && (
                      <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 w-fit">
                        Costo estimado revisión: {fmt(costo)}
                      </p>
                    )}
                    {rolActual === "HSE & S" && (
                      <p className="text-xs text-purple-700 mt-1 bg-purple-50 border border-purple-200 rounded px-2 py-1 w-fit">
                        Peso total revisión: {a.productos.reduce((s, p) => s + p.pesoKg, 0).toFixed(1)} kg
                      </p>
                    )}
                    {a.observaciones && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{a.observaciones}"</p>}
                    {a.comentarioArea && rolActual !== "Aprobador Área" && (
                      <p className="text-xs text-blue-700 mt-1 bg-blue-50 border border-blue-200 rounded px-2 py-1">Área: "{a.comentarioArea}"</p>
                    )}
                    {a.comentarioCostos && rolActual === "HSE & S" && (
                      <p className="text-xs text-orange-700 mt-1 bg-orange-50 border border-orange-200 rounded px-2 py-1">Costos: "{a.comentarioCostos}"</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => onView(a.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg hover:bg-secondary transition-all">
                      <Eye size={12} /> Ver detalle
                    </button>
                    {rolActual === "Aprobador Área" && (
                      <>
                        <button onClick={() => openModal(a, "area-costos")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                          <CheckCircle size={12} /> → Costos
                        </button>
                        <button onClick={() => openModal(a, "area-hse")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all">
                          <CheckCircle size={12} /> → HSE&S
                        </button>
                        <button onClick={() => openModal(a, "area-rechazar")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all">
                          <XCircle size={12} /> Rechazar
                        </button>
                      </>
                    )}
                    {rolActual === "Costos" && (
                      <>
                        <button onClick={() => openModal(a, "costos-aprobar")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                          <CheckCircle size={12} /> Aprobar → HSE&S
                        </button>
                        <button onClick={() => openModal(a, "costos-rechazar")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all">
                          <XCircle size={12} /> Rechazar
                        </button>
                      </>
                    )}
                    {rolActual === "HSE & S" && (
                      <>
                        <button onClick={() => openModal(a, "hse-finalizar")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                          <CheckSquare size={12} /> Finalizar Acta
                        </button>
                        <button onClick={() => openModal(a, "hse-rechazar")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all">
                          <XCircle size={12} /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border"><p className="text-sm font-semibold text-foreground">Historial reciente</p></div>
          <div className="divide-y divide-border">
            {historial.map(a => {
              const myEntry = [...a.historial].reverse().find(h => h.rol === rolActual);
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
                  <div>
                    <span className="font-mono text-xs text-primary font-semibold">{a.numeroActa}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-xs text-foreground">{a.solicitanteNombre}</span>
                    {myEntry && <p className="text-xs text-muted-foreground mt-0.5">{myEntry.accion} — {myEntry.fecha}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <EstadoBadge estado={a.estado} />
                    <button onClick={() => onView(a.id)} className="p-1.5 text-primary hover:bg-blue-50 rounded transition-colors"><Eye size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalState && (
        <ApprovalActionModal
          acta={modalState.acta}
          action={modalState.action}
          onConfirm={(comentario) => { onAction(modalState.acta.id, modalState.action, comentario); setModalState(null); }}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

// ─── CatalogosView ────────────────────────────────────────────────────────────

function CatalogosView({ empresas, areas, cecos, onUpdateEmpresas, onUpdateAreas, onUpdateCecos }: {
  empresas: CatalogoItem[]; areas: CatalogoItem[]; cecos: CatalogoItem[];
  onUpdateEmpresas: (v: CatalogoItem[]) => void; onUpdateAreas: (v: CatalogoItem[]) => void; onUpdateCecos: (v: CatalogoItem[]) => void;
}) {
  const [tab, setTab] = useState<"empresas" | "areas" | "cecos" | "clasificaciones" | "causales">("empresas");
  const [newVal, setNewVal] = useState("");

  const current = tab === "empresas" ? empresas : tab === "areas" ? areas : tab === "cecos" ? cecos : [];
  const setFn = tab === "empresas" ? onUpdateEmpresas : tab === "areas" ? onUpdateAreas : onUpdateCecos;
  const readonly = tab === "clasificaciones" || tab === "causales";

  const handleAdd = () => {
    if (!newVal.trim() || readonly) return;
    setFn([...current, { id: genId(), valor: newVal.trim(), activo: true }]);
    setNewVal("");
  };

  const TABS = [
    { key: "empresas", label: "Empresas" }, { key: "areas", label: "Áreas" },
    { key: "cecos", label: "CECOs" }, { key: "clasificaciones", label: "Clasificaciones" },
    { key: "causales", label: "Causales" },
  ] as const;

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold">Catálogos</h1><p className="text-sm text-muted-foreground">Gestión de catálogos parametrizables</p></div>
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1.5 overflow-x-auto">
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-sm rounded-lg transition-all whitespace-nowrap ${tab === t.key ? "bg-primary text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>{t.label}</button>)}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {!readonly ? (
          <div className="p-4 border-b border-border flex gap-3">
            <input value={newVal} onChange={e => setNewVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="Nuevo valor..." className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"><Plus size={14} /> Agregar</button>
          </div>
        ) : (
          <div className="px-5 py-3 border-b border-border bg-amber-50"><p className="text-xs text-amber-700 flex items-center gap-1.5"><AlertCircle size={13} /> Catálogo de solo lectura — definido por el sistema.</p></div>
        )}
        <div className="divide-y divide-border">
          {tab === "clasificaciones" && CLASIFICACIONES.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="text-sm">{c}</span>
                {c === "Otro" && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">Requiere observación</span>}
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">Activo</span>
            </div>
          ))}
          {tab === "causales" && CAUSALES.map((c, i) => (
            <div key={i} className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="text-sm font-medium">{c.valor}</span>
                  {c.valor === "Otras causales" && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">Requiere descripción</span>}
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">Activo</span>
              </div>
              {c.descripcion && <p className="text-xs text-muted-foreground ml-8">{c.descripcion}</p>}
            </div>
          ))}
          {!readonly && current.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${item.activo ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className={`text-sm ${item.activo ? "text-foreground" : "text-muted-foreground line-through"}`}>{item.valor}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFn(current.map(i => i.id === item.id ? { ...i, activo: !i.activo } : i))}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${item.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {item.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => setFn(current.filter(i => i.id !== item.id))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {!readonly && current.length === 0 && <div className="px-5 py-8 text-center text-muted-foreground text-sm">Sin registros. Agregue el primero.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onSave, onClose }: {
  user: AuthUser; onSave: (u: AuthUser) => void; onClose: () => void;
}) {
  const [form, setForm] = useState(user);
  const set = (k: keyof AuthUser, v: string | boolean) => setForm((f: AuthUser) => ({ ...f, [k]: v }));
  const ROLES_LIST: Rol[] = ["Administrador", "Solicitante", "Aprobador Área", "Costos", "HSE & S"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">Editar Usuario</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {[["Nombre completo", "nombre"], ["Usuario de ingreso", "email"], ["Correo corporativo", "correoCoporativo"]] .map(([label, key]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">{label}</label>
              <input value={(form as any)[key]} onChange={e => set(key as keyof AuthUser, e.target.value)} className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Rol</label>
            <select value={form.rol} onChange={e => set("rol", e.target.value as Rol)} className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none">
              {ROLES_LIST.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="text-sm text-foreground">Estado de la cuenta</span>
            <button onClick={() => set("activo", !form.activo)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${form.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              <ToggleLeft size={13} /> {form.activo ? "Activo" : "Inactivo"}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-all">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"><Save size={14} /> Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AuthUser;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");
    void onConfirm(password)
      .then(() => onClose())
      .catch((e: any) => setError(e?.message || "No se pudo actualizar la contraseña"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Cambiar contraseña</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Usuario: <span className="font-semibold text-foreground">{user.nombre}</span>
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Nueva contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Confirmar contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-all">Cancelar</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-all">
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UsersView ────────────────────────────────────────────────────────────────

function UsersView({
  users,
  onUpdate,
  onDelete,
  onChangePassword,
}: {
  users: AuthUser[];
  onUpdate: (u: AuthUser) => void;
  onDelete: (id: string) => void; // Cambia a number si tu id es numérico
  onChangePassword: (id: string, password: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [changingPassword, setChangingPassword] = useState<AuthUser | null>(null);

  const ROL_STYLE: Record<string, { color: string; bg: string }> = {
    "Administrador": { color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
    "Solicitante": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    "Aprobador Área": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    "Costos": { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    "HSE & S": { color: "text-lime-700", bg: "bg-lime-50 border-lime-200" },
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<AuthUser | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Usuarios Registrados</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} usuario(s) en el sistema
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 text-left">
              {["Usuario", "Correo", "Rol", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const rc = ROL_STYLE[u.rol] || {
                color: "text-slate-600",
                bg: "bg-slate-50 border-slate-200",
              };

              return (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          u.activo ? "bg-primary" : "bg-slate-300"
                        }`}
                      >
                        <span className="text-white text-xs font-bold">
                          {u.nombre
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      </div>

                      <span className="font-medium">{u.nombre}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                    {u.correoCoporativo}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${rc.color} ${rc.bg}`}
                    >
                      {u.rol}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    {u.activo ? (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Inactivo
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 flex items-center gap-2">
                    <button
                      onClick={() => setChangingPassword(u)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Cambiar contraseña"
                    >
                      <Lock size={14} />
                    </button>
                    <button
                      onClick={() => setEditing(u)}
                      className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => {
                        setUsuarioEliminar(u);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showDeleteModal && usuarioEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

              <div className="p-8">

                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 size={38} className="text-red-600" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center">
                  Eliminar Usuario
                </h2>

                <p className="text-center text-muted-foreground mt-2">
                  Está a punto de eliminar el siguiente usuario.
                </p>

                <div className="mt-6 bg-slate-50 border rounded-xl p-4 space-y-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nombre
                    </p>

                    <p className="font-semibold">
                      {usuarioEliminar.nombre}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Correo
                    </p>

                    <p className="text-sm font-mono">
                      {usuarioEliminar.correoCoporativo}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rol
                    </p>

                    <p className="font-medium">
                      {usuarioEliminar.rol}
                    </p>
                  </div>

                </div>

                <div className="mt-6 border border-red-200 bg-red-50 rounded-xl p-4">

                  <p className="font-semibold text-red-700 mb-3">
                    ⚠ Esta acción ocasionará:
                  </p>

                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>• El usuario perderá el acceso al sistema.</li>
                    <li>• No podrá iniciar sesión.</li>
                    <li>• No podrá crear ni gestionar actas.</li>
                  </ul>

                  <p className="mt-4 text-red-700 font-medium">
                    Esta acción no se puede deshacer.
                  </p>

                </div>

                <div className="flex justify-center gap-3 mt-8">

                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUsuarioEliminar(null);
                    }}
                    className="px-5 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => {
                      onDelete(usuarioEliminar.id);
                      setShowDeleteModal(false);
                      setUsuarioEliminar(null);
                    }}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Eliminar Usuario
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {editing && (
        <EditUserModal
          user={editing}
          onSave={(u) => {
            onUpdate(u);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {changingPassword && (
        <ChangePasswordModal
          user={changingPassword}
          onConfirm={(password) => onChangePassword(changingPassword.id, password)}
          onClose={() => setChangingPassword(null)}
        />
      )}
    </div>
  );
}

// ─── Auth Types & Data ────────────────────────────────────────────────────────

const ROLES_REGISTER = [
  { rol: "Solicitante" as Rol,      icon: Users,      descripcion: "Crear y enviar actas de destrucción",        color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  { rol: "Aprobador Área" as Rol,   icon: UserCheck,  descripcion: "Primer nivel de aprobación del proceso",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  { rol: "Costos" as Rol,           icon: DollarSign, descripcion: "Revisión y aprobación de costos",            color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  { rol: "HSE & S" as Rol,          icon: Leaf,       descripcion: "Aprobación final y cierre del proceso",      color: "text-lime-700",   bg: "bg-lime-50 border-lime-200" },
  { rol: "Administrador" as Rol,    icon: ShieldCheck,descripcion: "Gestión completa del sistema y usuarios",    color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
];

const APPROVER_ROLES: Rol[] = ["Aprobador Área", "Costos", "HSE & S"];

// ─── LoginView ────────────────────────────────────────────────────────────────

function LoginView({
  onLogin,
  onGoRegister,
  showPendingApprovalModal,
  onClosePendingModal,
}: {
  onLogin: (u: AuthUser) => void;
  onGoRegister: () => void;
  showPendingApprovalModal: boolean;
  onClosePendingModal: () => void;
}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_USERS_RAW.find(u => u.email === email.trim().toLowerCase() && u.password === password);
      if (found) {
        const { password: _, ...user } = found;
        onLogin(user);
      } else {
        setError("Correo o contraseña incorrectos.");
      }
      setLoading(false);
    }, 600);
  };

  const iCls = "w-full px-4 py-3 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Left */}
      <div className="hidden lg:flex w-[46%] bg-sidebar flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/5" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full border border-white/5" />
        <div>
          <div className="flex flex-col gap-1.5 mb-12">
            <ImageWithFallback src={logoFull} alt="Humax" className="h-9 w-auto object-contain object-left" style={{ filter: "invert(0)" }} />
            <p className="text-white/40 text-xs tracking-wide uppercase">Gestión de Destrucción</p>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">Sistema de Actas<br />de Destrucción</h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-72">Plataforma empresarial para la gestión, trazabilidad y control de actas de destrucción de productos y materiales farmacéuticos.</p>
        </div>
        <div className="space-y-3">
          {[["Flujo de aprobaciones multi-etapa", "Área → Costos → HSE&S"],["Notificaciones en tiempo real","En plataforma y correo corporativo"],["Trazabilidad completa","Historial inmutable de cada decisión"]].map(([l, s]) => (
            <div key={l} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} className="text-primary" /></div>
              <div><p className="text-white/80 text-sm font-medium leading-none mb-0.5">{l}</p><p className="text-white/35 text-xs">{s}</p></div>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs">© 2025 Humax — Todos los derechos reservados</p>
      </div>
      {/* Right */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center mb-8 lg:hidden">
            <ImageWithFallback src={logoFull} alt="Humax" className="h-8 w-auto object-contain" />
          </div>
          <div className="mb-8"><h2 className="text-2xl font-bold text-foreground">Bienvenido</h2><p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Correo electrónico</label>
              <div className="relative"><Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@humax.co" className={iCls + " pl-10"} /></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={iCls + " pl-10 pr-10"} />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle size={14} />{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2">
              {loading ? <><RefreshCw size={15} className="animate-spin" />Verificando...</> : "Iniciar sesión"}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-3">¿No tienes cuenta?</p>
            <button onClick={onGoRegister} className="w-full py-2.5 border border-border bg-white text-sm font-medium text-foreground rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-primary" /> Registrarse
            </button>
          </div>
          <div className="mt-5 p-3.5 bg-secondary/60 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Cuentas de demostración:</p>
            <div className="space-y-1">
              {MOCK_USERS_RAW.map(u => (
                <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors flex items-center justify-between group">
                  <span className="text-xs text-foreground truncate">{u.email}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors ml-2 flex-shrink-0">{u.rol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showPendingApprovalModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">

          <div className="p-8 text-center">

              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">

                  <CheckCircle
                      size={42}
                      className="text-emerald-600"
                  />

              </div>

              <h2 className="text-2xl font-bold mb-3">
                  ¡Registro recibido!
              </h2>

              <p className="text-muted-foreground leading-7">

                  Gracias por registrarte en el
                  <strong> Sistema de Gestión de Destrucción.</strong>

                  <br /><br />

                  Tu cuenta ha sido creada correctamente y
                  actualmente se encuentra
                  <strong> pendiente de aprobación</strong>
                  por parte del administrador.

                  <br /><br />

                  Una vez sea aprobada podrás iniciar sesión.

                  <br /><br />

                  Si el acceso tarda más de lo esperado,
                  comunícate con el administrador del sistema.

              </p>

              <button
                  onClick={onClosePendingModal}
                  className="mt-8 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90"
              >
                  Entendido
              </button>

          </div>

      </div>

  </div>
  )}
    </div>
  );
}

// ─── RegisterView ─────────────────────────────────────────────────────────────

function RegisterView({ onRegister, onGoLogin }: { onRegister: (u: AuthUser) => void; onGoLogin: () => void }) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [correoCoporativo, setCorreoCoporativo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const needsCorpEmail = rol && APPROVER_ROLES.includes(rol as Rol);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo inválido";
    if (needsCorpEmail && !correoCoporativo.trim()) e.correoCoporativo = "Obligatorio para este rol";
    if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    if (!rol) e.rol = "Selecciona un rol";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  setLoading(true);

  setTimeout(() => {

    const newUser: AuthUser = {
      id: genId(),
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      correoCoporativo: correoCoporativo || email,
      rol: rol as Rol,
      activo: false, // 👈 IMPORTANTE: queda pendiente de aprobación
      cargo: cargo.trim()
    };

    setSuccess(true);

    setTimeout(() => {

      onRegister(newUser);

      // Volver al Login
      onGoLogin();

    }, 1200);

    setLoading(false);

  }, 700);
};

  const iCls = (err?: string) => `w-full px-4 py-3 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground ${err ? "border-red-400 bg-red-50/50" : "border-border"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onGoLogin} className="p-2 rounded-xl border border-border bg-white hover:bg-secondary transition-all text-muted-foreground">
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col gap-0.5">
            <ImageWithFallback src={logoFull} alt="Humax" className="h-7 w-auto object-contain object-left" />
            <p className="text-xs text-muted-foreground">Crear cuenta nueva</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-7 py-6 border-b border-border bg-secondary/30">
            <h2 className="text-xl font-bold">Registro de usuario</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Completa los datos para acceder al sistema</p>
          </div>
          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            {/* Datos personales */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([["Nombre completo*", "text", nombre, setNombre, "nombre"], ["usuario de ingreso*", "usuario", email, setEmail, "email"]] as any[]).map(([label, type, val, fn, key]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">{label}</label>
                    <input type={type} value={val} onChange={(e: any) => fn(e.target.value)} className={iCls(errors[key])} placeholder={label.replace("*", "")} />
                    {errors[key] && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors[key]}</p>}
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Correo corporativo{needsCorpEmail ? " *" : ""}</label>
                  <input type="email" value={correoCoporativo} onChange={e => setCorreoCoporativo(e.target.value)} className={iCls(errors.correoCoporativo)} placeholder="usuario@empresa.co" />
                  {needsCorpEmail && <p className="text-xs text-blue-600 flex items-center gap-1"><Mail size={11} />Requerido para recibir notificaciones de aprobación</p>}
                  {errors.correoCoporativo && <p className="text-xs text-red-600">{errors.correoCoporativo}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Contraseña*</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={iCls(errors.password) + " pl-9 pr-9"} placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Confirmar contraseña*</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPwd ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} className={iCls(errors.confirm) + " pl-9"} placeholder="Repite la contraseña" />
                  </div>
                  {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
                </div>
              </div>
            </div>
            {/* Rol */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Selecciona tu rol *</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES_REGISTER.map(({ rol: r, icon: Icon, descripcion, color, bg }) => {
                  const selected = rol === r;
                  return (
                    <button key={r} type="button" onClick={() => setRol(r)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${selected ? `${bg} border-current ${color}` : "bg-white border-border hover:border-primary/30 hover:bg-secondary/40"}`}>
                      {selected && <div className="absolute top-2.5 right-2.5"><CheckCircle size={14} className={color} /></div>}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${selected ? bg : "bg-secondary"}`}><Icon size={16} className={selected ? color : "text-muted-foreground"} /></div>
                      <p className={`text-sm font-semibold leading-tight mb-1 ${selected ? color : "text-foreground"}`}>{r}</p>
                      <p className={`text-xs leading-snug ${selected ? "opacity-70" : "text-muted-foreground"}`}>{descripcion}</p>
                    </button>
                  );
                })}
              </div>
              {errors.rol && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={11} />{errors.rol}</p>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
              <button type="button" onClick={onGoLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Volver al inicio de sesión</button>
              <button type="submit" disabled={loading || success}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm ${success ? "bg-emerald-600 text-white" : "bg-primary text-white hover:bg-primary/90"} disabled:opacity-70`}>
                {success ? <><CheckCircle size={15} />Cuenta creada</> : loading ? <><RefreshCw size={15} className="animate-spin" />Creando...</> : <><Sparkles size={15} />Crear cuenta</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const REVIEWER_ROLES: Rol[] = ["Aprobador Área", "Costos", "HSE & S"];

function Sidebar({ view, setView, onNewActa, pendientesCount, collapsed, setCollapsed, currentUser, onLogout, isDark, onToggleTheme }: {
  view: ViewName; setView: (v: ViewName) => void; onNewActa: () => void;
  pendientesCount: number; collapsed: boolean; setCollapsed: (v: boolean) => void;
  currentUser: AuthUser | null; onLogout: () => void;
  isDark: boolean; onToggleTheme: () => void;
}) {
  const rol = currentUser?.rol;
  const isReviewer = rol ? REVIEWER_ROLES.includes(rol) : false;
  const isAdmin = rol === "Administrador";
  const isSolicitante = rol === "Solicitante";
  const isHSE = rol === "HSE & S";

  type NavItem = { id: ViewName; icon: React.ElementType; label: string; badge?: number };
  const nav: NavItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(isReviewer ? [{ id: "aprobaciones" as ViewName, icon: CheckCircle, label: "Aprobaciones", badge: pendientesCount }] : []),
    ...(isSolicitante ? [
      { id: "actas" as ViewName, icon: FileText, label: "Mis Actas" },
      { id: "nueva-acta" as ViewName, icon: PlusCircle, label: "Nueva Acta" },
    ] : []),
    ...(isHSE ? [{ id: "actas" as ViewName, icon: FileText, label: "Consultar Actas" }] : []),
    ...(isAdmin ? [
      { id: "actas" as ViewName, icon: FileText, label: "Actas" },
      { id: "usuarios" as ViewName, icon: Users, label: "Usuarios" },
      { id: "catalogos" as ViewName, icon: Settings, label: "Catálogos" },
    ] : []),
  ];

  return (
    <aside className={`flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border">
        {!collapsed ? (
          <>
            <div className="flex flex-col gap-1">
              <ImageWithFallback src={logoFull} alt="Humax" className="h-6 w-auto object-contain object-left" style={{ filter: "invert(0)" }} />
              <p className="text-[9px] text-sidebar-foreground/40 tracking-widest uppercase">Actas de Destrucción</p>
            </div>
            <button onClick={() => setCollapsed(true)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"><ChevronLeft size={15} /></button>
          </>
        ) : (
          <ImageWithFallback src={logoIcon} alt="Humax" className="h-7 w-auto object-contain mx-auto" style={{ filter: "invert(0)" }} />
        )}
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {nav.map(item => {
          const active = view === item.id || (item.id === "actas" && view === "ver-acta");
          return (
            <button key={`${item.id}-${item.label}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${active ? "bg-sidebar-accent text-white font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"} ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
              onClick={() => item.id === "nueva-acta" ? onNewActa() : setView(item.id)}>
              <item.icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {item.badge != null && item.badge > 0 && (
                <span className={`${collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto"} min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold px-1`}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {collapsed ? (
        <div className="p-3 border-t border-sidebar-border flex flex-col items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-white/90 hover:text-white hover:bg-sidebar-accent transition-all"
            title="Alternar modo oscuro"
            aria-label="Alternar modo oscuro"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={() => setCollapsed(false)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"><ChevronRight size={15} /></button>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer" onClick={onLogout} title="Cerrar sesión">
            <span className="text-white text-xs font-bold">{currentUser?.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("") || "U"}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={onToggleTheme}
            className="w-full mb-2 flex items-center gap-2 px-2 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/35 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-all"
            aria-label="Alternar modo oscuro"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span className="text-xs">{isDark ? "Modo claro" : "Modo oscuro"}</span>
          </button>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors group" onClick={onLogout}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{currentUser?.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("") || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.nombre}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{currentUser?.rol}</p>
            </div>
            <LogOut size={13} className="text-sidebar-foreground/50 group-hover:text-white/70 flex-shrink-0 transition-colors" />
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [authScreen, setAuthScreen] = useState<"login" | "register" | "app">("login");
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);
  const [view, setViewRaw] = useState<ViewName>("dashboard");
  const [actas, setActas] = useState<Acta[]>([]);
  const [selectedActaId, setSelectedActaId] = useState<string | null>(null);
  const [isNewActa, setIsNewActa] = useState(false);
  const [draftActa, setDraftActa] = useState<Acta | null>(null);
  const [empresas, setEmpresas] = useState<CatalogoItem[]>(EMPRESAS_SEED);
  const [areas, setAreas] = useState<CatalogoItem[]>(AREAS_SEED);
  const [cecos, setCecos] = useState<CatalogoItem[]>(CECOS_SEED);
  const [collapsed, setCollapsed] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const { isDark, toggleTheme } = useThemeMode();

  const loadAllActas = async () => {
    let page = 1;
    let totalPages = 1;
    const all: Acta[] = [];

    do {
      const res = await api.listActas({ page, pageSize: 200 });
      all.push(...(res.items as Acta[]));
      totalPages = res.meta.totalPages;
      page += 1;
    } while (page <= totalPages);

    setActas(all);
  };

  const loadAllUsers = async () => {
    let page = 1;
    let totalPages = 1;
    const all: AuthUser[] = [];

    do {
      const res = await api.listUsers({ page, pageSize: 200 });
      all.push(...res.items);
      totalPages = res.meta.totalPages;
      page += 1;
    } while (page <= totalPages);

    setRegisteredUsers(all);
  };

  const loadUserNotifications = async (userId?: string) => {
    if (!userId) {
      setNotificaciones([]);
      return;
    }

    let page = 1;
    let totalPages = 1;
    const all: Notificacion[] = [];

    do {
      const res = await api.listNotifications({ userId, page, pageSize: 200 });
      all.push(...(res.items as Notificacion[]));
      totalPages = res.meta.totalPages;
      page += 1;
    } while (page <= totalPages);

    setNotificaciones(all);
  };

  useEffect(() => {
    let active = true;

    Promise.all([loadAllUsers(), loadAllActas()]).catch(() => {
      if (!active) return;
      setRegisteredUsers([]);
      setActas([]);
    });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    loadUserNotifications(currentUser?.id).catch(() => {
      setNotificaciones([]);
    });
  }, [currentUser?.id]);

  const rol = currentUser?.rol as Rol | undefined;
  const isReviewer = rol ? REVIEWER_ROLES.includes(rol) : false;
  const isAdmin = rol === "Administrador";
  const isSolicitante = rol === "Solicitante";
  const isHSE = rol === "HSE & S";

  const handleLogin = async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    if (!user.activo) throw new Error("Tu usuario esta pendiente de aprobacion.");
    setCurrentUser(user);
    setAuthScreen("app");
  };

  const handleRegister = async (input: RegisterInput) => {
    await api.register(input);
    await loadAllUsers();
  };
  const handleLogout = () => { setCurrentUser(null); setAuthScreen("login"); setViewRaw("dashboard"); };

if (authScreen === "login")
  return (
    <LoginPage
      onLogin={handleLogin}
      onGoRegister={() => setAuthScreen("register")}
      showPendingApprovalModal={showPendingApprovalModal}
      onClosePendingModal={() => setShowPendingApprovalModal(false)}
      demoUsers={[]}
      isDark={isDark}
      onToggleTheme={toggleTheme}
    />
  );

  if (authScreen === "register")
  return (
    <RegisterPage
      onRegister={handleRegister}
      onGoLogin={() => setAuthScreen("login")}
      onRegistered={() => {
        setAuthScreen("login");
        setShowPendingApprovalModal(true);
      }}
    />
  );


  const setView = (v: ViewName) => {
    if (v === "nueva-acta") { handleNewActa(); return; }
    setViewRaw(v);
    if (v !== "ver-acta") {
      setSelectedActaId(null);
      setIsNewActa(false);
      setDraftActa(null);
    }
  };

  const handleViewActa = (id: string) => {
    setSelectedActaId(id);
    setIsNewActa(false);
    setDraftActa(null);
    setViewRaw("ver-acta");
  };

  const handleNewActa = () => {
    if (!isSolicitante && !isAdmin) return;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    setDraftActa({
      id: `draft-${genId()}`,
      numeroActa: "Sin guardar",
      fechaSolicitud: today,
      solicitanteNombre: currentUser?.nombre || "",
      solicitanteCargo: currentUser?.cargo || "",
      solicitanteCorreo: currentUser?.correoCoporativo || "",
      datosGeneralesBloqueados: false,
      areaGeneradora: "",
      ceco: "",
      tipoDestruccion: "",
      observaciones: "",
      estado: "Borrador",
      productos: [],
      historial: [],
      fechaCreacion: now,
      creadoPorId: currentUser?.id || "",
      creadoPorNombre: currentUser?.nombre || "",
      pasoPorCostos: false,
    });
    setSelectedActaId(null);
    setIsNewActa(true);
    setViewRaw("ver-acta");
  };

  const handleSubmitForApproval = (actaId: string) => {
    if (!currentUser) return;
    void (async () => {
      await api.submitActa(actaId, { id: currentUser.id, nombre: currentUser.nombre, rol: currentUser.rol });
      await loadAllActas();
      await loadUserNotifications(currentUser.id);
    })();
  };

  const handleApprovalAction = (actaId: string, action: ApprovalAction, comentario: string) => {
    if (!currentUser) return;
    void (async () => {
      await api.decideActa(actaId, {
        action,
        comentario,
        user: { id: currentUser.id, nombre: currentUser.nombre, rol: currentUser.rol },
      });
      await loadAllActas();
      await loadUserNotifications(currentUser.id);
    })();
  };

  const handleSaveActa = (updated: Acta) => {
    void (async () => {
      if (isNewActa) {
        const { acta } = await api.createActa({
          solicitanteNombre: updated.solicitanteNombre,
          solicitanteCargo: updated.solicitanteCargo,
          solicitanteCorreo: updated.solicitanteCorreo,
          areaGeneradora: updated.areaGeneradora,
          ceco: updated.ceco,
          tipoDestruccion: updated.tipoDestruccion,
          observaciones: updated.observaciones,
          creadoPorId: currentUser?.id || updated.creadoPorId || "",
        });
        await loadAllActas();
        setDraftActa(null);
        setSelectedActaId(String(acta.id));
        setIsNewActa(false);
        setViewRaw("ver-acta");
        return;
      }

      await api.updateActa(updated.id, updated);
      await loadAllActas();
    })();
  };
  const handleDeleteActa = (id: string) => {
    void (async () => {
      await api.deleteActa(id);
      await loadAllActas();
    })();
  };
  const handleUpdateUser = (updated: AuthUser) => {
    void (async () => {
      await api.updateUser(updated.id, updated);
      await loadAllUsers();
    })();
  };
  const handleDeleteUser = (id: string) => {
    void (async () => {
      await api.deleteUser(id);
      await loadAllUsers();
    })();
  };
  const handleChangeUserPassword = async (id: string, password: string) => {
    const selectedId = String(id || "").trim();
    const res = await api.changeUserPassword(selectedId, password);
    if (String(res?.user?.id || "").trim() !== selectedId) {
      throw new Error("No coincide el usuario actualizado. Intenta nuevamente.");
    }
  };

  const myNotifs = notificaciones.filter(n => n.paraUserId === currentUser?.id);
  const markNotifRead = (nid: string) => {
    if (!currentUser?.id) return;
    void (async () => {
      await api.markNotificationRead(nid);
      await loadUserNotifications(currentUser.id);
    })();
  };

  const estadoPendienteDelRol: Estado | undefined =
    rol === "Aprobador Área" ? "Pendiente Área" :
    rol === "Costos" ? "Pendiente Costos" :
    rol === "HSE & S" ? "Pendiente HSE&S" : undefined;

  const pendientesCount = estadoPendienteDelRol
    ? actas.filter(a => a.estado === estadoPendienteDelRol).length
    : 0;

  const canEditActa = (a: Acta) => {
    if (a.estado === "Finalizada" || isRejection(a.estado)) return false;
    if (isAdmin || isHSE) return true;
    if (isSolicitante && a.creadoPorId === currentUser?.id && a.estado === "Borrador") return true;
    return false;
  };

  const breadcrumb = view === "dashboard" ? ["Dashboard"]
    : view === "actas" ? ["Actas", isSolicitante ? "Mis Actas" : "Consulta"]
    : view === "ver-acta" ? ["Actas", isNewActa ? "Nueva Acta" : actas.find(a => a.id === selectedActaId)?.numeroActa || "Detalle"]
    : view === "aprobaciones" ? ["Aprobaciones", rol || ""]
    : view === "catalogos" ? ["Configuración", "Catálogos"]
    : view === "usuarios" ? ["Administración", "Usuarios"]
    : ["Nueva Acta"];

  const selectedActa = isNewActa ? draftActa : actas.find(a => a.id === selectedActaId);

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <Sidebar view={view} setView={setView} onNewActa={handleNewActa} pendientesCount={pendientesCount}
        collapsed={collapsed} setCollapsed={setCollapsed} currentUser={currentUser} onLogout={handleLogout}
        isDark={isDark} onToggleTheme={toggleTheme} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={13} />}
                <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-secondary hover:scale-105 transition-all"
              aria-label="Alternar modo oscuro"
            >
              <span className={`transition-transform duration-300 ${isDark ? "rotate-180" : "rotate-0"}`}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-secondary border border-border rounded-lg text-muted-foreground">
              <User size={11} /> {currentUser?.nombre} · <span className="font-medium text-foreground">{currentUser?.rol}</span>
            </span>
            <NotificationBell notificaciones={myNotifs} onRead={markNotifRead} onView={handleViewActa} />
            {isReviewer && pendientesCount > 0 && (
              <button onClick={() => setView("aprobaciones")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all">
                <Clock size={13} /> {pendientesCount} pendiente(s)
              </button>
            )}
            
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && (
            rol === "HSE & S" ? <DashboardHSE actas={actas} /> :
            rol === "Costos" ? <DashboardCostos actas={actas} /> :
            <DashboardGeneral actas={actas} onView={handleViewActa} />
          )}
          {view === "actas" && (
            <ActasListView
              actas={actas}
              onView={handleViewActa}
              onNew={isSolicitante || isAdmin ? handleNewActa : undefined}
              onDelete={isAdmin ? handleDeleteActa : undefined}
            />
          )}
          {view === "ver-acta" && selectedActa && (
            <ActaView
              acta={selectedActa} empresas={empresas} areas={areas} cecos={cecos}
              isNew={isNewActa} canEdit={canEditActa(selectedActa)}
              onSave={handleSaveActa} onBack={() => setView("actas")}
              onUpdateEstado={handleSubmitForApproval}
            />
          )}
          {view === "nueva-acta" && null}
          {view === "aprobaciones" && isReviewer && rol && (
            <AprobacionesView
              actas={actas} rolActual={rol}
              onAction={handleApprovalAction}
              onView={handleViewActa}
            />
          )}
          {view === "catalogos" && isAdmin && (
            <CatalogosView empresas={empresas} areas={areas} cecos={cecos}
              onUpdateEmpresas={setEmpresas} onUpdateAreas={setAreas} onUpdateCecos={setCecos} />
          )}
          {view === "usuarios" && isAdmin && (
            <UsersView
              users={registeredUsers}
              onUpdate={handleUpdateUser}
              onDelete={handleDeleteUser}
              onChangePassword={handleChangeUserPassword}
            />
          )}
        </main>
      </div>
    </div>
  );
}
