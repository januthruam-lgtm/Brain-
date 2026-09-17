import React, { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  Image,
  Utensils,
  Heart,
  Zap,
  Award,
  RotateCcw,
  Check,
  Flame,
  Info,
  Cookie,
  Apple,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import confetti from "canvas-confetti";
import { PetData, UserProfile } from "../../types";
import { PuppetPet } from "../PuppetPet";
import { speakText } from "../../utils/speech";

interface MascoteLabTabProps {
  user: UserProfile;
  onUpdatePet: (updatedPet: PetData) => void;
  onRewardXp?: (amount: number) => void;
  onNavigateToStore?: () => void;
  voiceEnabled?: boolean;
}

export const MascoteLabTab: React.FC<MascoteLabTabProps> = ({
  user,
  onUpdatePet,
  onRewardXp,
  onNavigateToStore,
  voiceEnabled = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [customName, setCustomName] = useState(user.pet?.name || "Pip");
  const [customTitle, setCustomTitle] = useState(user.pet?.title || "Mascote Acadêmico do IFES");
  const [isEditingName, setIsEditingName] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Safe fallback pet
  const currentPet: PetData = user.pet || {
    id: "pet_main",
    name: "Pip",
    title: "Mascote Acadêmico do IFES",
    baseModel: "capivara_ifes",
    level: 1,
    currentXp: 0,
    xpToNextLevel: 50,
    hungerLevel: 80,
    happinessLevel: 100,
    totalFedCount: 0,
    evolutionStage: 1,
    mood: "happy",
  };

  // Exponential XP requirement formula: 50 * (2 ** (level - 1))
  const getXpForLevel = (lvl: number) => 50 * Math.pow(2, lvl - 1);

  // Handle transparent PNG upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("image/png") && !file.type.includes("image/webp") && !file.type.includes("image/jpeg")) {
      alert("Por favor envie uma imagem PNG com fundo transparente ou WebP para melhor efeito puppet!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const updatedPet: PetData = {
        ...currentPet,
        customImageUrl: base64Url,
        baseModel: "custom",
      };
      onUpdatePet(updatedPet);
      triggerCelebration();
      setStatusMessage("✨ Mascote personalizado importado com sucesso no Mascote Lab!");
      if (voiceEnabled) {
        speakText(`Incrível! Seu novo mascote personalizado foi importado para o Brain Studio!`, true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    const updatedPet: PetData = {
      ...currentPet,
      customImageUrl: undefined,
      baseModel: "capivara_ifes",
    };
    onUpdatePet(updatedPet);
    setStatusMessage("Mascote redefinido para a Capivara Estudiosa do IFES!");
  };

  const handleSaveName = () => {
    if (!customName.trim()) return;
    const updatedPet: PetData = {
      ...currentPet,
      name: customName.trim(),
      title: customTitle.trim(),
    };
    onUpdatePet(updatedPet);
    setIsEditingName(false);
    setStatusMessage("Nome do mascote atualizado com sucesso!");
  };

  const triggerCelebration = () => {
    setIsCelebrating(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => setIsCelebrating(false), 2000);
  };

  // Feed the pet with user XP
  const handleFeedPet = (costInUserXp: number, xpToPet: number, foodName: string) => {
    if (user.xp < costInUserXp) {
      alert(`Você precisa de ${costInUserXp} XP para comprar ${foodName}. Ganhe mais XP estudando ou acertando quizzes!`);
      return;
    }

    // Deduct user XP
    if (onRewardXp) {
      onRewardXp(-costInUserXp);
    }

    // Calculate pet XP & level up
    let newPetXp = currentPet.currentXp + xpToPet;
    let newLevel = currentPet.level;
    let nextLevelTarget = getXpForLevel(newLevel);
    let evolved = false;

    while (newPetXp >= nextLevelTarget) {
      newPetXp -= nextLevelTarget;
      newLevel += 1;
      nextLevelTarget = getXpForLevel(newLevel);
      evolved = true;
    }

    const updatedPet: PetData = {
      ...currentPet,
      level: newLevel,
      currentXp: newPetXp,
      xpToNextLevel: nextLevelTarget,
      hungerLevel: Math.min(100, currentPet.hungerLevel + 25),
      happinessLevel: Math.min(100, currentPet.happinessLevel + 20),
      totalFedCount: currentPet.totalFedCount + 1,
      evolutionStage: Math.min(4, newLevel),
      mood: evolved ? "excited" : "happy",
    };

    onUpdatePet(updatedPet);
    triggerCelebration();

    if (evolved) {
      setStatusMessage(`🎉 INCRÍVEL! ${currentPet.name} evoluiu para o Nível ${newLevel}! O custo para a próxima evolução dobrou (${nextLevelTarget} XP).`);
      if (voiceEnabled) {
        speakText(`Parabéns! Seu pet ${currentPet.name} evoluiu para o Nível ${newLevel}!`, true);
      }
    } else {
      setStatusMessage(`🍽️ Você alimentou ${currentPet.name} com ${foodName}! (+${xpToPet} XP de Pet)`);
      if (voiceEnabled) {
        speakText(`Hmm, delicioso! ${currentPet.name} adorou a refeição!`, true);
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Tab Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--btn-primary)] text-white">
              Puppet Studio & Evolução Exponencial
            </span>
            <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 100% Personalizável
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Mascote Lab 🐾
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl">
            Crie, faça upload e alimente seu mascote oficial do IFES. Ele possui animação
            fluida orgânica Puppet e progride com requisitos exponenciais de XP!
          </p>
        </div>

        {/* Quick User XP Counter */}
        <div className="flex items-center gap-3 bg-[var(--bg-card-secondary)] border border-[var(--border-color)] px-5 py-3 rounded-2xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Zap className="w-5 h-5 fill-yellow-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
              Seu Saldo de XP
            </span>
            <span className="text-xl font-extrabold text-[var(--text-primary)] font-mono">
              {user.xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Puppet Stage & Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Puppet Stage */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm relative overflow-hidden">
          {/* Ambient Background Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--btn-primary)]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Puppet Mascot */}
          <PuppetPet
            pet={currentPet}
            size="lg"
            isCelebrating={isCelebrating}
            onPetClick={triggerCelebration}
            showStats={true}
          />

          {/* Edit Name Button & Modal Trigger */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {isEditingName ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--bg-card-secondary)] p-2 rounded-2xl border border-[var(--border-color)]">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nome do Mascote"
                  className="px-3 py-1.5 rounded-xl text-sm font-bold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
                />
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Título do Mascote"
                  className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-[var(--btn-primary)] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-full transition cursor-pointer"
              >
                ✏️ Renomear Mascote
              </button>
            )}

            {currentPet.customImageUrl && (
              <button
                onClick={handleResetToDefault}
                className="text-xs font-bold text-neutral-500 hover:text-red-500 bg-[var(--bg-card-secondary)] px-4 py-2 rounded-full transition cursor-pointer"
                title="Voltar para a Capivara padrão do IFES"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Usar Capivara IFES
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold text-center animate-fadeIn">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right Column: Upload Custom Pet & Feeding Station */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Custom Pet Image Upload (Puppet Integration) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--btn-primary)]/10 text-[var(--btn-primary)] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Upload do Próprio Pet
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Suba uma imagem PNG com fundo transparente para virar sua marionete
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png,image/webp,image/jpeg"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--btn-primary)] rounded-2xl p-6 text-center cursor-pointer transition bg-[var(--bg-card-secondary)] hover:bg-[var(--bg-card)] space-y-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--btn-primary)]/10 text-[var(--btn-primary)] flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <Image className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Clique para selecionar seu arquivo PNG
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Recomendado: Imagem PNG quadrada (512x512) com fundo transparente
              </p>
            </div>
          </div>

          {/* Card 2: Alimentação por XP (Pet Food Feeder) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Alimentar com XP
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Transforme seu XP de estudos em evolução para o mascote
                  </p>
                </div>
              </div>

              {onNavigateToStore && (
                <button
                  onClick={onNavigateToStore}
                  className="text-xs font-bold text-[var(--btn-primary)] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Ver Loja
                </button>
              )}
            </div>

            {/* Food Items List */}
            <div className="space-y-3">
              {/* Food 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] hover:border-[var(--btn-primary)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                    🍪
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)] block">
                      Petisco de Foco
                    </span>
                    <span className="text-xs text-[var(--color-success)] font-semibold">
                      +25 XP Pet (+20% Felicidade)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleFeedPet(30, 25, "Petisco de Foco")}
                  disabled={user.xp < 30}
                  className="bg-[var(--btn-primary)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-sm disabled:cursor-not-allowed"
                >
                  Dar (30 XP)
                </button>
              </div>

              {/* Food 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] hover:border-[var(--btn-primary)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">
                    🍎
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)] block">
                      Maçã do Conhecimento IFES
                    </span>
                    <span className="text-xs text-[var(--color-success)] font-semibold">
                      +60 XP Pet (+40% Felicidade)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleFeedPet(60, 60, "Maçã do Conhecimento")}
                  disabled={user.xp < 60}
                  className="bg-[var(--btn-primary)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-sm disabled:cursor-not-allowed"
                >
                  Dar (60 XP)
                </button>
              </div>

              {/* Food 3 */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] hover:border-[var(--btn-primary)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                    🧪
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)] block">
                      Elixir da Sabedoria Socrática
                    </span>
                    <span className="text-xs text-[var(--color-success)] font-semibold">
                      +150 XP Pet (Impulso Épico)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleFeedPet(120, 150, "Elixir da Sabedoria")}
                  disabled={user.xp < 120}
                  className="bg-[var(--btn-primary)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-sm disabled:cursor-not-allowed"
                >
                  Dar (120 XP)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exponential Progression Info Guide */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--btn-primary)]" />
          Como funciona a Progressão Exponencial de Evolução:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Nível 1 (Inicial)</span>
            <p className="font-extrabold text-base text-[var(--text-primary)]">Meta: 50 XP</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Aparência jovem com broto acadêmico</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Nível 2 (2x Meta)</span>
            <p className="font-extrabold text-base text-[var(--text-primary)]">Meta: 100 XP</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Ganha Óculos Socráticos de Leitura</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Nível 3 (4x Meta)</span>
            <p className="font-extrabold text-base text-[var(--text-primary)]">Meta: 200 XP</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Ganha Capelo de Formando IFES</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card-secondary)] border border-[var(--border-color)] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Nível 4+ (8x Meta...)</span>
            <p className="font-extrabold text-base text-[var(--text-primary)]">Meta: 400 XP+</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Aura dourada e sabedoria infinita</p>
          </div>
        </div>
      </div>
    </div>
  );
};
