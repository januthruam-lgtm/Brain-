import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  Users,
  Shield,
  Zap,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlusCircle,
  Crown,
  Search,
  Check,
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  AlertTriangle,
  Gift,
  Trophy,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { GuildInfo, BattleQuestion, UserProfile, GuildMessage } from "../../types";
import { GUILDS_LIST } from "../../data/initialData";
import {
  getGuildsList,
  joinGuild,
  deleteGuild,
  contributeGuildXp,
  getGuildMessages,
  sendGuildMessage,
} from "../../services/guildService";
import { CreateGuildModal } from "../CreateGuildModal";
import { GuildEnergyRequests } from "../GuildEnergyRequests";

interface GuildsBattlesTabProps {
  user: UserProfile;
  onRewardXp?: (amount: number) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onConsumeEnergy?: (amount?: number) => boolean;
  onOpenEnergyModal?: () => void;
  onAddEnergy?: (amount: number) => void;
}

export const GuildsBattlesTab: React.FC<GuildsBattlesTabProps> = ({
  user,
  onRewardXp,
  onUpdateUser,
  onConsumeEnergy,
  onOpenEnergyModal,
  onAddEnergy,
}) => {
  const [activeSubView, setActiveSubView] = useState<"explore" | "my-guild" | "duels">("explore");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [battleState, setBattleState] = useState<"idle" | "battling" | "results">("idle");
  const [guilds, setGuilds] = useState<GuildInfo[]>(GUILDS_LIST);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joiningGuildId, setJoiningGuildId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [guildToDelete, setGuildToDelete] = useState<GuildInfo | null>(null);
  const [isDeletingGuild, setIsDeletingGuild] = useState(false);

  // Team Messaging States
  const [messages, setMessages] = useState<GuildMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load teams on mount and when user changes
  useEffect(() => {
    loadGuilds();
  }, [user.email]);

  const loadGuilds = async () => {
    const list = await getGuildsList(user.email);
    setGuilds(list);
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Find user's active team
  const myGuild =
    guilds.find((g) => g.isUserGuild || g.id === user.guildId) ||
    guilds.find((g) => g.members?.some((m) => m.email.toLowerCase() === user.email.toLowerCase())) ||
    null;

  // Load team messages when viewing active team
  useEffect(() => {
    if (!myGuild?.id) return;

    let isMounted = true;
    const fetchMsgs = async () => {
      const msgs = await getGuildMessages(myGuild.id);
      if (isMounted) {
        setMessages(msgs);
      }
    };

    fetchMsgs();

    // Poll every 4 seconds when in my-guild view to get live chat updates
    const interval = setInterval(fetchMsgs, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [myGuild?.id, activeSubView]);

  // Auto scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (activeSubView === "my-guild" && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, activeSubView]);

  // Handle sending a message in the team chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGuild?.id || !newMessageText.trim() || isSendingMessage) return;

    const textToSend = newMessageText.trim();
    setNewMessageText("");
    setIsSendingMessage(true);

    const isLeader = myGuild.leaderEmail?.toLowerCase() === user.email.toLowerCase();
    const senderRole = isLeader ? "Líder" : "Membro";

    try {
      const res = await sendGuildMessage(myGuild.id, {
        text: textToSend,
        senderName: user.name,
        senderEmail: user.email,
        senderRole,
        badge: user.equippedBadge === "crown_gold" ? "👑" : undefined,
      });

      if (res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn("Error sending message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Battle questions bank
  const [battleQuestions] = useState<BattleQuestion[]>([
    {
      id: "bq-1",
      question: "Qual organela celular é responsável direta pela síntese de ATP?",
      options: ["Mitocôndria", "Complexo de Golgi", "Ribossomo", "Vacúolo"],
      correctIndex: 0,
      timeLimitSeconds: 12,
    },
    {
      id: "bq-2",
      question: "Quantos pares de cromossomos uma célula somática humana típica possui?",
      options: ["21 pares", "23 pares", "46 pares", "12 pares"],
      correctIndex: 1,
      timeLimitSeconds: 12,
    },
    {
      id: "bq-3",
      question: "Qual tipo de transporte através da membrana gasta energia na forma de ATP?",
      options: ["Difusão Simples", "Osmose", "Transporte Ativo", "Difusão Facilitada"],
      correctIndex: 2,
      timeLimitSeconds: 12,
    },
    {
      id: "bq-4",
      question: "A base nitrogenada Timina (T) no DNA pareia especificamente com qual base?",
      options: ["Adenina (A)", "Guanina (G)", "Citosina (C)", "Uracila (U)"],
      correctIndex: 0,
      timeLimitSeconds: 12,
    },
    {
      id: "bq-5",
      question: "Qual processo biológico converte energia luminosa em matéria orgânica?",
      options: ["Fermentação Lática", "Fotossíntese", "Respiração Celular", "Quimiossíntese"],
      correctIndex: 1,
      timeLimitSeconds: 12,
    },
  ]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timer, setTimer] = useState(12);

  // Timer countdown during battle
  useEffect(() => {
    if (battleState !== "battling" || hasAnswered) return;

    if (timer <= 0) {
      handleAnswerOption(-1);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [battleState, timer, hasAnswered]);

  const createBattleRoom = () => {
    const code = "#LUMI" + Math.floor(Math.random() * 900 + 100);
    setRoomCode(code);
  };

  const startBattle = async (_codeName?: string) => {
    if (onConsumeEnergy) {
      const hasEnergy = onConsumeEnergy(1);
      if (!hasEnergy) {
        if (onOpenEnergyModal) {
          onOpenEnergyModal();
        } else {
          alert("⚡ Você está sem energias para iniciar o duelo! Peça energias para sua equipe ou recarregue com XP.");
        }
        return;
      }
    } else if (typeof user.energy === "number" && user.energy < 1) {
      if (onOpenEnergyModal) {
        onOpenEnergyModal();
      } else {
        alert("⚡ Você está sem energias para iniciar o duelo! Peça energias para sua equipe ou recarregue com XP.");
      }
      return;
    }

    setBattleState("battling");
    setCurrentQIndex(0);
    setUserScore(0);
    setOpponentScore(0);
    setSelectedOpt(null);
    setHasAnswered(false);
    setTimer(12);
  };

  const handleJoinBattle = () => {
    if (!joinCodeInput.trim()) {
      alert("Por favor, digite o código da sala (ex: #LUMI742).");
      return;
    }
    startBattle(joinCodeInput);
  };

  const handleAnswerOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOpt(idx);
    setHasAnswered(true);

    const activeQ = battleQuestions[currentQIndex];
    const isCorrect = idx === activeQ.correctIndex;

    const points = isCorrect ? Math.max(10, timer * 10 + 50) : 0;
    if (isCorrect) {
      setUserScore((prev) => prev + points);
    }

    const opponentCorrect = Math.random() > 0.35;
    const opponentPoints = opponentCorrect ? Math.floor(Math.random() * 40 + 70) : 0;
    setOpponentScore((prev) => prev + opponentPoints);

    setTimeout(() => {
      if (currentQIndex < battleQuestions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOpt(null);
        setHasAnswered(false);
        setTimer(12);
      } else {
        setBattleState("results");
        const finalUserWon = userScore + points >= opponentScore + opponentPoints;
        const xpEarned = finalUserWon ? 120 : 40;

        if (finalUserWon) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        if (onRewardXp) {
          onRewardXp(xpEarned);
        }

        // Contribute XP to user's team
        if (myGuild?.id) {
          contributeGuildXp(myGuild.id, xpEarned, user.email);
          setGuilds((prev) =>
            prev.map((g) =>
              g.id === myGuild.id ? { ...g, totalXp: g.totalXp + xpEarned } : g
            )
          );
        }
      }
    }, 1800);
  };

  // Handler for joining any team
  const handleJoinSpecificGuild = async (guild: GuildInfo) => {
    try {
      setJoiningGuildId(guild.id);
      const result = await joinGuild(guild.id, user);

      setGuilds(result.allGuilds);

      const isLeader = guild.leaderEmail?.toLowerCase() === user.email.toLowerCase();
      const updatedUserProps: Partial<UserProfile> = {
        guildId: guild.id,
        guildName: guild.name,
        guildTag: guild.tag,
        guildCrest: guild.crest,
        guildRole: isLeader ? "Líder" : "Membro",
      };

      if (onUpdateUser) {
        onUpdateUser(updatedUserProps);
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      showToast(`Você agora faz parte da equipe ${guild.name}! 🔥`);
    } catch (err: any) {
      alert("Não foi possível entrar na equipe. Tente novamente.");
    } finally {
      setJoiningGuildId(null);
    }
  };

  // Callback when a user creates a new team
  const handleGuildCreated = (newGuild: GuildInfo, updatedList: GuildInfo[]) => {
    setGuilds(updatedList);
    if (onUpdateUser) {
      onUpdateUser({
        guildId: newGuild.id,
        guildName: newGuild.name,
        guildTag: newGuild.tag,
        guildCrest: newGuild.crest,
        guildRole: "Líder",
      });
    }
    setActiveSubView("my-guild");
    showToast(`Equipe "${newGuild.name}" criada com sucesso! Você é o Líder.`);
  };

  // Handler for deleting a team (only creator / leader)
  const handleDeleteGuild = async (target: GuildInfo) => {
    if (!target) return;
    setIsDeletingGuild(true);
    try {
      const res = await deleteGuild(target.id, user.email);
      setGuilds(res.allGuilds);

      // If user was part of this guild, remove it from their profile state
      if (
        user.guildId === target.id ||
        myGuild?.id === target.id
      ) {
        if (onUpdateUser) {
          onUpdateUser({
            guildId: undefined,
            guildName: undefined,
            guildTag: undefined,
            guildCrest: undefined,
            guildRole: undefined,
          });
        }
        setActiveSubView("explore");
      }

      setGuildToDelete(null);
      showToast(`Equipe "${target.name}" foi excluída com sucesso.`);
    } catch (err: any) {
      alert("Não foi possível excluir a equipe. Tente novamente.");
    } finally {
      setIsDeletingGuild(false);
    }
  };

  const isLeaderOfMyGuild = Boolean(
    myGuild &&
    (
      myGuild.leaderEmail?.toLowerCase() === user.email.toLowerCase() ||
      user.guildRole === "Líder" ||
      myGuild.members?.find((m) => m.email.toLowerCase() === user.email.toLowerCase())?.role === "Líder"
    )
  );

  // Filter teams
  const categoriesList = [
    "Todas",
    "Exatas & Astrofísica",
    "Biológicas & Medicina",
    "Tecnologia & Computação",
    "Multidisciplinar & ENEM",
  ];

  const filteredGuilds = guilds.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "Todas" ||
      (g.category && g.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="tab-guilds" className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#e2ff31]/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-[#e2ff31]" />
          <span className="text-sm font-semibold">{feedbackToast}</span>
        </div>
      )}

      {/* Nova Área da Equipa: Ecrã Inteiro e Sem Subdivisões */}
      <section
        id="equipa"
        className="w-full bg-[#111111] p-8 sm:p-12 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden space-y-6"
      >
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <span>Brain Studio Collaboration</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-400">
            Área Exclusiva da Equipa
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
            Este espaço foi desenhado a pensar na colaboração unificada do Brain Studio. Aqui a equipa centraliza os trabalhos, comunicações e recursos de forma integrada, sem barreiras visuais ou divisões complexas no ecrã.
          </p>
          <div className="p-6 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 text-indigo-200 font-medium text-sm sm:text-base">
            Espaço reservado para gestão interna da equipa, atualizações de projetos e alinhamento de tarefas.
          </div>
        </div>
      </section>

      {/* Main Teams Navigation Banner */}
      <div className="bg-[#111111] p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#e2ff31] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Comunidades de Estudo & Duelos
              </span>
              {myGuild && (
                <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  {myGuild.crest} {myGuild.name} ({myGuild.tag})
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Equipes de Estudo & Duelos 1v1
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xl">
              Crie sua própria equipe personalizada, converse no mural do time, dispute o ranking com outros estudantes e participe de duelos em tempo real.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Minha Equipe</span>
            </button>

            <button
              onClick={() => setActiveSubView("duels")}
              className={`px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition border flex items-center gap-2 ${
                activeSubView === "duels"
                  ? "bg-white text-black border-white shadow-md"
                  : "bg-[#181818] hover:bg-[#222] text-neutral-300 border-white/10"
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Arena Duelo 1v1</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-white/5 flex-wrap">
          <button
            onClick={() => setActiveSubView("explore")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubView === "explore"
                ? "bg-white/10 text-[#e2ff31] border border-[#e2ff31]/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Explorar Todas as Equipes ({guilds.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView("my-guild")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubView === "my-guild"
                ? "bg-white/10 text-[#e2ff31] border border-[#e2ff31]/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Minha Equipe Ativa {myGuild ? `(${myGuild.name})` : ""}</span>
          </button>

          <button
            onClick={() => setActiveSubView("duels")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubView === "duels"
                ? "bg-white/10 text-[#e2ff31] border border-[#e2ff31]/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Duelo 1v1</span>
          </button>
        </div>
      </div>

      {/* VIEW: MY TEAM DETAILS & CHAT */}
      {activeSubView === "my-guild" && (
        <div className="space-y-6">
          {myGuild ? (
            <div className="bg-[#111111] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
              {/* Team Banner Header */}
              <div
                className={`p-6 sm:p-10 bg-gradient-to-r ${
                  myGuild.bannerColor || "from-amber-600/30 via-yellow-700/20 to-neutral-900/40"
                } border-b border-white/10 relative`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-3xl bg-[#141414]/90 border border-white/20 flex items-center justify-center text-4xl shadow-xl">
                      {myGuild.crest}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-2xl sm:text-3xl font-black text-white">{myGuild.name}</h3>
                        <span className="font-mono font-bold text-xs bg-black/60 text-[#e2ff31] px-2.5 py-1 rounded-lg border border-[#e2ff31]/30">
                          {myGuild.tag}
                        </span>
                        <span className="bg-[#e2ff31] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          Sua Equipe
                        </span>
                      </div>
                      <p className="text-neutral-300 text-xs sm:text-sm italic mt-1">
                        "{myGuild.motto || "Conhecimento e disciplina forjam o sucesso."}"
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        <span>🏷️ {myGuild.category || "Geral"}</span>
                        <span>👑 Líder: {myGuild.leaderName || myGuild.leaderEmail?.split("@")[0] || "Fundador"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rank & Stats Pill */}
                  <div className="flex items-center gap-3 bg-black/50 p-3.5 rounded-2xl border border-white/10">
                    <div className="text-center px-3 border-r border-white/10">
                      <p className="text-[10px] text-neutral-500 font-mono uppercase">Posição</p>
                      <p className="text-xl font-black text-[#e2ff31]">#{myGuild.rank || 1}</p>
                    </div>
                    <div className="text-center px-3 border-r border-white/10">
                      <p className="text-[10px] text-neutral-500 font-mono uppercase">XP Acumulado</p>
                      <p className="text-xl font-black text-white">{myGuild.totalXp} XP</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-[10px] text-neutral-500 font-mono uppercase">Membros</p>
                      <p className="text-xl font-black text-neutral-300">{myGuild.membersCount || myGuild.members?.length || 1}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Layout: Members & Team Messaging Mural */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Team Members Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#e2ff31]" />
                        <span>Membros da Equipe ({myGuild.members?.length || myGuild.membersCount || 1})</span>
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Estudantes somando XP para subir no ranking global da temporada.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isLeaderOfMyGuild && (
                        <button
                          onClick={() => setGuildToDelete(myGuild)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Excluir equipe permanentemente (Apenas Líder/Criador)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir Minha Equipe</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveSubView("explore")}
                        className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                      >
                        Trocar de equipe
                      </button>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myGuild.members && myGuild.members.length > 0 ? (
                      myGuild.members.map((member, idx) => {
                        const isMe = member.email.toLowerCase() === user.email.toLowerCase();
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border flex items-center justify-between ${
                              isMe
                                ? "bg-[#181818] border-[#e2ff31]/40 ring-1 ring-[#e2ff31]/20"
                                : "bg-[#141414] border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#222] border border-white/10 flex items-center justify-center font-bold text-sm">
                                {member.role === "Líder" ? "👑" : "🎓"}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-xs">{member.name}</p>
                                  {isMe && (
                                    <span className="text-[9px] bg-[#e2ff31] text-black font-bold px-1.5 py-0.2 rounded-sm">
                                      VOCÊ
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-neutral-500">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xs text-[#e2ff31]">{member.xp} XP</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between col-span-full">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#222] border border-white/10 flex items-center justify-center font-bold text-sm">
                            👑
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{user.name}</p>
                            <p className="text-[10px] text-neutral-500">Líder Fundador</p>
                          </div>
                        </div>
                        <p className="font-bold text-xs text-[#e2ff31]">{user.xp} XP</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CLAN CHEST / BAÚ COOPERATIVO DA EQUIPE */}
                <div className="bg-[#161616] p-6 sm:p-7 rounded-[2rem] border border-amber-500/20 relative overflow-hidden shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                        📦
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            Evento Semanal da Equipe
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight mt-0.5">
                          Baú Cooperativo do Clã
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400 block">XP Coletivo do Baú</span>
                      <span className="text-lg font-black font-mono text-amber-400">
                        {myGuild.bauXp ?? Math.min(myGuild.totalXp, 500)} / 500 XP
                      </span>
                    </div>
                  </div>

                  {/* 3 Tier Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { nivel: 1, meta: 100, recompensa: "+50 XP & +2 ⚡", icon: "🥉", chave: "nivel1" },
                      { nivel: 2, meta: 250, recompensa: "+120 XP & +5 ⚡", icon: "🥈", chave: "nivel2" },
                      { nivel: 3, meta: 500, recompensa: "+300 XP, +10 ⚡ & 👑", icon: "🥇", chave: "nivel3" },
                    ].map((tier) => {
                      const currentChestXp = myGuild.bauXp ?? Math.min(myGuild.totalXp, 500);
                      const isUnlocked = currentChestXp >= tier.meta;
                      const isClaimed = Boolean(
                        myGuild.resgatesBau &&
                        (myGuild.resgatesBau as any)[tier.chave]
                      );

                      return (
                        <div
                          key={tier.nivel}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isClaimed
                              ? "bg-[#121212] border-white/5 opacity-70"
                              : isUnlocked
                              ? "bg-amber-500/10 border-amber-400/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30"
                              : "bg-[#141414] border-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{tier.icon}</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-neutral-400">
                              Meta: {tier.meta} XP
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-white">Nível {tier.nivel} - Baú</p>
                            <p className="text-[11px] text-amber-300 font-semibold">{tier.recompensa}</p>
                          </div>

                          <div className="pt-2 border-t border-white/5">
                            {isClaimed ? (
                              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Recompensa Resgatada
                              </span>
                            ) : isUnlocked ? (
                              <button
                                onClick={() => {
                                  const xpGains = tier.nivel === 1 ? 50 : tier.nivel === 2 ? 120 : 300;
                                  const energyGains = tier.nivel === 1 ? 2 : tier.nivel === 2 ? 5 : 10;
                                  if (onRewardXp) {
                                    onRewardXp(xpGains);
                                  }
                                  if (onAddEnergy) onAddEnergy(energyGains);
                                  
                                  const updatedResgates = {
                                    ...(myGuild.resgatesBau || { nivel1: false, nivel2: false, nivel3: false }),
                                    [tier.chave]: true,
                                  };
                                  
                                  const updatedGuilds = guilds.map((g) =>
                                    g.id === myGuild.id ? { ...g, resgatesBau: updatedResgates } : g
                                  );
                                  setGuilds(updatedGuilds);
                                  try {
                                    localStorage.setItem("studyhub_guilds_list", JSON.stringify(updatedGuilds));
                                  } catch (e) {}

                                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                                  showToast(`🎉 Baú Nível ${tier.nivel} resgatado! (+${xpGains} XP, +${energyGains} ⚡)`);
                                }}
                                className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Gift className="w-3.5 h-3.5" /> Resgatar Baú
                              </button>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                  <span>Progresso</span>
                                  <span>{Math.min(currentChestXp, tier.meta)} / {tier.meta}</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                                  <div
                                    className="bg-amber-400 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (currentChestXp / tier.meta) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TEAM ENERGY REQUESTS & DONATIONS */}
                <GuildEnergyRequests
                  guild={myGuild}
                  user={user}
                  onRewardXp={onRewardXp}
                  onAddEnergy={onAddEnergy}
                  onShowToast={showToast}
                />

                {/* TEAM MESSAGES / CHAT PANEL */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#e2ff31]" />
                        <span>Mural de Mensagens da Equipe</span>
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Envie avisos, tire dúvidas de estudo ou combine estratégias com seus companheiros de equipe.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
                    </span>
                  </div>

                  {/* Messages Chat Box */}
                  <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-96">
                    {/* Message Feed */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                            💬
                          </div>
                          <p className="text-sm font-semibold text-white">Nenhuma mensagem ainda</p>
                          <p className="text-xs text-neutral-400 max-w-sm">
                            Seja o primeiro a enviar uma mensagem para motivar seus colegas de equipe!
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.senderEmail.toLowerCase() === user.email.toLowerCase();
                          const isSystem = msg.senderRole === "Sistema";

                          if (isSystem) {
                            return (
                              <div
                                key={msg.id}
                                className="p-3 rounded-2xl bg-[#1c1c1c] border border-white/5 text-center text-xs text-neutral-300 flex items-center justify-center gap-2 my-2"
                              >
                                <span>🎉</span>
                                <span>{msg.text}</span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-neutral-400">
                                <span className="font-bold text-neutral-300">
                                  {isMe ? "Você" : msg.senderName}
                                </span>
                                {msg.senderRole && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                      msg.senderRole === "Líder"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : "bg-white/10 text-neutral-300"
                                    }`}
                                  >
                                    {msg.senderRole === "Líder" ? "👑 Líder" : msg.senderRole}
                                  </span>
                                )}
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div
                                className={`px-4 py-2.5 rounded-2xl max-w-md text-xs sm:text-sm break-words ${
                                  isMe
                                    ? "bg-[#e2ff31] text-black font-medium rounded-tr-sm shadow-md"
                                    : "bg-[#1f1f1f] text-neutral-200 border border-white/10 rounded-tl-sm"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Form */}
                    <form
                      onSubmit={handleSendMessage}
                      className="p-3 bg-[#111111] border-t border-white/10 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Escreva uma mensagem para a equipe..."
                        maxLength={300}
                        disabled={isSendingMessage}
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#e2ff31] transition"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !newMessageText.trim()}
                        className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Enviar</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 bg-[#111111] rounded-[2.5rem] border border-white/5 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#181818] border border-white/10 flex items-center justify-center text-3xl mx-auto">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-white">Você ainda não faz parte de uma equipe</h3>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Crie sua própria equipe personalizada ou explore as equipes criadas por outros estudantes para trocar mensagens e somar XP!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
                >
                  Criar Minha Equipe
                </button>
                <button
                  onClick={() => setActiveSubView("explore")}
                  className="bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 border border-white/10 px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Explorar Equipes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: EXPLORE ALL TEAMS */}
      {activeSubView === "explore" && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="bg-[#111111] p-4 sm:p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar equipe por nome, tag (#TITAS) ou categoria..."
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#e2ff31] transition"
                />
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Criar Equipe</span>
              </button>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white text-black font-bold shadow-sm"
                      : "bg-[#181818] text-neutral-400 hover:text-white border border-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Teams List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuilds.map((g) => {
              const isMyActiveGuild =
                g.isUserGuild ||
                g.id === user.guildId ||
                g.members?.some((m) => m.email.toLowerCase() === user.email.toLowerCase());

              return (
                <div
                  key={g.id}
                  className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    isMyActiveGuild
                      ? "bg-[#161616] border-[#e2ff31]/40 ring-1 ring-[#e2ff31]/20 shadow-xl"
                      : "bg-[#111111] border-white/5 hover:border-white/20"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                        {g.crest}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-base">{g.name}</h4>
                          <span className="text-[11px] font-mono font-bold text-[#e2ff31] bg-black/50 px-2 py-0.5 rounded border border-[#e2ff31]/20">
                            {g.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {g.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
                          g.rank === 1
                            ? "bg-[#e2ff31] text-black"
                            : g.rank === 2
                            ? "bg-neutral-300 text-black"
                            : g.rank === 3
                            ? "bg-amber-600 text-white"
                            : "bg-[#202020] text-neutral-400"
                        }`}
                      >
                        #{g.rank}
                      </span>
                    </div>
                  </div>

                  {/* Team Motto / Category */}
                  {g.motto && (
                    <p className="text-xs text-neutral-300 italic bg-[#151515] p-2.5 rounded-xl border border-white/5">
                      "{g.motto}"
                    </p>
                  )}

                  {/* Stats & Join Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-neutral-500 font-mono">TOTAL XP</p>
                        <p className="font-bold text-white">{g.totalXp} XP</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 font-mono">MEMBROS</p>
                        <p className="font-bold text-neutral-300">{g.membersCount || g.members?.length || 1}</p>
                      </div>
                    </div>

                    {isMyActiveGuild ? (
                      <div className="flex items-center gap-2">
                        {g.leaderEmail?.toLowerCase() === user.email.toLowerCase() && (
                          <button
                            onClick={() => setGuildToDelete(g)}
                            title="Excluir equipe"
                            className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setActiveSubView("my-guild")}
                          className="bg-[#e2ff31]/10 hover:bg-[#e2ff31]/20 text-[#e2ff31] border border-[#e2ff31]/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Sua Equipe (Mural)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {g.leaderEmail?.toLowerCase() === user.email.toLowerCase() && (
                          <button
                            onClick={() => setGuildToDelete(g)}
                            title="Excluir equipe"
                            className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleJoinSpecificGuild(g)}
                          disabled={joiningGuildId === g.id}
                          className="bg-[#1f1f1f] hover:bg-[#e2ff31] text-neutral-200 hover:text-black border border-white/10 hover:border-[#e2ff31] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>{joiningGuildId === g.id ? "Entrando..." : "Entrar na Equipe"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGuilds.length === 0 && (
            <div className="text-center p-12 bg-[#111111] rounded-[2.5rem] border border-white/5 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#181818] border border-white/10 flex items-center justify-center text-3xl mx-auto">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-white">
                {guilds.length === 0
                  ? "Nenhuma equipe criada ainda"
                  : "Nenhuma equipe encontrada"}
              </h3>
              <p className="text-neutral-400 text-xs sm:text-sm">
                {guilds.length === 0
                  ? "As equipes só aparecem quando criadas por estudantes. Crie a sua equipe personalizada e convide seus colegas para somar XP e trocar mensagens!"
                  : "Não encontramos nenhuma equipe com os termos pesquisados."}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Criar Minha Equipe</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: 1V1 DUELS ARENA */}
      {activeSubView === "duels" && (
        <div>
          {battleState === "idle" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Room Bento Box */}
              <div className="bg-[#111111] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3 relative z-10">
                  <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-semibold">
                    Modo Anfitrião
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-white/10 text-white flex items-center justify-center text-2xl font-bold">
                    ⚔️
                  </div>
                  <h3 className="font-bold text-2xl text-white tracking-tight">
                    Criar Sala de Duelo 1v1
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm font-normal">
                    Gere um código de sala instantâneo para desafiar outros membros e somar XP para a equipe {myGuild?.name}.
                  </p>
                </div>

                <div className="space-y-3 relative z-10">
                  <button
                    onClick={createBattleRoom}
                    className="w-full bg-[#e2ff31] hover:bg-[#d4f222] text-black py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Gerar Código de Sala</span>
                  </button>

                  {roomCode && (
                    <div className="space-y-3">
                      <div
                        id="room-code-display"
                        className="text-center font-mono font-bold text-2xl text-[#e2ff31] bg-[#161616] p-4 rounded-2xl border border-[#e2ff31]/30 select-all"
                      >
                        Sala: {roomCode}
                      </div>
                      <button
                        onClick={() => startBattle(roomCode)}
                        className="w-full bg-white hover:bg-neutral-200 text-black py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-black" /> Iniciar Partida de Duelo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Room Bento Box */}
              <div className="bg-[#111111] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3 relative z-10">
                  <span className="uppercase text-[10px] tracking-widest text-neutral-400 font-semibold">
                    Modo Convidado
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-white/10 text-white flex items-center justify-center text-2xl font-bold">
                    🛡️
                  </div>
                  <h3 className="font-bold text-2xl text-white tracking-tight">
                    Entrar na Sala de Duelo
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm font-normal">
                    Insira o código fornecido pelo seu colega para iniciar a partida rápida de perguntas socráticas.
                  </p>
                </div>

                <div className="space-y-3 relative z-10">
                  <input
                    type="text"
                    id="join-code-input"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ex: #LUMI942"
                    className="w-full px-5 py-3.5 bg-[#181818] border border-white/10 rounded-full text-sm text-white outline-none focus:border-[#e2ff31] font-mono font-bold tracking-widest uppercase text-center"
                  />
                  <button
                    onClick={handleJoinBattle}
                    className="w-full bg-[#1f1f1f] hover:bg-[#282828] text-white border border-white/10 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-[#e2ff31]" />
                    <span>Conectar e Jogar Duelo</span>
                  </button>
                </div>
              </div>
            </div>
          ) : battleState === "battling" ? (
            /* Live 1v1 Battle Arena Screen */
            <div className="bg-[#111111] p-6 sm:p-10 rounded-[2.5rem] border border-[#e2ff31]/40 shadow-2xl space-y-6">
              {/* Battle Header Scoreboard */}
              <div className="grid grid-cols-3 items-center bg-[#161616] border border-white/5 text-white p-5 rounded-3xl">
                {/* Player */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-lg font-bold text-white">
                    {user.equippedBadge === "crown_gold" ? "👑" : "🎓"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400">Você ({user.name.split(" ")[0]})</p>
                    <p className="text-xl font-black text-[#e2ff31]">{userScore} pts</p>
                  </div>
                </div>

                {/* Timer & Round */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 bg-[#202020] border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-white">
                    <Clock className="w-3.5 h-3.5 text-[#e2ff31]" /> {timer}s
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-mono">
                    Questão {currentQIndex + 1}/{battleQuestions.length}
                  </p>
                </div>

                {/* Opponent */}
                <div className="flex items-center justify-end gap-3 text-right">
                  <div>
                    <p className="text-xs font-bold text-neutral-400">Rival Cosmos</p>
                    <p className="text-xl font-black text-white">{opponentScore} pts</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-lg font-bold">
                    ⚡
                  </div>
                </div>
              </div>

              {/* Question Box */}
              <div className="space-y-6">
                <h3 className="text-lg sm:text-xl font-bold text-white text-center py-2">
                  {battleQuestions[currentQIndex]?.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {battleQuestions[currentQIndex]?.options.map((opt, idx) => {
                    let btnStyle =
                      "bg-[#181818] border-white/5 text-neutral-200 hover:border-[#e2ff31]/40 hover:bg-[#222]";

                    if (hasAnswered) {
                      if (idx === battleQuestions[currentQIndex].correctIndex) {
                        btnStyle = "bg-emerald-600 text-white border-emerald-500 font-bold";
                      } else if (selectedOpt === idx) {
                        btnStyle = "bg-red-600 text-white border-red-500 font-bold";
                      } else {
                        btnStyle = "bg-[#141414] text-neutral-600 opacity-40 border-transparent";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerOption(idx)}
                        disabled={hasAnswered}
                        className={`p-5 rounded-2xl border text-xs sm:text-sm font-medium transition text-left flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && idx === battleQuestions[currentQIndex].correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        )}
                        {hasAnswered && selectedOpt === idx && idx !== battleQuestions[currentQIndex].correctIndex && (
                          <AlertCircle className="w-4 h-4 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Battle Results Box */
            <div className="bg-[#111111] p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl text-center space-y-6 max-w-lg mx-auto">
              <div className="text-5xl">{userScore >= opponentScore ? "🏆" : "🤝"}</div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {userScore >= opponentScore ? "Vitória no Duelo!" : "Partida Disputada!"}
                </h3>
                <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                  {userScore >= opponentScore
                    ? `Você superou seu rival e somou +120 XP para sua equipe!`
                    : `Boa batalha! Você somou +40 XP de participação.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#161616] p-5 rounded-2xl border border-white/5">
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Sua Pontuação</p>
                  <p className="text-3xl font-black text-[#e2ff31]">{userScore} pts</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Pontuação Rival</p>
                  <p className="text-3xl font-black text-neutral-300">{opponentScore} pts</p>
                </div>
              </div>

              <button
                onClick={() => setBattleState("idle")}
                className="w-full bg-[#e2ff31] hover:bg-[#d4f222] text-black py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Jogar Outro Duelo 1v1
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for Creating Custom Team */}
      <CreateGuildModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        onGuildCreated={handleGuildCreated}
      />

      {/* Confirmation Modal for Deleting Team */}
      {guildToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Equipe?</h3>
                <p className="text-xs text-neutral-400">Esta ação é permanente e irreversível.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-white/5 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{guildToDelete.crest}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{guildToDelete.name}</span>
                    <span className="font-mono text-xs text-[#e2ff31] bg-black/50 px-2 py-0.5 rounded border border-[#e2ff31]/20">
                      {guildToDelete.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {guildToDelete.membersCount || guildToDelete.members?.length || 1} membro(s) • {guildToDelete.totalXp} XP
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400 pt-2 border-t border-white/5">
                A equipe será removida da lista global, e todo o histórico do mural de mensagens será apagado.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGuildToDelete(null)}
                disabled={isDeletingGuild}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-300 hover:text-white bg-[#1f1f1f] hover:bg-[#252525] border border-white/10 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteGuild(guildToDelete)}
                disabled={isDeletingGuild}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingGuild ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Equipe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
