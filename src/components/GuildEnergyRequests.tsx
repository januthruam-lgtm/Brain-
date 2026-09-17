import React, { useState, useEffect } from "react";
import {
  Zap,
  Users,
  Gift,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";
import confetti from "canvas-confetti";
import { EnergyRequest, GuildInfo, UserProfile } from "../types";
import {
  getGuildEnergyRequests,
  requestGuildEnergy,
  donateGuildEnergy,
} from "../services/guildService";

interface GuildEnergyRequestsProps {
  guild: GuildInfo;
  user: UserProfile;
  onRewardXp?: (amount: number) => void;
  onAddEnergy?: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

export const GuildEnergyRequests: React.FC<GuildEnergyRequestsProps> = ({
  guild,
  user,
  onRewardXp,
  onAddEnergy,
  onShowToast,
}) => {
  const [requests, setRequests] = useState<EnergyRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [donatingId, setDonatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!guild?.id) return;
    loadRequests();

    // Poll every 5s for live donation updates
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [guild?.id]);

  const loadRequests = async () => {
    if (!guild?.id) return;
    const reqs = await getGuildEnergyRequests(guild.id);
    setRequests(reqs);
    setIsLoading(false);
  };

  const handleCreateRequest = async () => {
    if (!guild?.id || isRequesting) return;

    setIsRequesting(true);
    try {
      const res = await requestGuildEnergy(guild.id, user, 5);
      if (res.success && res.energyRequests) {
        setRequests(res.energyRequests);
        confetti({ particleCount: 50, spread: 50 });
        onShowToast(res.message || "Pedido de 5 ⚡ enviado para sua equipe!");
      } else if (res.message) {
        onShowToast(res.message);
      }
    } catch (e) {
      console.warn("Erro ao pedir energia:", e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDonate = async (request: EnergyRequest) => {
    if (!guild?.id || donatingId) return;

    setDonatingId(request.id);
    try {
      const res = await donateGuildEnergy(guild.id, request.id, user, 1);
      if (res.success) {
        if (res.energyRequests) {
          setRequests(res.energyRequests);
        }
        if (res.donorXpReward && onRewardXp) {
          onRewardXp(res.donorXpReward);
        }
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.7 },
        });
        onShowToast(res.message || `Você doou 1 ⚡ para ${request.userName} e ganhou +25 XP!`);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (e) {
      console.warn("Erro ao doar:", e);
    } finally {
      setDonatingId(null);
    }
  };

  const normUserEmail = user.email.toLowerCase();
  const myActiveRequest = requests.find(
    (r) =>
      r.userEmail.toLowerCase() === normUserEmail &&
      r.status === "active" &&
      new Date(r.expiresAt).getTime() > Date.now()
  );

  return (
    <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/25 flex items-center justify-center text-yellow-400 shrink-0 shadow-inner">
            <Zap className="w-6 h-6 fill-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Banco de Energias da Equipe
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                Cooperação de Equipe
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Peça energias aos colegas e ganhe <strong className="text-[#e2ff31]">+25 XP</strong> por cada doação enviada!
            </p>
          </div>
        </div>

        {/* Request Energy Button */}
        <div>
          {myActiveRequest ? (
            <div className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Pedido Ativo ({myActiveRequest.receivedAmount}/{myActiveRequest.requestedAmount} ⚡)</span>
            </div>
          ) : (
            <button
              onClick={handleCreateRequest}
              disabled={isRequesting}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-5 py-2.5 rounded-full transition flex items-center gap-2 shadow-lg shadow-yellow-400/10 cursor-pointer disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Pedir +5 ⚡ para a Equipe</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Energy Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            <span>Carregando pedidos de energia...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#181818] border border-white/5 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
              <HeartHandshake className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-sm font-semibold text-white">Nenhum pedido de energia no momento</p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Precisa de energias para jogar duelos ou lições? Clique no botão acima para pedir 5⚡ para sua equipe!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {requests.map((req) => {
              const isMine = req.userEmail.toLowerCase() === normUserEmail;
              const isCompleted = req.status === "completed" || req.receivedAmount >= req.requestedAmount;
              const progressPct = Math.min(100, Math.round((req.receivedAmount / req.requestedAmount) * 100));

              // Check how much this user has donated to this request
              const userDonations = req.donors
                ?.filter((d) => d.donorEmail.toLowerCase() === normUserEmail)
                .reduce((acc, cur) => acc + (cur.amount || 1), 0) || 0;

              const canDonate = !isMine && !isCompleted && userDonations < 2;

              return (
                <div
                  key={req.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isMine
                      ? "bg-[#181818] border-yellow-400/40 ring-1 ring-yellow-400/20"
                      : isCompleted
                      ? "bg-[#141414] border-white/5 opacity-60"
                      : "bg-[#161616] border-white/10 hover:border-yellow-400/30 shadow-md"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center font-bold text-yellow-400 text-sm">
                          {req.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {isMine ? "Você" : req.userName}
                            </span>
                            {isMine && (
                              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                                Seu Pedido
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400">
                            Pediu {req.requestedAmount} ⚡ para batalhar
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-yellow-400">
                          {req.receivedAmount} / {req.requestedAmount} ⚡
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-yellow-500 to-[#e2ff31]"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Donors list */}
                    {req.donors && req.donors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">
                          Ajudaram:
                        </span>
                        {req.donors.map((d, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-black/40 border border-white/10 text-neutral-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Zap className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            <span>{d.donorName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pedido Completo (+{req.receivedAmount} ⚡)</span>
                      </div>
                    ) : isMine ? (
                      <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Aguardando doações dos colegas...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-[#e2ff31] font-semibold flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> Recompensa: +25 XP
                        </span>

                        <button
                          onClick={() => handleDonate(req)}
                          disabled={!canDonate || donatingId === req.id}
                          className={`px-4 py-2 rounded-full font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                            canDonate
                              ? "bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/20"
                              : "bg-[#222222] text-neutral-500 border border-white/5 cursor-not-allowed"
                          }`}
                        >
                          {donatingId === req.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Doando...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-black" />
                              <span>{userDonations > 0 ? "Doar Mais 1 ⚡" : "Doar 1 ⚡"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
