import { useState } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, Moon, RefreshCw, Sparkles, Sun } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoFull from "@/imports/logoa-3.png";
import type { AuthUser } from "@/app/types/auth";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoRegister: () => void;
  showPendingApprovalModal: boolean;
  onClosePendingModal: () => void;
  demoUsers: Array<{ id: string; email: string; password: string; rol: string }>;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function LoginPage({
  onLogin,
  onGoRegister,
  showPendingApprovalModal,
  onClosePendingModal,
  demoUsers,
  isDark,
  onToggleTheme,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const raw = String(err?.message || "");
      if (err?.code === "ACCOUNT_PENDING_APPROVAL" || raw.toLowerCase().includes("pendiente")) {
        setError("Tu usuario aun esta pendiente de aprobacion. Si lo necesitas urgente, comunicate con el administrador de la aplicacion para habilitar tu ingreso.");
      } else {
        setError(raw || "No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  const iCls =
    "w-full px-4 py-3 text-sm bg-white/90 dark:bg-zinc-900/90 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_20%_20%,rgba(30,77,216,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(5,150,105,0.12),transparent_35%)]" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="hidden lg:flex w-[46%] bg-sidebar flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-24 right-8 w-44 h-44 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-16 left-6 w-48 h-48 rounded-full bg-emerald-400/15 blur-3xl animate-pulse" style={{ animationDelay: "450ms" }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/5 animate-pulse" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-white/5 animate-pulse" style={{ animationDelay: "180ms" }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full border border-white/5 animate-pulse" style={{ animationDelay: "360ms" }} />
        <div>
          <div className="flex flex-col gap-1.5 mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
            <ImageWithFallback src={logoFull} alt="Humax" className="h-9 w-auto object-contain object-left" style={{ filter: "invert(0)" }} />
            <p className="text-white/40 text-xs tracking-wide uppercase">Gestión de Destrucción</p>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-150">Sistema de Actas<br />de Destrucción</h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-72 animate-in fade-in slide-in-from-left-4 duration-500 delay-300">Plataforma empresarial para trazabilidad y control integral del flujo de aprobación.</p>
        </div>
        <div className="space-y-3">
          {["Flujo multi-etapa", "Historial inmutable", "Notificación web y correo"].map((label, idx) => (
            <div key={label} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${380 + idx * 140}ms` }}>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} className="text-primary" /></div>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card/90 backdrop-blur-md p-6 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-500">
          <div className="flex items-center justify-between mb-8 animate-in fade-in duration-500">
            <ImageWithFallback src={logoFull} alt="Humax" className="h-8 w-auto object-contain" />
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-secondary hover:scale-105 transition-all"
              aria-label="Alternar modo"
            >
              <span className={`transition-transform duration-300 ${isDark ? "rotate-180" : "rotate-0"}`}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </span>
            </button>
          </div>

          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <h2 className="text-2xl font-bold text-foreground">Bienvenido</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Usuario de ingreso</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="usuario@humax.co" className={iCls + " pl-10"} />
              </div>
            </div>
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={iCls + " pl-10 pr-10"} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300"><AlertCircle size={14} className="mt-0.5" />{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
              {loading ? <><RefreshCw size={15} className="animate-spin" />Verificando...</> : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-3">¿No tienes cuenta?</p>
            <button onClick={onGoRegister} className="w-full py-2.5 border border-border bg-white dark:bg-zinc-900 text-sm font-medium text-foreground rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-primary" /> Registrarse
            </button>
          </div>

          <div className="mt-5 p-3.5 bg-secondary/60 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Cuentas de demostración:</p>
            <div className="space-y-1 max-h-44 overflow-auto">
              {demoUsers.map((u) => (
                <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group">
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                <CheckCircle size={42} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">¡Registro recibido!</h2>
              <p className="text-muted-foreground leading-7">
                Tu cuenta fue creada y quedó pendiente de aprobación del administrador.
                Si necesitas ingreso urgente, comunicate con el administrador de la aplicacion para habilitar tu acceso.
              </p>
              <button onClick={onClosePendingModal} className="mt-8 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
