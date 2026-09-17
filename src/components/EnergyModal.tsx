import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Users,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Clock,
  BatteryCharging,
} from "lucide-react";
import confetti from "canvas-confetti";
import { UserProfile } from "../types";
import { calculateEnergyStatus, formatTimeRemaining } from "../utils/energy";
import { TabId } from "./Sidebar";

interface EnergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onNavigateTab: (tab: TabId) => void;
  onRefillWithXp?: (amount: number, cost: number) => boolean;
  onRequestTeamEnergy?: () => void;
}

export const EnergyModal: React.FC<EnergyModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigateTab,
  onRefillWithXp,
  onRequestTeamEnergy,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isBuying, setIsBuying] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const status = calculateEnergyStatus(user);
    setSecondsLeft(status.nextRechargeSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const updated = calculateEnergyStatus(user);
          return updated.nextRechargeSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentEnergy = user.energy ?? 10;
  const maxEnergy = user.maxEnergy ?? 10;
  const isFull = currentEnergy >= maxEnergy;
  const percentage = Math.min(100, Math.round((currentEnergy / maxEnergy) * 100));

  const handleBuy = (amount: number, cost: number) => {
    if (user.xp < cost) {
      alert("XP insuficiente! Acumule mais XP vencendo duelos ou estudando.");
      return;
    }
    setIsBuying(true);
    if (onRefillWithXp) {
      const ok = onRefillWithXp(amount, cost);
      if (ok) {
        confetti({ particleCount: 60, spread: 60 });
      }
    }
    setIsBuying(false);
  };

  const handleGoToGuild = () => {
    onClose();
    onNavigateTab("guilds");
    if (onRequestTeamEnergy) {
      onRequestTeamEnergy();
    }
  };

  const handleGoToStore = () => {
    onClose();
    onNavigateTab("store");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121212] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-yellow-400/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#e2ff31]/5 blur-[80px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Zap className="w-5 h-5 fill-yellow-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg sm:text-xl">Banco de Energias ⚡</h3>
              <p className="text-xs text-neutral-400">Necessário para jogar duelos, quizzes e lições</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Energy Status Card */}
        <div className="bg-[#171717] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                Sua Energia Atual
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {currentEnergy}
                </span>
                <span className="text-sm font-semibold text-neutral-400">/ {maxEnergy} ⚡</span>
              </div>
            </div>

            <div className="text-right">
              {isFull ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <BatteryCharging className="w-3.5 h-3.5" /> Energia Cheia
                </span>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-yellow-400" /> +1 ⚡ em:
                  </div>
                  <div className="text-sm font-mono font-bold text-yellow-400">
                    {formatTimeRemaining(secondsLeft)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentEnergy > 3
                    ? "bg-gradient-to-r from-yellow-500 to-[#e2ff31]"
                    : currentEnergy > 0
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0 ⚡</span>
              <span>Regeneração: 1 ⚡ a cada 10 min</span>
              <span>{maxEnergy} ⚡</span>
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-3 relative z-10">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Formas de Obter Mais Energia:
          </span>

          {/* Option 1: Request from Guild */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-yellow-500/20 hover:border-yellow-400/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Pedir à Equipe</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-400/30">
                    Cooperação
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Peça até 5⚡ grátis para os colegas da sua equipe no mural
                </p>
              </div>
            </div>

            <button
              onClick={handleGoToGuild}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs px-4 py-2.5 rounded-full transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md"
            >
              <span>{user.guildId ? "Pedir Agora" : "Ver Equipes"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Buy with XP */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e2ff31]/10 border border-[#e2ff31]/20 flex items-center justify-center text-[#e2ff31] shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Recarga Rápida com XP</span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Troque seu XP acumulado por recargas instantâneas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBuy(5, 50)}
                disabled={isBuying || isFull || user.xp < 50}
                className="bg-[#222222] hover:bg-[#e2ff31] text-neutral-200 hover:text-black border border-white/10 hover:border-[#e2ff31] font-bold text-xs px-3 py-2 rounded-full transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="50 XP por +5 ⚡"
              >
                +5 ⚡ (50 XP)
              </button>
              <button
                onClick={() => handleBuy(10, 90)}
                disabled={isBuying || isFull || user.xp < 90}
                className="bg-[#222222] hover:bg-[#e2ff31] text-neutral-200 hover:text-black border border-white/10 hover:border-[#e2ff31] font-bold text-xs px-3 py-2 rounded-full transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="90 XP por Tanque Cheio (+10 ⚡)"
              >
                Full ⚡ (90 XP)
              </button>
            </div>
          </div>
        </div>

        {/* Costs Information */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>⚔️ Duelos 1v1: 1⚡</span>
          <span>🎮 Quizzes / Jogos: 1⚡</span>
          <span>📖 Lições Socráticas: 1⚡</span>
        </div>
      </div>
    </div>
  );
};
