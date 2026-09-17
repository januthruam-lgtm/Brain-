import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Flame,
  Coins,
  Menu,
  X,
} from "lucide-react";
import { TabId } from "./Sidebar";
import { UserProfile } from "../types";
import { isAudioMuted, toggleAudioMuted, playCoinSound } from "../utils/audio";

interface HeaderProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  user: UserProfile;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenAuth?: () => void;
  onOpenSubjectModal?: () => void;
  onOpenEnergyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  user,
  voiceEnabled,
  onToggleVoice,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenAuth,
  onOpenSubjectModal,
  onOpenEnergyModal,
}) => {
  const titles: Record<TabId, { title: string; subtitle: string; category: string }> = {
    dashboard: {
      category: "Visão Geral",
      title: "Brain Studio",
      subtitle: "Visão geral do seu progresso, nível e estatísticas de estudo",
    },
    academic: {
      category: "Ambiente Virtual de Aprendizagem",
      title: "AVA IFES & Disciplinas",
      subtitle: "Acesse as matérias, envie atividades por elas e veja os participantes do curso",
    },
    lumina: {
      category: "Inteligência Pedagógica",
      title: "Lumina Socrática",
      subtitle: "Tutor inteligente guiado por perguntas pedagógicas e voz",
    },
    sequence: {
      category: "Mapa Curricular",
      title: "Trilha em Sequência",
      subtitle: "Avanço linear desbloqueando módulos pedagógicos",
    },
    mascot: {
      category: "Gamificação & Puppet",
      title: "Laboratório de Mascote",
      subtitle: "Personalize seu pet, cuide da alimentação e evolua com XP",
    },
    games: {
      category: "IA Generativa",
      title: "Gerador por PDF & Arquivo",
      subtitle: "Transforme resumos em Quizzes com loop Duolingo e Flashcards",
    },
    guilds: {
      category: "Arena Multijogador",
      title: "Equipes & Duelos 1v1",
      subtitle: "Batalhas rápidas em tempo real, pedidos de energia e cooperação",
    },
    store: {
      category: "Recompensas & XP",
      title: "Loja & Comida Pet",
      subtitle: "Troque seu XP por pet food, temas visuais, brasões e vantagens",
    },
    colors: {
      category: "Personalização Visual",
      title: "Paleta de Cores em Tempo Real",
      subtitle: "Ajuste cores de fundo, cards, botões e destaque instantaneamente",
    },
  };

  const navTabs = [
    { id: "dashboard" as TabId, label: "Brain Studio", emoji: "⚡" },
    { id: "academic" as TabId, label: "AVA IFES", emoji: "🎓" },
    { id: "sequence" as TabId, label: "Trilha", emoji: "🗺️" },
    { id: "lumina" as TabId, label: "Lumina Socrática", emoji: "🧠" },
    { id: "mascot" as TabId, label: "Mascote Lab", emoji: "🐾" },
    { id: "games" as TabId, label: "Gerador PDF", emoji: "🎮" },
    { id: "guilds" as TabId, label: "Equipes & 1v1", emoji: "⚔️" },
    { id: "store" as TabId, label: "Loja & Pet", emoji: "🛍️" },
    { id: "colors" as TabId, label: "Cores & Tema", emoji: "🎨" },
  ];

  const currentInfo = titles[currentTab] || titles.dashboard || {
    category: "Visão Geral",
    title: "Brain Studio",
    subtitle: "Visão geral do seu progresso, nível e estatísticas de estudo",
  };

  return (
    <>
      <header
        id="app-header"
        className="border-b px-5 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-40 transition-colors duration-200 backdrop-blur-md shadow-xs"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-xl transition border"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-card-secondary)",
            }}
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="uppercase text-[10px] tracking-widest font-bold"
                style={{ color: "var(--btn-primary)" }}
              >
                {currentInfo?.category || "Visão Geral"}
              </span>
              {currentTab === "lumina" && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: "rgba(93, 92, 222, 0.1)",
                    borderColor: "var(--btn-primary)",
                    color: "var(--btn-primary)",
                  }}
                >
                  <Sparkles className="w-3 h-3" /> AI Ativa
                </span>
              )}
            </div>
            <h3
              id="current-title"
              className="font-extrabold text-xl sm:text-2xl tracking-tight leading-tight flex items-center gap-2 mt-0.5"
              style={{ color: "var(--text-primary)" }}
            >
              {currentInfo?.title || "Brain Studio"}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <p
                className="hidden sm:block text-xs font-normal"
                style={{ color: "var(--text-secondary)" }}
              >
                {currentInfo?.subtitle || ""}
              </p>
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold">
                <button
                  onClick={() => onTabChange("academic")}
                  className="hover:underline text-indigo-400 cursor-pointer"
                >
                  Ferramenta QR
                </button>
                <span className="text-neutral-600">•</span>
                <button
                  onClick={() => onTabChange("guilds")}
                  className="hover:underline text-indigo-400 cursor-pointer"
                >
                  Área da Equipa
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar & Nível */}
          <div
            id="mascote-avatar"
            onClick={() => onTabChange("mascot")}
            className="relative cursor-pointer group flex items-center justify-center"
            title="Ver Mascote & Evolução"
          >
            <div className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-neutral-900 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition">
              {user.pet?.customImageUrl ? (
                <img
                  src={user.pet.customImageUrl}
                  alt="Avatar Mascote"
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span id="ui-skin-emoji" className="text-xl">🦊</span>
              )}
            </div>
            <span
              id="hud-nivel"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 border border-white text-[10px] font-black text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight whitespace-nowrap shadow-xs"
            >
              Nvl {user.level || 1}
            </span>
          </div>

          {/* Combo Holístico Pill */}
          {(() => {
            const materiasHoje = user.materiasEstudadasHoje || [];
            const comboAtivo = materiasHoje.length >= 2;
            return (
              <div
                id="hud-combo-container"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-bold shadow-xs transition"
                style={{
                  backgroundColor: comboAtivo ? "rgba(168, 85, 247, 0.18)" : "var(--bg-card-secondary)",
                  borderColor: comboAtivo ? "#a855f7" : "var(--border-color)",
                  color: comboAtivo ? "#c084fc" : "var(--text-secondary)",
                }}
                title={
                  comboAtivo
                    ? `🧪 Combo Holístico Ativo (+30% XP)! ${materiasHoje.length} disciplinas estudadas hoje.`
                    : `🧪 Combo de Matérias (${materiasHoje.length}/2): Estude 2 áreas distintas hoje para ativar +30% XP!`
                }
              >
                <span className="text-xs">🧪</span>
                <span id="hud-combo" className="text-[11px] font-extrabold">
                  {comboAtivo ? "1.3x" : "1x"}
                </span>
              </div>
            );
          })()}

          {/* Buff RU Pill */}
          {(() => {
            const buffAtivo = user.buffRU && user.buffRUTimestamp && Date.now() < user.buffRUTimestamp;
            return (
              <div
                id="hud-buff-container"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-bold shadow-xs transition"
                style={{
                  backgroundColor: buffAtivo ? "rgba(46, 204, 113, 0.15)" : "var(--bg-card-secondary)",
                  borderColor: buffAtivo ? "#2ecc71" : "var(--border-color)",
                  color: buffAtivo ? "#2ecc71" : "var(--text-secondary)",
                }}
                title={buffAtivo ? "Buff do RU Ativo (+25% velocidade de energia)" : "Restaurante Universitário (RU)"}
              >
                <span className="text-xs">🍱</span>
                <span id="hud-buff" className="text-[11px]">
                  {buffAtivo ? "Ativo" : "Off"}
                </span>
              </div>
            );
          })()}

          {/* Streak Counter */}
          <div
            id="header-streak-pill"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
            title={user.streakDays === 1 ? "1 dia de estudo registrado! Acesse amanhã para manter sua sequência." : `${user.streakDays} dias seguidos de estudo!`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span id="hud-streak" className="text-xs font-semibold">
              {user.streakDays || 1}d
            </span>
          </div>

          {/* Moedas Pill */}
          <div
            id="hud-moedas-container"
            onClick={() => onTabChange("store")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer shadow-xs hover:border-yellow-400/50"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
              color: "#F59E0B",
            }}
            title="Suas moedas para compras na loja e upgrades"
          >
            <span className="text-sm leading-none">🪙</span>
            <span id="hud-moedas" className="text-xs font-extrabold text-amber-400">
              {(user.coins ?? 250).toLocaleString()}
            </span>
          </div>

          {/* Energy Pill */}
          <button
            id="header-energy-pill"
            onClick={onOpenEnergyModal}
            title="Energias disponíveis para jogar (Clique para ver recarga ou pedir à equipe)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer shadow-xs"
            style={{
              backgroundColor: (user.energy ?? 10) > 0 ? "var(--bg-card-secondary)" : "rgba(239, 68, 68, 0.12)",
              borderColor: (user.energy ?? 10) > 0 ? "var(--border-color)" : "#EF4444",
              color: (user.energy ?? 10) > 0 ? "#D97706" : "#EF4444",
            }}
          >
            <span className="text-sm leading-none">⚡</span>
            <span id="hud-energia" className="text-xs font-bold">
              {user.energy ?? 10}/{user.maxEnergy ?? 10}
            </span>
          </button>

          {/* XP Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs border shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{user.xp} XP</span>
          </div>

          {/* Sound & Voice Toggle */}
          <button
            id="btn-som"
            onClick={() => {
              const muted = toggleAudioMuted();
              if (voiceEnabled === muted) {
                onToggleVoice();
              }
              if (!muted) {
                playCoinSound(1046);
              }
            }}
            title={voiceEnabled ? "Som Ativado (Clique para silenciar)" : "Som Silenciado (Clique para ativar)"}
            className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold tracking-tight transition border shadow-xs cursor-pointer"
            style={{
              backgroundColor: voiceEnabled ? "var(--btn-primary)" : "var(--bg-card-secondary)",
              color: voiceEnabled ? "var(--btn-primary-text, #FFFFFF)" : "var(--text-secondary)",
              borderColor: "var(--border-color)",
            }}
            aria-label="Som"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Streak Counter */}
          <div
            id="header-streak-pill"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
            title={user.streakDays === 1 ? "1 dia de estudo registrado! Acesse amanhã para manter sua sequência." : `${user.streakDays} dias seguidos de estudo!`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span id="streak-counter" className="text-xs font-semibold">
              {user.streakDays === 1 ? "1 Dia" : `${user.streakDays} Dias`}
            </span>
          </div>

          {/* Subject Customization Trigger */}
          {onOpenSubjectModal && (
            <button
              id="header-subjects-btn"
              onClick={onOpenSubjectModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer shadow-xs"
              style={{
                backgroundColor: "var(--bg-card-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
              title="Personalizar as matérias que você precisa estudar"
            >
              <span>📚</span>
              <span className="hidden sm:inline">
                {user.selectedSubjects && user.selectedSubjects.length > 0
                  ? `${user.selectedSubjects.length} Matéria${user.selectedSubjects.length > 1 ? "s" : ""}`
                  : "Escolher Matérias"}
              </span>
            </button>
          )}

          {/* Account Profile Trigger */}
          {onOpenAuth && (
            <button
              id="header-account-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer shadow-xs"
              style={{
                backgroundColor: "var(--bg-card-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
              title={`Conectado como ${user.email}. Clique para trocar de conta ou criar uma nova.`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--btn-primary)" }}
              />
              <span className="hidden sm:inline max-w-[90px] truncate">{user.name.split(" ")[0] || "Conta"}</span>
            </button>
          )}

          {/* Active Badge Crown / Level */}
          <div
            className="w-9 h-9 rounded-2xl border flex items-center justify-center cursor-pointer transition shrink-0 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
            title={`Nível ${user.level} - ${user.name}`}
            onClick={() => onTabChange("store")}
          >
            <span className="text-sm">
              {user.equippedBadge === "crown_gold" ? "👑" : user.equippedBadge === "lumina_master" ? "🧠" : "🔥"}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 md:hidden backdrop-blur-md flex flex-col">
          <div
            className="p-6 rounded-b-[2rem] border-b shadow-2xl space-y-4"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <div
              className="flex justify-between items-center pb-2 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "var(--btn-primary)" }}
                />
                <span className="font-bold text-base uppercase tracking-tight">Brain Studio</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navTabs.map((t) => {
                const isSelected = currentTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onTabChange(t.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition text-left border shadow-xs"
                    style={{
                      backgroundColor: isSelected ? "var(--btn-primary)" : "var(--bg-card-secondary)",
                      color: isSelected ? "var(--btn-primary-text, #FFFFFF)" : "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <span>{t.emoji}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
