import React, { useState } from "react";
import {
  Shield,
  Crown,
  Sparkles,
  X,
  Flame,
  Check,
  Users,
  Swords,
  BookOpen,
  Target,
  Rocket,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";
import { UserProfile, GuildInfo } from "../types";
import { createCustomGuild } from "../services/guildService";

interface CreateGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onGuildCreated: (newGuild: GuildInfo, updatedList: GuildInfo[]) => void;
}

const CREST_OPTIONS = [
  { emoji: "⚡", label: "Relâmpago" },
  { emoji: "🌌", label: "Galáxia" },
  { emoji: "🧬", label: "DNA / Bio" },
  { emoji: "🛡️", label: "Escudo" },
  { emoji: "👑", label: "Coroa" },
  { emoji: "🦅", label: "Águia" },
  { emoji: "🐉", label: "Dragão" },
  { emoji: "🚀", label: "Foguete" },
  { emoji: "💻", label: "Código" },
  { emoji: "🧠", label: "Mente" },
  { emoji: "⚖️", label: "Justiça" },
  { emoji: "🏛️", label: "Academia" },
  { emoji: "🔥", label: "Fênix" },
  { emoji: "🎯", label: "Alvo" },
  { emoji: "📚", label: "Livro" },
  { emoji: "💎", label: "Diamante" },
];

const CATEGORY_OPTIONS = [
  "Multidisciplinar & Geral",
  "Exatas & Engenharia",
  "Biológicas & Medicina",
  "Humanas & Sociais",
  "Tecnologia & IA",
  "Direito & Concursos",
  "ENEM & Vestibulares",
  "Idiomas & Comunicação",
];

const BANNER_GRADIENTS = [
  { id: "amber", name: "Ouro Solar", class: "from-amber-600/30 via-yellow-700/20 to-neutral-900/40", border: "border-amber-500/30" },
  { id: "purple", name: "Cósmico", class: "from-purple-600/30 via-indigo-700/20 to-neutral-900/40", border: "border-purple-500/30" },
  { id: "emerald", name: "Esmeralda", class: "from-emerald-600/30 via-teal-700/20 to-neutral-900/40", border: "border-emerald-500/30" },
  { id: "sky", name: "Cibernético", class: "from-sky-600/30 via-blue-700/20 to-neutral-900/40", border: "border-sky-500/30" },
  { id: "rose", name: "Rubi Real", class: "from-rose-600/30 via-pink-700/20 to-neutral-900/40", border: "border-rose-500/30" },
];

export const CreateGuildModal: React.FC<CreateGuildModalProps> = ({
  isOpen,
  onClose,
  user,
  onGuildCreated,
}) => {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [crest, setCrest] = useState("⚡");
  const [category, setCategory] = useState("Multidisciplinar & Geral");
  const [motto, setMotto] = useState("");
  const [description, setDescription] = useState("");
  const [bannerColor, setBannerColor] = useState(BANNER_GRADIENTS[0].class);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate tag preview if empty
  const computedTag = tag
    ? tag.startsWith("#") ? tag.toUpperCase() : `#${tag.toUpperCase()}`
    : name.trim().length >= 3
    ? `#${name.trim().slice(0, 4).toUpperCase()}`
    : "#EQUIPE";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      setErrorMsg("O nome da equipe deve ter pelo menos 3 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await createCustomGuild(
        {
          name: name.trim(),
          tag: computedTag,
          crest,
          category,
          motto: motto.trim() || "Unidos pela busca contínua do conhecimento!",
          description:
            description.trim() ||
            `Equipe oficial fundada por ${user.name} dedicada a ${category}.`,
          bannerColor,
        },
        user
      );

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
      });

      onGuildCreated(res.guild, res.allGuilds);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocorreu um erro ao criar a equipe. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#111111] border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative my-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="bg-[#e2ff31] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Fundação de Comunidade
            </span>
            <span className="text-neutral-500 text-xs font-mono">Você será o Líder</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Criar Minha Própria Equipe</span>
            <Crown className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Fundar uma equipe reúne estudantes com o mesmo foco, soma XP em conjunto no Ranking Global e gera estandartes exclusivos.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Guild Live Preview Banner */}
          <div
            className={`p-5 rounded-3xl border border-white/10 bg-gradient-to-r ${bannerColor} relative overflow-hidden transition-all duration-300`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#141414]/90 border border-white/15 flex items-center justify-center text-3xl shadow-lg shrink-0">
                {crest}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white truncate">
                    {name.trim() || "Nome da Sua Nova Equipe"}
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#e2ff31] bg-black/40 px-2 py-0.5 rounded-md border border-[#e2ff31]/20">
                    {computedTag}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 italic mt-0.5 truncate">
                  "{motto.trim() || "O lema da sua equipe aparecerá aqui..."}"
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400">
                  <span>📌 {category}</span>
                  <span>👑 Líder: {user.name.split(" ")[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Guild Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Nome da Equipe *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alquimistas do Saber, Devs Noturnos"
                maxLength={32}
                required
                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#e2ff31] outline-none transition"
              />
            </div>

            {/* Tag / Sigla */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">
                Tag / Sigla <span className="text-neutral-500 font-normal">(Ex: #DEV, #MED)</span>
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value.replace(/[^a-zA-Z0-9#]/g, "").slice(0, 7))}
                placeholder="Ex: #ALQ, #TITAS"
                maxLength={7}
                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono uppercase focus:border-[#e2ff31] outline-none transition"
              />
            </div>
          </div>

          {/* Crest Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
              <span>Brasão / Emblema da Equipe</span>
              <span className="text-neutral-500 text-[11px]">Selecione um ícone</span>
            </label>
            <div className="grid grid-cols-8 gap-2 p-3 bg-[#141414] rounded-2xl border border-white/5 max-h-36 overflow-y-auto">
              {CREST_OPTIONS.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setCrest(item.emoji)}
                  className={`h-11 rounded-xl flex items-center justify-center text-xl transition ${
                    crest === item.emoji
                      ? "bg-[#e2ff31] text-black scale-105 shadow-md font-bold"
                      : "bg-[#1f1f1f] hover:bg-[#282828] text-white"
                  }`}
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Foco de Estudo Principal</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:border-[#e2ff31] outline-none transition cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Banner Theme */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Cor do Estandarte</label>
              <div className="flex gap-2">
                {BANNER_GRADIENTS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBannerColor(bg.class)}
                    className={`flex-1 h-10 rounded-xl bg-gradient-to-r ${bg.class} border ${
                      bannerColor === bg.class ? "border-[#e2ff31] ring-2 ring-[#e2ff31]/40" : "border-white/10"
                    } transition flex items-center justify-center text-[10px] font-bold text-white`}
                    title={bg.name}
                  >
                    {bannerColor === bg.class && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Motto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300">
              Lema / Grito de Guerra <span className="text-neutral-500 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Ex: Conhecimento é a nossa maior arma!"
              maxLength={70}
              className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#e2ff31] outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300">
              Descrição e Regras de Convivência
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte para outros estudantes qual o objetivo da sua equipe e como vocês estudam juntos..."
              rows={2}
              maxLength={200}
              className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:border-[#e2ff31] outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition border border-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-[#e2ff31] hover:bg-[#d4f222] text-black py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Crown className="w-4 h-4 text-black" />
              <span>{isSubmitting ? "Fundando Equipe..." : "Fundar Equipe Agora"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
