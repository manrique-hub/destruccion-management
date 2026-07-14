import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, DollarSign, Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck, Sparkles, UserCheck, Users } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoFull from "@/imports/logoa-3.png";
import type { RegisterInput, Rol } from "@/app/types/auth";
import { APPROVER_ROLES } from "@/app/types/auth";

const ROLES_REGISTER = [
  { rol: "Solicitante" as Rol, icon: Users, descripcion: "Crear y enviar actas de destrucción", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { rol: "Aprobador Área" as Rol, icon: UserCheck, descripcion: "Primer nivel de aprobación del proceso", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { rol: "Costos" as Rol, icon: DollarSign, descripcion: "Revisión y aprobación de costos", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  { rol: "HSE & S" as Rol, icon: Leaf, descripcion: "Aprobación final y cierre", color: "text-lime-700", bg: "bg-lime-50 border-lime-200" },
  { rol: "Administrador" as Rol, icon: ShieldCheck, descripcion: "Gestión completa del sistema", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
];

const AREAS_APROBADOR = [
  "Producción",
  "Control de Calidad",
  "Logística",
  "Almacén",
  "I+D",
];

interface RegisterPageProps {
  onRegister: (input: RegisterInput) => Promise<void>;
  onGoLogin: () => void;
  onRegistered: () => void;
}

export function RegisterPage({ onRegister, onGoLogin, onRegistered }: RegisterPageProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [correoCoporativo, setCorreoCoporativo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [areaAprobador, setAreaAprobador] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const needsCorpEmail = useMemo(() => rol && APPROVER_ROLES.includes(rol as Rol), [rol]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!email.trim()) e.email = "Requerido";
    if (needsCorpEmail && !correoCoporativo.trim()) e.correoCoporativo = "Obligatorio para este rol";
    if (rol === "Aprobador Área" && !areaAprobador) e.areaAprobador = "Debes seleccionar el area";
    if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    if (!rol) e.rol = "Selecciona un rol";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onRegister({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        correoCoporativo: correoCoporativo.trim() || email.trim().toLowerCase(),
        password,
        rol: rol as Rol,
        areaAprobador: rol === "Aprobador Área" ? areaAprobador : undefined,
      });
      onRegistered();
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, api: err?.message || "No se pudo registrar" }));
    } finally {
      setLoading(false);
    }
  };

  const iCls = (err?: string) => `w-full px-4 py-3 text-sm bg-white dark:bg-zinc-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground ${err ? "border-red-400 bg-red-50/50" : "border-border"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onGoLogin} className="p-2 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-secondary transition-all text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mt-0.5">El acceso queda pendiente de aprobación del administrador</p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  ["Nombre completo*", "text", nombre, setNombre, "nombre"],
                  ["Usuario de ingreso*", "text", email, setEmail, "email"],
                ] as any[]).map(([label, type, val, fn, key]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">{label}</label>
                    <input type={type} value={val} onChange={(e: any) => fn(e.target.value)} className={iCls(errors[key])} placeholder={label.replace("*", "")} />
                    {errors[key] && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors[key]}</p>}
                  </div>
                ))}

                {needsCorpEmail && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">Correo corporativo *</label>
                    <input type="email" value={correoCoporativo} onChange={(e) => setCorreoCoporativo(e.target.value)} className={iCls(errors.correoCoporativo)} placeholder="usuario@empresa.co" />
                    <p className="text-xs text-blue-600 flex items-center gap-1"><Mail size={11} />Requerido para notificaciones de aprobación</p>
                    {errors.correoCoporativo && <p className="text-xs text-red-600">{errors.correoCoporativo}</p>}
                  </div>
                )}

                {rol === "Aprobador Área" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">Área de aprobación *</label>
                    <select
                      value={areaAprobador}
                      onChange={(e) => setAreaAprobador(e.target.value)}
                      className={iCls(errors.areaAprobador)}
                    >
                      <option value="">Selecciona un área</option>
                      {AREAS_APROBADOR.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    {errors.areaAprobador && <p className="text-xs text-red-600">{errors.areaAprobador}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Contraseña*</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={iCls(errors.password) + " pl-9 pr-9"} placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">Confirmar contraseña*</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPwd ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={iCls(errors.confirm) + " pl-9"} placeholder="Repite la contraseña" />
                  </div>
                  {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Selecciona tu rol *</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES_REGISTER.map(({ rol: r, icon: Icon, descripcion, color, bg }) => {
                  const selected = rol === r;
                  return (
                    <button key={r} type="button" onClick={() => setRol(r)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${selected ? `${bg} border-current ${color}` : "bg-white dark:bg-zinc-900 border-border hover:border-primary/30 hover:bg-secondary/40"}`}>
                      {selected && <div className="absolute top-2.5 right-2.5"><CheckCircle size={14} className={color} /></div>}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${selected ? bg : "bg-secondary"}`}><Icon size={16} className={selected ? color : "text-muted-foreground"} /></div>
                      <p className={`text-sm font-semibold leading-tight mb-1 ${selected ? color : "text-foreground"}`}>{r}</p>
                      <p className={`text-xs leading-snug ${selected ? "opacity-70" : "text-muted-foreground"}`}>{descripcion}</p>
                    </button>
                  );
                })}
              </div>
              {errors.rol && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={11} />{errors.rol}</p>}
              {errors.api && <p className="text-xs text-red-600 mt-2">{errors.api}</p>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border gap-4">
              <button type="button" onClick={onGoLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Volver al inicio de sesión</button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-70">
                {loading ? "Creando..." : <><Sparkles size={15} />Crear cuenta</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
