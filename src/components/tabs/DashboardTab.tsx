import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  Target,
  Trophy,
  Swords,
  Brain,
  ArrowRight,
  Flame,
  CheckCircle2,
  BookOpen,
  ArrowUpRight,
  Layers,
  Users,
  ShieldCheck,
  Globe,
  X,
  Mail,
  Coins,
  Download,
  QrCode,
  ExternalLink,
  Store,
  Play,
  Square,
  Package,
  Vote,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Html5Qrcode } from "html5-qrcode";
import { UserProfile, TrackModule, GuildInfo, GachaCard, DailyMission } from "../../types";
import { TabId } from "../Sidebar";
import {
  RealUser,
  getStoredRealUsers,
  syncRealUserWithServer,
  getUserInitials,
} from "../../services/realUsers";
import { CURATED_APP_TRACKS } from "../../services/subjectTrackGenerator";
import { calculateEnergyStatus, formatTimeRemaining } from "../../utils/energy";
import {
  triggerCoinExplosion,
  playCoinCascade,
  playLevelUpSound,
  playCoinSound,
  playToneEffect,
  toggleAmbientSound,
  stopAmbientSound,
} from "../../utils/audio";

const BANCO_CARDS: GachaCard[] = [
  { id: 1, nome: "Mascote IFES", raridade: "comum", emoji: "🦊" },
  { id: 2, nome: "Cafezinho da Biblioteca", raridade: "raro", emoji: "☕" },
  { id: 3, nome: "Kimono Gladiadores BJJ", raridade: "epico", emoji: "🥋" },
  { id: 4, nome: "Diploma Nota 10", raridade: "lendario", emoji: "📜" },
];

const DEFAULT_MISSIONS: DailyMission[] = [
  {
    id: "foco",
    desc: "Completar 1 Sessão de Foco (Pomodoro)",
    meta: 1,
    progresso: 0,
    premio: 100,
    concluida: false,
  },
  {
    id: "boss",
    desc: "Atacar o Chefão Semestral 1 vez",
    meta: 1,
    progresso: 0,
    premio: 60,
    concluida: false,
  },
];

interface DashboardTabProps {
  user: UserProfile;
  modules: TrackModule[];
  guild?: GuildInfo;
  onNavigate: (tab: TabId) => void;
  onOpenActiveLesson: () => void;
  onOpenSubjectModal?: () => void;
  onRewardXp?: (amount: number) => void;
  onRewardCoins?: (amount: number, event?: React.MouseEvent) => void;
  onUpgradeEnergyLimit?: () => void;
  onInstallPwa?: () => void;
  pwaInstallable?: boolean;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  user,
  modules,
  guild,
  onNavigate,
  onOpenActiveLesson,
  onOpenSubjectModal,
  onRewardXp,
  onRewardCoins,
  onUpgradeEnergyLimit,
  onInstallPwa,
  pwaInstallable,
  onUpdateUser,
}) => {
  const safeModules = Array.isArray(modules) && modules.length > 0 ? modules : [];
  const activeModule = safeModules.find((m) => m.status === "active") || safeModules[0] || {
    id: 1,
    title: "Módulo 1: Fundamentos de Estudo",
    subtitle: "Inicie sua jornada no Brain Studio",
    category: "Geral",
    status: "active" as const,
    xpReward: 100,
    lessons: [],
  };
  const completedCount = safeModules.filter((m) => m.status === "completed").length;
  const progressPercent = safeModules.length > 0 ? Math.round((completedCount / safeModules.length) * 100) : 0;

  const [realUsers, setRealUsers] = useState<RealUser[]>(() => getStoredRealUsers(user));
  const [showUsersModal, setShowUsersModal] = useState(false);

  // Live Energy Timer Calculation
  const [energySecondsLeft, setEnergySecondsLeft] = useState<number>(0);
  const [energyProgressPercent, setEnergyProgressPercent] = useState<number>(100);

  // QR Code Scanner State
  const [qrScanning, setQrScanning] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);

  // Pomodoro Focus Timer State
  const [tempoFoco, setTempoFoco] = useState<number>(25 * 60);
  const [timerAtivo, setTimerAtivo] = useState<boolean>(false);
  const [tipoSomAtivo, setTipoSomAtivo] = useState<"chuva" | "ruido" | null>(null);
  const [materiaSelecionada, setMateriaSelecionada] = useState<string>("Prática / Esportes");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Guild Selection State
  const guildaAtual = user.guilda || "Clube de Eventos Esportivos";
  const guildaXP = user.guildaXP || 450;
  const materiasHoje = user.materiasEstudadasHoje || [];
  const comboAtivo = materiasHoje.length >= 2;

  // Gacha Alert / Feedback State
  const [gachaFeedback, setGachaFeedback] = useState<string | null>(null);

  // Enquete feedback
  const [enqueteFeedback, setEnqueteFeedback] = useState<string | null>(null);

  // Missões Diárias State
  const missoes = user.missoes && user.missoes.length > 0 ? user.missoes : DEFAULT_MISSIONS;

  // Boss HP (defaults to 1000)
  const bossHP = user.bossHP ?? 1000;

  useEffect(() => {
    const updateTimer = () => {
      const status = calculateEnergyStatus(user);
      const isFull = (user.energy ?? 10) >= (user.maxEnergy ?? 10);
      if (isFull) {
        setEnergySecondsLeft(0);
        setEnergyProgressPercent(100);
      } else {
        setEnergySecondsLeft(status.nextRechargeSeconds);
        const totalInterval = 10 * 60; // 600s
        const elapsed = Math.max(0, totalInterval - status.nextRechargeSeconds);
        setEnergyProgressPercent(Math.min(100, Math.round((elapsed / totalInterval) * 100)));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user.energy, user.maxEnergy, user.lastEnergyRechargeTime]);

  useEffect(() => {
    // Initial fetch from storage and sync with server
    const currentList = getStoredRealUsers(user);
    setRealUsers(currentList);

    syncRealUserWithServer(user).then((synced) => {
      if (synced && synced.length > 0) {
        setRealUsers(synced);
      }
    });
  }, [user]);

  // Upgrade Energy Cost (Exponential Formula: 100 * 1.15^(level-1))
  const upgradeCost = Math.floor(100 * Math.pow(1.15, Math.max(1, user.level || 1) - 1));

  // Pomodoro timer tick effect
  useEffect(() => {
    if (timerAtivo) {
      timerRef.current = setInterval(() => {
        setTempoFoco((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerAtivo(false);
            stopAmbientSound();
            setTipoSomAtivo(null);
            playLevelUpSound();
            confetti({ particleCount: 120, spread: 80 });

            // Reward on completion
            if (onRewardCoins) onRewardCoins(150);

            // Calculate XP with combo + passives
            let mult = 1.0;
            const currentMateria = materiaSelecionada;
            const updatedMaterias = materiasHoje.includes(currentMateria)
              ? materiasHoje
              : [...materiasHoje, currentMateria];

            if (updatedMaterias.length >= 2) {
              mult += 0.3; // Combo Holístico +30%
            }
            if (user.passivas?.bonusXp) {
              mult += 0.2; // Passiva Mestre XP +20%
            }

            const baseXP = 80;
            const finalXP = Math.round(baseXP * mult);

            if (onRewardXp) onRewardXp(finalXP);

            // Progress focus mission
            const updatedMissoes = missoes.map((m) => {
              if (m.id === "foco") {
                const novoProgresso = m.progresso + 1;
                return {
                  ...m,
                  progresso: novoProgresso,
                  concluida: novoProgresso >= m.meta,
                };
              }
              return m;
            });

            // Update user state with new materias, guildaXP and missions
            const newGuildaXP = (user.guildaXP || 450) + finalXP;
            onUpdateUser?.({
              materiasEstudadasHoje: updatedMaterias,
              guildaXP: newGuildaXP,
              missoes: updatedMissoes,
            });

            if (updatedMaterias.length >= 2 && !comboAtivo) {
              alert(
                "🧪 COMBO HOLÍSTICO ATIVADO! Você estudou matérias de áreas diferentes hoje (+30% XP em todas as ações)."
              );
            }

            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    timerAtivo,
    materiaSelecionada,
    materiasHoje,
    comboAtivo,
    user.passivas,
    user.guildaXP,
    missoes,
    onRewardCoins,
    onRewardXp,
    onUpdateUser,
  ]);

  const handleTrocarGuilda = (novaGuilda: string) => {
    onUpdateUser?.({ guilda: novaGuilda });
    playToneEffect(600);
  };

  const handleSimularGanharXp = () => {
    if (onRewardXp) {
      onRewardXp(100);
    }
    confetti({
      particleCount: 80,
      spread: 60,
      colors: ["#ffe600", "#2ecc71", "#3b82f6"],
    });
    playLevelUpSound();
  };

  const handleResgatarRecompensa = (e: React.MouseEvent) => {
    triggerCoinExplosion(e, 10, "hud-moedas");
    if (onRewardCoins) {
      onRewardCoins(150, e);
    }
  };

  const handleBuyEnergyUpgrade = () => {
    if (onUpgradeEnergyLimit) {
      onUpgradeEnergyLimit();
    }
  };

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setQrScanning(true);
    setQrResult("A processar a imagem do QR Code...");

    try {
      const html5QrCode = new Html5Qrcode("dashboard-qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      setQrResult(decodedText);
      setQrScanning(false);
      confetti({ particleCount: 80, spread: 70 });
      playCoinCascade(6);
      if (onRewardXp) onRewardXp(60);
      if (onRewardCoins) onRewardCoins(100);
      try {
        html5QrCode.clear();
      } catch (err) {
        console.warn(err);
      }
    } catch (err) {
      console.warn("QR Error:", err);
      setQrScanning(false);
      setQrResult("Não foi possível ler o QR Code. Certifique-se de que a imagem é nítida.");
    } finally {
      e.target.value = "";
    }
  };

  // Boss Raid Attack Action
  const handleAtacarBoss = () => {
    const energyAvailable = user.energy ?? 10;
    if (energyAvailable < 10) {
      alert("⚡ Você precisa de pelo menos 10 de Energia para atacar o Boss!");
      return;
    }

    const dano = 25;
    const novoHP = Math.max(0, bossHP - dano);
    const novaEnergia = energyAvailable - 10;

    playToneEffect(400);

    // Progress boss mission
    const updatedMissoes = missoes.map((m) => {
      if (m.id === "boss") {
        const novoProgresso = m.progresso + 1;
        return {
          ...m,
          progresso: novoProgresso,
          concluida: novoProgresso >= m.meta,
        };
      }
      return m;
    });

    if (onRewardXp) onRewardXp(20);

    if (novoHP === 0) {
      confetti({ particleCount: 150, spread: 90 });
      playLevelUpSound();
      if (onRewardCoins) onRewardCoins(300);
      onUpdateUser?.({
        bossHP: 1000,
        energy: novaEnergia,
        missoes: updatedMissoes,
      });
      alert("🎉 PARABÉNS! O Trabalho Final foi derrotado! Você ganhou +300 Moedas!");
    } else {
      onUpdateUser?.({
        bossHP: novoHP,
        energy: novaEnergia,
        missoes: updatedMissoes,
      });
    }
  };

  // Pomodoro Timer Controls
  const handleIniciarEstudo = () => {
    setTempoFoco(25 * 60);
    setTimerAtivo(true);
    playToneEffect(600);
  };

  const handleCancelarEstudo = () => {
    setTimerAtivo(false);
    stopAmbientSound();
    setTipoSomAtivo(null);
    setTempoFoco(25 * 60);
  };

  const handleAlternarSomAmbiente = (tipo: "chuva" | "ruido") => {
    const ligado = toggleAmbientSound(tipo);
    setTipoSomAtivo(ligado ? tipo : null);
  };

  // Buff Restaurante Universitário
  const handleAtivarBuffRU = () => {
    const duracao = 60 * 60 * 1000; // 1 hora
    onUpdateUser?.({
      buffRU: true,
      buffRUTimestamp: Date.now() + duracao,
    });
    playLevelUpSound();
    confetti({ particleCount: 60, spread: 60 });
    alert("🥗 Buff do RU Ativado! Sua regeneração de energia aumentou em +25% pela próxima hora!");
  };

  // Gacha System
  const handleAbrirGacha = (e: React.MouseEvent) => {
    const moedasAtuais = user.coins ?? 250;
    if (moedasAtuais < 100) {
      alert("🪙 Você precisa de 100 Moedas para abrir o Baú de Cards!");
      return;
    }

    const cartasPossiveis = BANCO_CARDS;
    const sorteada = cartasPossiveis[Math.floor(Math.random() * cartasPossiveis.length)];

    const cardsAtuais = user.cardsColecionados || [];
    const jaPossui = cardsAtuais.includes(sorteada.id);
    const novosCards = jaPossui ? cardsAtuais : [...cardsAtuais, sorteada.id];

    onUpdateUser?.({
      coins: moedasAtuais - 100,
      cardsColecionados: novosCards,
    });

    playToneEffect(1200);
    confetti({ particleCount: 100, spread: 80 });
    setGachaFeedback(
      jaPossui
        ? `Você tirou ${sorteada.emoji} ${sorteada.nome} (Já colecionado!)`
        : `NOVO CARD! ${sorteada.emoji} ${sorteada.nome} (${sorteada.raridade.toUpperCase()})`
    );
  };

  // Enquete Rápida
  const handleResponderEnquete = (opcao: string) => {
    if (user.enqueteRespondida) {
      alert("Você já respondeu à enquete de hoje!");
      return;
    }

    onUpdateUser?.({
      enqueteRespondida: true,
    });

    if (onRewardCoins) onRewardCoins(80);
    if (onRewardXp) onRewardXp(30);
    playLevelUpSound();
    confetti({ particleCount: 70, spread: 60 });
    setEnqueteFeedback(`Obrigado pelo voto em "${opcao}"! Recompensa de +80 🪙 e +30 XP creditada!`);
  };

  // Talent Tree Purchases
  const handleComprarPassiva = (tipo: "regen" | "bonusXp", custo: number) => {
    const moedasAtuais = user.coins ?? 250;
    if (moedasAtuais < custo) {
      alert(`🪙 Você precisa de ${custo} Moedas para desbloquear este talento!`);
      return;
    }

    const passivasAtuais = user.passivas || {};
    if (passivasAtuais[tipo]) {
      alert("Você já desbloqueou este talento passivo!");
      return;
    }

    onUpdateUser?.({
      coins: moedasAtuais - custo,
      passivas: {
        ...passivasAtuais,
        [tipo]: true,
      },
    });

    playLevelUpSound();
    confetti({ particleCount: 80, spread: 70 });
  };

  // Formatted Pomodoro string
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const xpNeeded = 100;
  const xpProgresso = (user.xp ?? 0) % xpNeeded;
  const buffRUAtivo = user.buffRU && user.buffRUTimestamp && Date.now() < user.buffRUTimestamp;

  return (
    <section id="tab-dashboard" className="p-5 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Bento Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Hero Bento Card (Span 8) */}
        <div className="lg:col-span-8 bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden group shadow-xl">
          {/* Subtle Lime Ambient Spotlight */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#e2ff31] opacity-10 blur-[110px] -mr-28 -mt-28 pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="uppercase text-[11px] tracking-widest text-[#e2ff31] font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e2ff31] animate-pulse" />
                Pedagogia Cognitiva • Lumina AI
              </div>
              <span className="px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                2026 / Sequencial
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-light text-white leading-[1.1] tracking-tight max-w-xl">
              Construa conhecimento com raciocínio socrático.
            </h1>

            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-lg font-normal">
              Olá, <span className="text-white font-semibold">{user.name.split(" ")[0]}</span>! Seu ambiente de estudos está pronto. Inicie a trilha de aprendizado, converse com a tutora socrática ou envie seus próprios materiais de estudo.
            </p>

            {/* Pill Tags & Subject Selector Prompt */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3.5 py-1 rounded-full border border-white/10 text-[11px] uppercase tracking-wider text-neutral-300 bg-white/5">
                Trilha: {completedCount}/{modules.length} Concluídos
              </span>
              {user.selectedSubjects && user.selectedSubjects.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium">Matérias:</span>
                  {user.selectedSubjects.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/20 text-[11px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                  {user.selectedSubjects.length > 3 && (
                    <span className="text-[10px] text-neutral-400">+{user.selectedSubjects.length - 3}</span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-amber-400 font-medium">
                  Nenhuma matéria configurada
                </span>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={onOpenActiveLesson}
              className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <span>
                {completedCount === 0 ? "Iniciar" : "Continuar"}:{" "}
                {activeModule?.title ? (activeModule.title.split(":")[1] || activeModule.title) : "Trilha de Estudos"}
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>

            {onOpenSubjectModal && (
              <button
                onClick={onOpenSubjectModal}
                className="bg-[#1a1a1a] hover:bg-[#252525] text-[#e2ff31] border border-[#e2ff31]/30 hover:border-[#e2ff31] px-5 py-3.5 rounded-full font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
                title="Diga ao app quais matérias você precisa estudar"
              >
                <span>📚</span>
                <span>Quais matérias preciso estudar?</span>
              </button>
            )}

            <button
              onClick={() => onNavigate("lumina")}
              className="bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white px-5 py-3.5 rounded-full font-medium text-xs sm:text-sm transition border border-white/10 flex items-center gap-2"
            >
              <Brain className="w-4 h-4 text-[#e2ff31]" />
              <span>Sessão com a Lumina</span>
            </button>
          </div>
        </div>

        {/* Bento Accent Card - Electric Lime (Span 4) */}
        <div className="lg:col-span-4 bg-[#e2ff31] text-black rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
              <Zap className="w-5 h-5 fill-[#e2ff31] text-[#e2ff31]" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold italic tracking-tighter">{user.xp}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">XP Acumulado</div>
            </div>
          </div>

          <div className="space-y-2 my-4">
            <div className="text-2xl font-bold leading-tight tracking-tight">
              Nível {user.level} Alcançado
            </div>
            <p className="text-xs font-medium text-black/80 leading-snug">
              Complete lições e vença duelos 1v1 para subir de nível e desbloquear cosméticos na loja.
            </p>
          </div>

          <button
            onClick={() => onNavigate("store")}
            className="w-full bg-black text-white hover:bg-neutral-900 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
          >
            <span>Ver Recompensas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Curated Subjects & Tracks Showcase Section */}
      <div className="bg-[#111111] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e2ff31]" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#e2ff31]">
                Matérias Fornecidas pelo App
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trilhas & Matérias Recomendadas para Estudo
            </h3>
            <p className="text-xs text-neutral-400">
              O Brain Studio fornece currículos completos estruturados. Escolha uma trilha pronta com 1 clique ou personalize suas matérias.
            </p>
          </div>

          {onOpenSubjectModal && (
            <button
              onClick={onOpenSubjectModal}
              className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ver Todas as Matérias</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Grid of App Provided Tracks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURATED_APP_TRACKS.slice(0, 3).map((track) => {
            const isSelected = track.subjects.every((s) => user.selectedSubjects?.includes(s));
            return (
              <div
                key={track.id}
                onClick={onOpenSubjectModal}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1f2411] border-[#e2ff31] ring-1 ring-[#e2ff31]/30"
                    : "bg-[#161616] border-white/5 hover:border-white/20 hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{track.icon}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#e2ff31]">
                      {track.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{track.name}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {track.subjects.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-300">
                        {s}
                      </span>
                    ))}
                    {track.subjects.length > 3 && (
                      <span className="text-[10px] text-neutral-500 px-1 py-0.5 font-mono">
                        +{track.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {track.subjects.length} matérias
                  </span>
                  <span className="text-[#e2ff31] font-bold flex items-center gap-1">
                    {isSelected ? "Ativa" : "Ativar"} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Second Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Module Progress Bento Box (Span 4) */}
        <div
          onClick={() => onNavigate("sequence")}
          className="md:col-span-4 bg-[#111111] border border-white/5 rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between hover:border-white/15 transition cursor-pointer group shadow-md"
        >
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              Trilha em Sequência
            </span>
            <span className="text-xs font-mono text-[#e2ff31]">0{activeModule?.id || 1}</span>
          </div>

          <div className="my-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-xl">
              🔬
            </div>
            <h4 className="font-bold text-white text-lg tracking-tight group-hover:text-[#e2ff31] transition">
              {activeModule?.title || "Trilha Personalizada"}
            </h4>
            <p className="text-xs text-neutral-400 line-clamp-2">{activeModule?.subtitle || "Explore os módulos da sua trilha."}</p>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-white/5">
            <span className="text-xs text-neutral-400 font-medium">{progressPercent}% do curso</span>
            <span className="text-xs font-bold text-[#e2ff31] flex items-center gap-1">
              Continuar <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>
        </div>

        {/* Team Status Bento Box (Span 4) */}
        <div
          onClick={() => onNavigate("guilds")}
          className="md:col-span-4 bg-[#111111] border border-white/5 rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between hover:border-white/15 transition cursor-pointer group shadow-md"
        >
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              Equipe & Ranking
            </span>
            {guild ? (
              <span className="text-xs font-mono text-[#e2ff31]">#{guild.rank} Global</span>
            ) : (
              <span className="text-xs font-mono text-neutral-400">Sem Equipe</span>
            )}
          </div>

          <div className="my-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-xl">
              {guild?.crest || "🛡️"}
            </div>
            <h4 className="font-bold text-white text-lg tracking-tight group-hover:text-[#e2ff31] transition">
              {guild ? guild.name : "Criar ou Entrar em uma Equipe"}
            </h4>
            <p className="text-xs text-neutral-400 line-clamp-2">
              {guild
                ? guild.description
                : "Forme uma comunidade com outros estudantes para somar XP conjunto e disputar duelos."}
            </p>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-white/5">
            <span className="text-xs text-neutral-400 font-medium">
              {guild ? `${guild.totalXp} XP coletivo` : "Comunidade"}
            </span>
            <span className="text-xs font-bold text-[#e2ff31] flex items-center gap-1">
              {guild ? "Arena 1v1" : "Explorar"}{" "}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </span>
          </div>
        </div>

        {/* Streak & Active Members (Span 4) */}
        <div className="md:col-span-4 bg-[#181818] border border-white/5 rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-md">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bento-dot-bg pointer-events-none" />

          <div className="flex justify-between items-center pb-3 border-b border-white/5 relative z-10">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              Frequência Diária
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Ativo
            </span>
          </div>

          <div className="my-4 space-y-1 relative z-10">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight italic">
              {user.streakDays === 1 ? "1 Dia" : `${user.streakDays} Dias`}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {user.streakDays === 1
                ? "Primeiro dia de estudo registrado! Acesse amanhã para manter sua sequência."
                : `${user.streakDays} dias seguidos de estudo focado.`}
            </p>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-white/5 relative z-10">
            <button
              onClick={() => setShowUsersModal(true)}
              className="flex items-center gap-2 group text-left cursor-pointer transition hover:opacity-90"
              title="Clique para ver os usuários cadastrados"
            >
              <div className="flex -space-x-2">
                {realUsers.slice(0, 4).map((ru, idx) => {
                  const initials = getUserInitials(ru.name, ru.email);
                  const isCurrent = ru.email.toLowerCase() === user.email.toLowerCase();
                  return (
                    <div
                      key={ru.email || idx}
                      className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black transition group-hover:scale-105 ${
                        isCurrent
                          ? "bg-[#e2ff31] text-black ring-1 ring-[#e2ff31]/50"
                          : idx % 3 === 0
                          ? "bg-emerald-500 text-black"
                          : idx % 3 === 1
                          ? "bg-sky-500 text-black"
                          : "bg-purple-500 text-white"
                      }`}
                      title={`${ru.name} (${ru.email}) - Nível ${ru.level}`}
                    >
                      {initials}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-neutral-300 uppercase font-semibold tracking-wider group-hover:text-[#e2ff31] transition">
                  {realUsers.length === 1
                    ? "1 Usuário Ativo"
                    : `${realUsers.length} Usuários`}
                </span>
                <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-[#e2ff31] group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Users Community Modal */}
      {showUsersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowUsersModal(false)}
        >
          <div
            className="bg-[#111111] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                    Comunidade Ativa
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Usuários do App
                </h3>
                <p className="text-xs text-neutral-400">
                  Estudantes autenticados e conectados com suas próprias contas de e-mail.
                </p>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Users list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {realUsers.map((ru) => {
                const isCurrent = ru.email.toLowerCase() === user.email.toLowerCase();
                const initials = getUserInitials(ru.name, ru.email);

                return (
                  <div
                    key={ru.email}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      isCurrent
                        ? "bg-[#181818] border-[#e2ff31]/40 ring-1 ring-[#e2ff31]/20"
                        : "bg-[#141414] border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCurrent
                            ? "bg-[#e2ff31] text-black shadow-xs"
                            : "bg-neutral-800 text-white border border-white/10"
                        }`}
                      >
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{ru.name}</p>
                          {isCurrent && (
                            <span className="bg-[#e2ff31] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5 text-neutral-500" />
                          {ru.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-[#e2ff31] font-mono">
                        Nível {ru.level}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {ru.xp} XP • {ru.streakDays}d ofensiva
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security note */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Autenticação SHA-256</span>
              </span>
              <span className="font-mono text-neutral-500">
                {realUsers.length} conta{realUsers.length > 1 ? "s" : ""} ativa{realUsers.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Third Bento Row: Socratic Thought & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* High-Contrast White Bento Box - Socratic Daily Thought (Span 7) */}
        <div className="lg:col-span-7 bg-white text-black rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold tracking-[0.2em] opacity-50">
              Reflexão Socrática Diária
            </span>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
              💡
            </div>
          </div>

          <div className="my-6 space-y-3">
            <h3 className="text-xl sm:text-2xl font-medium tracking-tight leading-snug">
              "Qual a diferença fundamental entre memorizar uma fórmula ou conceito e realmente entender a lógica que o sustenta?"
            </h3>
            <p className="text-xs text-neutral-600 font-medium">
              Exercite o raciocínio investigativo e formule suas conclusões com o auxílio socrático da Lumina.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight opacity-70">
              Recompensa: +30 XP Cognitivo
            </span>
            <button
              onClick={() => onNavigate("lumina")}
              className="bg-black text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
            >
              <Brain className="w-3.5 h-3.5 text-[#e2ff31]" />
              <span>Refletir com Lumina</span>
            </button>
          </div>
        </div>

        {/* Dark Bento Box - Quick Studio Actions (Span 5) */}
        <div className="lg:col-span-5 bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                Atalhos Rápidos
              </span>
              <span className="text-xs font-mono text-[#e2ff31]">03</span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate("games")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 hover:border-white/10 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-[#e2ff31] transition">
                      Gerar Quiz por PDF
                    </p>
                    <p className="text-[11px] text-neutral-400">Flashcards & Quizzes instantâneos</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("guilds")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 hover:border-white/10 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚔️</span>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-[#e2ff31] transition">
                      Duelo 1v1 em Sala
                    </p>
                    <p className="text-[11px] text-neutral-400">Batalha rápida com timer</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("store")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#161616] hover:bg-[#1f1f1f] border border-white/5 hover:border-white/10 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛍️</span>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-[#e2ff31] transition">
                      Loja de Recompensas
                    </p>
                    <p className="text-[11px] text-neutral-400">{user.xp} XP prontos para uso</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          <div className="text-neutral-500 text-[10px] uppercase tracking-widest pt-4">
            Ambiente Pedagógico Gamificado • Bento Grid UI
          </div>
        </div>
      </div>

      {/* =========================================================================
          APP ACADÊMICO IFES - GUILDAS & COMBOS EDITION GAMIFIED SUITE
          ========================================================================= */}
      
      {/* Linha 0: Sistema de Guildas e Ligas do Campus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card Guildas do Campus */}
        <div className="card-moldura card-roxo flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-2 text-white font-bold">
              <span>🛡️</span> Guildas e Ligas do Campus
            </h3>
            <p className="descricao-card mt-1">
              Una forças com outros estudantes do IFES! Todo XP ganho em sessões de foco contribui para o ranking da sua Guilda!
            </p>

            <div className="space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-neutral-300 block">Sua Guilda Atual:</label>
              <select
                id="select-guilda"
                value={guildaAtual}
                onChange={(e) => handleTrocarGuilda(e.target.value)}
                className="select-3d text-xs py-2 px-3 bg-neutral-900 border-sky-400 text-white rounded-xl w-full font-bold cursor-pointer"
              >
                <option value="Clube de Eventos Esportivos">🏆 Clube de Eventos Esportivos</option>
                <option value="Liga de Tecnologia e TI">💻 Liga de Tecnologia e TI</option>
                <option value="Guilda dos Calouros Unificados">🌱 Guilda dos Calouros Unificados</option>
              </select>
            </div>

            <div className="trilho-barra mt-3">
              <div
                id="ui-barra-guilda"
                className="preenchimento-barra preenchimento-guilda"
                style={{ width: `${Math.min(100, (guildaXP / 2000) * 100)}%` }}
              />
            </div>
          </div>

          <p id="ui-guilda-xp-texto" className="descricao-card text-right font-bold text-purple-300">
            XP Contribuído para Guilda: {guildaXP} pts
          </p>
        </div>

        {/* Card Combo Multidisciplinar Holístico */}
        <div className="card-moldura card-dourado flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="texto-destaque-game text-base flex items-center gap-2 text-white font-bold">
                <span>🧪</span> Combo Multidisciplinar Holístico
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${comboAtivo ? "bg-purple-500/30 text-purple-300 border border-purple-400" : "bg-neutral-800 text-neutral-400"}`}>
                {comboAtivo ? "🔥 Combo 1.3x Ativo" : `${materiasHoje.length}/2 Matérias`}
              </span>
            </div>
            <p className="descricao-card mt-1">
              Estude 2 matérias de áreas distintas no mesmo dia para ativar o <strong>Combo Holístico (+30% XP em todas as tarefas)</strong>!
            </p>

            <div className="space-y-1.5 mt-2">
              <div className="text-[11px] text-neutral-300">Disciplinas estudadas hoje:</div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {materiasHoje.length === 0 ? (
                  <span className="text-[11px] text-neutral-400 italic">Nenhuma matéria registrada hoje. Inicie um Foco abaixo!</span>
                ) : (
                  materiasHoje.map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400 text-sky-200 text-[11px] font-bold">
                      {m}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-amber-300 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-center">
            {comboAtivo ? "✨ Bônus de +30% XP aplicado a todos os Pomodoros!" : "💡 Dica: Estude Prática/Esportes e depois Teoria para combar!"}
          </div>
        </div>
      </div>

      {/* Linha 1: Boss Raid Co-op & Modo Estudo (Pomodoro + Som Ambiente + Seletor de Matérias) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Boss Raid Co-op */}
        <div className="card-moldura card-vermelho flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="texto-destaque-game text-base flex items-center gap-2 text-white font-bold">
                <span>⚔️</span> Chefão Semestral: O Trabalho Final
              </h3>
              <span id="ui-boss-hp" className="text-xs font-mono font-bold text-red-400">
                {bossHP} / 1000 HP
              </span>
            </div>
            <p className="descricao-card mt-1">
              Ataque o boss estudando e colaborando! Derrotar o chefe concede uma recompensa coletiva para todo o campus!
            </p>

            <div className="trilho-barra mt-3">
              <div
                id="ui-barra-boss"
                className="preenchimento-barra preenchimento-hp"
                style={{ width: `${(bossHP / 1000) * 100}%` }}
              />
            </div>
          </div>

          <button
            id="btn-atacar-boss"
            onClick={handleAtacarBoss}
            className="btn-3d btn-vermelho flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💥 Atacar Boss (-25 HP / Custo: 10 ⚡)</span>
          </button>
        </div>

        {/* Card 2: Modo Estudo & Player Foco (Pomodoro com Seletor de Matérias) */}
        <div className="card-moldura card-dourado flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-2 text-white font-bold">
              <span>⏱️</span> Modo Estudo & Combo Multidisciplinar
            </h3>
            <p className="descricao-card">
              Selecione a disciplina para registrar no seu combo diário (+150 🪙 e até +104 XP):
            </p>

            {/* Seleção de Matéria */}
            <div className="space-y-1 my-2">
              <label className="text-[11px] font-bold text-neutral-300 block">Selecione a Disciplina:</label>
              <select
                id="select-materia"
                value={materiaSelecionada}
                onChange={(e) => setMateriaSelecionada(e.target.value)}
                disabled={timerAtivo}
                className="select-3d text-xs py-2 px-3 bg-neutral-900 border-sky-400 text-white rounded-xl w-full font-bold cursor-pointer disabled:opacity-50"
              >
                <option value="Prática / Esportes">⚽ Eventos Esportivos / Prática</option>
                <option value="Teoria / Gestão">📚 Gestão e Organização / Teoria</option>
                <option value="Exatas / Estatística">📊 Estatística e Métricas / Exatas</option>
                <option value="Humanas / Comunicação">🗣️ Comunicação e Marketing / Humanas</option>
              </select>
            </div>

            <div id="ui-timer-display" className="display-cronometro">
              {formatTimer(tempoFoco)}
            </div>

            {/* Ambient Sound Toggles */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                id="btn-audio-chuva"
                onClick={() => handleAlternarSomAmbiente("chuva")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipoSomAtivo === "chuva"
                    ? "bg-sky-500/30 border-sky-400 text-sky-200"
                    : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <span>🌧️ Som Chuva</span>
                {tipoSomAtivo === "chuva" && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
              </button>

              <button
                id="btn-audio-ruido"
                onClick={() => handleAlternarSomAmbiente("ruido")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipoSomAtivo === "ruido"
                    ? "bg-purple-500/30 border-purple-400 text-purple-200"
                    : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <span>📻 Ruído Branco</span>
                {tipoSomAtivo === "ruido" && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {!timerAtivo ? (
              <button
                id="btn-timer-iniciar"
                onClick={handleIniciarEstudo}
                className="btn-3d btn-verde flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>▶️ Iniciar Foco</span>
              </button>
            ) : (
              <button
                id="btn-timer-cancelar"
                onClick={handleCancelarEstudo}
                className="btn-3d btn-fogo flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>🛑 Cancelar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Buff RU, Gacha de Cards Colecionáveis, Missões Diárias, Árvore de Talentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Buff Restaurante Universitário (RU) */}
        <div className="card-moldura flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-sm flex items-center gap-1.5 text-white font-bold">
              <span>🍱</span> Restaurante Universitário (RU)
            </h3>
            <p className="descricao-card mt-1">
              Confirme sua refeição no RU para receber +25% de aceleração na regeneração de energia por 1 hora.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-neutral-300 flex justify-between">
              <span>Status:</span>
              <strong className={buffRUAtivo ? "text-emerald-400" : "text-neutral-400"}>
                {buffRUAtivo ? "🟢 Buff Ativo" : "⚪ Sem Buff"}
              </strong>
            </div>

            <button
              id="btn-ru-buff"
              onClick={handleAtivarBuffRU}
              className="btn-3d btn-verde text-xs py-2.5 font-bold cursor-pointer"
            >
              🥗 Confirmar Refeição no RU
            </button>
          </div>
        </div>

        {/* 2. Gacha de Cards & Figurinhas Colecionáveis */}
        <div className="card-moldura flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-sm flex items-center gap-1.5 text-white font-bold">
              <span>🎰</span> Baú de Cards Colecionáveis
            </h3>
            <p className="descricao-card mt-1">
              Tire figurinhas raras e lendárias do IFES usando suas moedas acumuladas!
            </p>

            <button
              id="btn-gacha-abrir"
              onClick={handleAbrirGacha}
              className="btn-3d btn-roxo text-xs py-2 font-bold mb-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Abrir Baú (100 🪙)</span>
            </button>

            {gachaFeedback && (
              <p className="text-[11px] text-amber-300 font-bold bg-amber-500/10 p-1.5 rounded-md border border-amber-500/20 text-center animate-fade-in">
                {gachaFeedback}
              </p>
            )}
          </div>

          <div id="grid-colecao-cards" className="gacha-grid">
            {BANCO_CARDS.map((card) => {
              const desbloqueado = (user.cardsColecionados || []).includes(card.id);
              return (
                <div
                  key={card.id}
                  className={`card-colecao ${desbloqueado ? card.raridade : "opacity-40"}`}
                  title={`${card.nome} (${card.raridade})`}
                >
                  <span className="text-xl block">{desbloqueado ? card.emoji : "❓"}</span>
                  <span className="text-[10px] font-bold text-white block truncate">
                    {desbloqueado ? card.nome : "Bloqueado"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Missões Diárias */}
        <div className="card-moldura flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-sm flex items-center gap-1.5 text-white font-bold">
              <span>🎯</span> Missões Diárias
            </h3>
            <p className="descricao-card mt-1">
              Complete metas diárias para resgatar bônus instantâneos de moedas:
            </p>
          </div>

          <div id="lista-missoes" className="space-y-1.5">
            {missoes.map((m) => (
              <div key={m.id} className="item-lista">
                <div>
                  <p className="font-bold text-white text-[11px]">{m.desc}</p>
                  <p className="text-[10px] text-neutral-400">
                    Progresso: {m.progresso}/{m.meta} (+{m.premio} 🪙)
                  </p>
                </div>
                {m.concluida ? (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Feito
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold text-[11px]">Pendente</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSimularGanharXp}
            className="btn-3d btn-azul text-xs py-2 font-bold cursor-pointer"
          >
            ✨ Simular Progresso (+100 XP)
          </button>
        </div>

        {/* 4. Árvore de Talentos Passivos */}
        <div className="card-moldura flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-sm flex items-center gap-1.5 text-white font-bold">
              <span>🌟</span> Talentos Passivos
            </h3>
            <p className="descricao-card mt-1">
              Adquira habilidades permanentes para potencializar seus estudos:
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleComprarPassiva("regen", 150)}
              disabled={Boolean(user.passivas?.regen)}
              className={`btn-3d text-xs py-2 flex items-center justify-between cursor-pointer ${
                user.passivas?.regen ? "btn-verde" : "btn-azul"
              }`}
            >
              <span>⚡ Regen Flash (+15%)</span>
              <span>{user.passivas?.regen ? "✅ Ativo" : "150 🪙"}</span>
            </button>

            <button
              onClick={() => handleComprarPassiva("bonusXp", 200)}
              disabled={Boolean(user.passivas?.bonusXp)}
              className={`btn-3d text-xs py-2 flex items-center justify-between cursor-pointer ${
                user.passivas?.bonusXp ? "btn-verde" : "btn-fogo"
              }`}
            >
              <span>✨ Mestre XP (+20%)</span>
              <span>{user.passivas?.bonusXp ? "✅ Ativo" : "200 🪙"}</span>
            </button>
          </div>

          <div className="text-[10px] text-neutral-400 text-center">
            Talentos ativos aplicam-se a todas as tarefas.
          </div>
        </div>
      </div>

      {/* Linha 3: Enquete Rápida, Torneios & Check-in QR Code, Energia & Upgrades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
        {/* 1. Enquete Rápida Recompensada */}
        <div className="card-moldura-dourada p-5 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-yellow-400" /> Enquete do Campus
            </h3>
            <p className="text-xs text-neutral-300 mt-1">
              Qual é seu local favorito de estudo no IFES? (Ganha +80 🪙 e +30 XP)
            </p>
          </div>

          <div id="container-enquete" className="space-y-1.5">
            {user.enqueteRespondida ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-center">
                <p className="text-xs font-bold text-emerald-300">✅ Enquete respondida!</p>
                <p className="text-[10px] text-neutral-300 mt-1">Volte amanhã para a próxima votação.</p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleResponderEnquete("Biblioteca")}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs font-bold text-white text-left transition cursor-pointer"
                >
                  📚 Biblioteca Central
                </button>
                <button
                  onClick={() => handleResponderEnquete("Laboratórios")}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs font-bold text-white text-left transition cursor-pointer"
                >
                  🔬 Laboratórios de Informática
                </button>
                <button
                  onClick={() => handleResponderEnquete("Área Verde / Quadra")}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs font-bold text-white text-left transition cursor-pointer"
                >
                  🌳 Área Verde e Convivência
                </button>
              </>
            )}

            {enqueteFeedback && (
              <p className="text-[10px] text-amber-300 text-center mt-1">{enqueteFeedback}</p>
            )}
          </div>
        </div>

        {/* 2. Torneios & Eventos com Check-in QR Code */}
        <div className="card-moldura-dourada p-5 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" /> Torneios & Eventos
            </h3>
            <p className="text-xs text-neutral-300 mt-1">
              🥋 Gladiadores do Tatame (BJJ) & Jogos Internos IFES. Faça check-in:
            </p>
            <div id="dashboard-qr-reader" className="hidden"></div>
            <input
              type="file"
              id="input-qr"
              accept="image/*"
              className="hidden"
              onChange={handleQrFileUpload}
            />
          </div>

          <div>
            <button
              onClick={() => {
                const el = document.getElementById("input-qr");
                if (el) el.click();
              }}
              className="btn-acao-secundaria text-xs py-2.5 font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 w-full"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>📷 Check-in com QR Code (+60 XP)</span>
            </button>

            {qrResult && (
              <div className="mt-2 p-2 bg-neutral-900/80 rounded-lg border border-white/10 text-[11px] text-center">
                {qrScanning ? (
                  <span className="text-neutral-400 animate-pulse">A ler QR do evento...</span>
                ) : (
                  <span className="text-emerald-400 font-bold">{qrResult}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Painel de Energia */}
        <div className="card-moldura-dourada p-5 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-1.5">
              <span>⚡</span> Energia Acadêmica
            </h3>
            <div className="text-xs text-neutral-300 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Disponível:</span>
                <strong className="text-amber-300 font-bold">{user.energy ?? 10}/{user.maxEnergy ?? 10} ⚡</strong>
              </div>
              <div className="flex justify-between">
                <span>Próximo ponto em:</span>
                <strong id="ui-cronometro" className="font-mono text-emerald-400">
                  {(user.energy ?? 10) >= (user.maxEnergy ?? 10) ? "Cheia!" : formatTimeRemaining(energySecondsLeft)}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
              <div
                id="ui-barra-progresso"
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(user.energy ?? 10) >= (user.maxEnergy ?? 10) ? 100 : energyProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Loja de Upgrades de Energia */}
        <div className="card-moldura-dourada p-5 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="texto-destaque-game text-base flex items-center gap-1.5">
              <span>🏪</span> Loja de Upgrades
            </h3>
            <p className="text-xs text-neutral-300 mt-1">
              Aumente sua capacidade máxima de energia (+10 limites):
            </p>
          </div>

          <button
            onClick={handleBuyEnergyUpgrade}
            className="btn-acao-principal text-xs py-2.5 font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Aumentar Limite</span>
            <span>(<span id="ui-preco-upgrade">{upgradeCost}</span> 🪙)</span>
          </button>
        </div>
      </div>

      {/* Botão Instalador PWA */}
      {pwaInstallable && (
        <div className="pt-2">
          <button
            id="btn-instalar-pwa"
            onClick={onInstallPwa}
            className="btn-pwa-instalar w-full py-3.5 text-sm font-black shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>📲 Instalar Brain Studio na Tela Inicial</span>
          </button>
        </div>
      )}
    </section>
  );
};
