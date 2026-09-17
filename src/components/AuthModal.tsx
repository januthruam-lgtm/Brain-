import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  X,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import { evaluatePasswordStrength, hashPassword } from "../utils/security";
import { sendEmailNotification } from "../services/gmailNotification";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, name?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(password);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage({ text: "Por favor, informe seu nome completo ou apelido.", type: "error" });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setMessage({ text: "Informe um endereço de e-mail válido (ex: seu.nome@email.com).", type: "error" });
      return;
    }

    if (password.length < 8) {
      setMessage({ text: "A senha deve ter no mínimo 8 caracteres para sua segurança.", type: "error" });
      return;
    }

    if (strength.score < 2) {
      setMessage({
        text: "Sua senha é muito fraca. Combine letras maiúsculas, minúsculas, números ou símbolos.",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "As senhas digitadas não coincidem. Verifique a confirmação.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists
      const existingUserRaw = localStorage.getItem("auth_user_" + trimmedEmail);
      if (existingUserRaw) {
        setMessage({ text: "Já existe uma conta cadastrada com este e-mail. Faça login!", type: "error" });
        setLoading(false);
        return;
      }

      // Hash password using SHA-256
      const passwordHash = await hashPassword(password);
      const userRecord = {
        name: trimmedName,
        email: trimmedEmail,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("auth_user_" + trimmedEmail, JSON.stringify(userRecord));
      
      // Save active session
      localStorage.setItem("studyhub_last_email", trimmedEmail);

      // Trigger Gmail notification asynchronously
      sendEmailNotification({
        toEmail: trimmedEmail,
        userName: trimmedName,
        type: "register",
      }).catch(console.warn);

      setMessage({
        text: "Conta criada com sucesso e protegida com criptografia! Notificação enviada ao Gmail.",
        type: "success",
      });

      setTimeout(() => {
        setLoading(false);
        onLogin(trimmedEmail, trimmedName);
      }, 700);
    } catch (err) {
      setMessage({ text: "Erro ao registrar conta. Tente novamente.", type: "error" });
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      setMessage({ text: "Informe um endereço de e-mail válido.", type: "error" });
      return;
    }

    if (!password) {
      setMessage({ text: "Digite sua senha para entrar.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await hashPassword(password);
      const userRecordRaw = localStorage.getItem("auth_user_" + trimmedEmail);

      if (!userRecordRaw) {
        // Fallback check for legacy user keys
        const legacyUser = localStorage.getItem("user_" + trimmedEmail);
        if (legacyUser) {
          try {
            const parsed = JSON.parse(legacyUser);
            if (parsed.password === password) {
              // Upgrade to hashed record
              localStorage.setItem(
                "auth_user_" + trimmedEmail,
                JSON.stringify({
                  name: parsed.name || trimmedEmail.split("@")[0],
                  email: trimmedEmail,
                  passwordHash,
                  createdAt: new Date().toISOString(),
                })
              );
              onLogin(trimmedEmail, parsed.name);
              setLoading(false);
              return;
            }
          } catch {
            // ignore
          }
        }

        setMessage({
          text: "Nenhuma conta encontrada com este e-mail. Crie sua conta acima!",
          type: "error",
        });
        setLoading(false);
        return;
      }

      const userRecord = JSON.parse(userRecordRaw);
      if (userRecord.passwordHash !== passwordHash) {
        setMessage({ text: "Senha incorreta. Verifique os dados digitados.", type: "error" });
        setLoading(false);
        return;
      }

      localStorage.setItem("studyhub_last_email", trimmedEmail);

      // Trigger Gmail notification asynchronously
      sendEmailNotification({
        toEmail: trimmedEmail,
        userName: userRecord.name || trimmedEmail.split("@")[0],
        type: "login",
      }).catch(console.warn);

      setMessage({ text: "Login realizado com sucesso! Notificação enviada ao Gmail.", type: "success" });

      setTimeout(() => {
        setLoading(false);
        onLogin(trimmedEmail, userRecord.name);
      }, 500);
    } catch (err) {
      setMessage({ text: "Erro ao autenticar. Tente novamente.", type: "error" });
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-screen"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[#111111] text-white p-6 sm:p-9 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/10 transition-all relative overflow-hidden my-auto">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e2ff31] opacity-10 blur-[100px] pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center text-xl text-[#e2ff31] shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight uppercase not-italic text-[#18b05f]">Brain Studio</h2>
              <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
                Autenticação Segura
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#181818] rounded-2xl border border-white/5 mb-6 relative z-10">
          <button
            type="button"
            id="tab-register-btn"
            onClick={() => {
              setMode("register");
              setMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Criar Nova Conta</span>
          </button>
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Já Tenho Conta</span>
          </button>
        </div>

        {/* Forms */}
        <form
          onSubmit={mode === "register" ? handleRegister : handleLogin}
          className="space-y-3.5 relative z-10"
        >
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Seu Nome Completo ou Apelido
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Clara Santos"
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:border-[#e2ff31] focus:ring-1 focus:ring-[#e2ff31] outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:border-[#e2ff31] focus:ring-1 focus:ring-[#e2ff31] outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {mode === "register" ? "Criar Senha Segura" : "Sua Senha"}
              </label>
              {mode === "register" && password && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    strength.score >= 3 ? "text-black bg-[#e2ff31]" : "text-neutral-300 bg-white/10"
                  }`}
                >
                  {strength.label}
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
              <input
                id="auth-password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Mínimo 8 caracteres variados" : "Digite sua senha"}
                className="w-full pl-11 pr-11 py-3 bg-[#181818] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:border-[#e2ff31] focus:ring-1 focus:ring-[#e2ff31] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-neutral-500 hover:text-white p-1"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Security Meter for Registration */}
            {mode === "register" && password.length > 0 && (
              <div className="mt-2.5 p-3 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                {/* Visual Progress Bars */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      strength.score >= 1 ? strength.color : "bg-white/10"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      strength.score >= 2 ? strength.color : "bg-white/10"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      strength.score >= 3 ? strength.color : "bg-white/10"
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      strength.score >= 4 ? strength.color : "bg-white/10"
                    }`}
                  />
                </div>

                {/* Checklist of security requirements */}
                <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-400 pt-1">
                  <div className={`flex items-center gap-1.5 ${strength.hasLength ? "text-[#e2ff31]" : ""}`}>
                    <span className="text-xs">{strength.hasLength ? "✓" : "○"}</span>
                    <span>8+ Caracteres</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      strength.hasUpper && strength.hasLower ? "text-[#e2ff31]" : ""
                    }`}
                  >
                    <span className="text-xs">{strength.hasUpper && strength.hasLower ? "✓" : "○"}</span>
                    <span>Maiúsculas & Minúsculas</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.hasNumber ? "text-[#e2ff31]" : ""}`}>
                    <span className="text-xs">{strength.hasNumber ? "✓" : "○"}</span>
                    <span>Pelo menos 1 Número</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.hasSpecial ? "text-[#e2ff31]" : ""}`}>
                    <span className="text-xs">{strength.hasSpecial ? "✓" : "○"}</span>
                    <span>Símbolo Especial (@, #, $)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
                <input
                  id="auth-confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha exatamente"
                  className={`w-full pl-11 pr-11 py-3 bg-[#181818] border rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-600 outline-none transition ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-500 focus:border-red-500"
                      : confirmPassword && confirmPassword === password
                      ? "border-[#e2ff31] focus:border-[#e2ff31]"
                      : "border-white/10 focus:border-[#e2ff31]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-neutral-500 hover:text-white p-1"
                  title={showConfirmPassword ? "Ocultar confirmação" : "Ver confirmação"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {message && (
            <div
              id="auth-feedback-box"
              className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 ${
                message.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/20"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full py-3.5 bg-[#e2ff31] hover:bg-[#d4f222] text-black font-extrabold rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Processando...</span>
            ) : mode === "register" ? (
              <>
                <span>Cadastrar Conta Segura</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Entrar no Brain Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security Note */}
          <div className="pt-2 text-center space-y-1">
            <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#e2ff31]" />
              <span>Notificações automáticas de cadastro e login enviadas via Gmail</span>
            </p>
            <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Senhas protegidas com criptografia SHA-256</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
