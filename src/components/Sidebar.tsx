import React from "react";
import {
  LayoutDashboard,
  Brain,
  GitBranch,
  Gamepad2,
  Swords,
  ShoppingBag,
  LogOut,
  Sparkles,
  Zap,
  GraduationCap,
  Cat,
  Palette,
} from "lucide-react";
import { UserProfile } from "../types";

export type TabId =
  | "dashboard"
  | "academic"
  | "sequence"
  | "lumina"
  | "mascot"
  | "games"
  | "guilds"
  | "store"
  | "colors";

interface SidebarProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  user: UserProfile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
}) => {
  const navItems = [
    {
      id: "dashboard" as TabId,
      label: "Brain Studio",
      icon: LayoutDashboard,
      emoji: "⚡",
    },
    {
      id: "academic" as TabId,
      label: "AVA IFES & Disciplinas",
      icon: GraduationCap,
      emoji: "🎓",
    },
    {
      id: "sequence" as TabId,
      label: "Trilha em Sequência",
      icon: GitBranch,
      emoji: "🗺️",
    },
    {
      id: "lumina" as TabId,
      label: "Lumina Socrática",
      icon: Brain,
      emoji: "🧠",
      highlight: true,
    },
    {
      id: "mascot" as TabId,
      label: "Laboratório Mascote",
      icon: Cat,
      emoji: "🐾",
    },
    {
      id: "games" as TabId,
      label: "Gerador por PDF",
      icon: Gamepad2,
      emoji: "🎮",
    },
    {
      id: "guilds" as TabId,
      label: "Área da Equipa & Duelos",
      icon: Swords,
      emoji: "⚔️",
    },
    {
      id: "store" as TabId,
      label: "Loja & Comida Pet",
      icon: ShoppingBag,
      emoji: "🛍️",
    },
    {
      id: "colors" as TabId,
      label: "Cores & Tema",
      icon: Palette,
      emoji: "🎨",
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-72 bg-[#0a0a0a] text-white flex-col justify-between p-6 hidden md:flex border-r border-white/5 select-none z-30 shrink-0 relative"
    >
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#161616] border border-white/10 rounded-2xl flex items-center justify-center text-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#e2ff31] opacity-20 blur-md" />
              <span>⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg tracking-tight uppercase text-white">Brain Studio</h2>
                <div className="w-2 h-2 rounded-full bg-[#e2ff31] animate-pulse" />
              </div>
              <span className="text-[10px] text-neutral-400 font-semibold tracking-widest uppercase flex items-center gap-1">
                Lumina Education AI
              </span>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
            Navegação Bento
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2 font-medium text-sm">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 text-left group ${
                  isActive
                    ? "bg-[#e2ff31] text-black font-bold shadow-lg shadow-[#e2ff31]/10 translate-x-1"
                    : "text-neutral-400 hover:text-white hover:bg-[#141414] border border-transparent hover:border-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.emoji}</span>
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#e2ff31] animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Status Bottom Bento Card */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="p-4 bg-[#141414] rounded-2xl border border-white/5 flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user.equippedBadge === "crown_gold" ? "👑" : "🎓"}
            </div>
            <div className="text-xs min-w-0">
              <div className="flex items-center gap-1.5">
                <p id="user-xp" className="font-extrabold text-[#e2ff31] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-[#e2ff31] text-[#e2ff31]" /> {user.xp} XP
                </p>
                <span className="text-[10px] bg-white/10 text-neutral-200 px-1.5 py-0.2 rounded-full font-bold">
                  Nv {user.level}
                </span>
              </div>
              <p
                id="user-email-tag"
                className="text-neutral-400 text-[11px] truncate font-medium max-w-[120px]"
                title={user.email}
              >
                {user.name || user.email}
              </p>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
