import React from "react";
import { Sparkles, Zap, Check, Crown, Palette, ShieldAlert, Coins } from "lucide-react";
import confetti from "canvas-confetti";
import { StoreItem, ThemeId, UserProfile } from "../../types";
import { STORE_ITEMS } from "../../data/initialData";
import { playCoinCascade, playCoinSound } from "../../utils/audio";

interface StoreTabProps {
  user: UserProfile;
  onBuyTheme: (themeId: ThemeId, cost: number) => void;
  onEquipTheme: (themeId: ThemeId) => void;
  onBuyBadge: (badgeId: string, cost: number) => void;
  onEquipBadge: (badgeId: string) => void;
  onBuyEnergy?: (amount: number, cost: number) => void;
  onBuyPetFood?: (item: StoreItem) => void;
  onUpgradeMaxEnergy?: (amount: number, cost: number) => void;
}

export const StoreTab: React.FC<StoreTabProps> = ({
  user,
  onBuyTheme,
  onEquipTheme,
  onBuyBadge,
  onEquipBadge,
  onBuyEnergy,
  onBuyPetFood,
  onUpgradeMaxEnergy,
}) => {
  const handlePurchase = (item: StoreItem) => {
    if (user.xp < item.cost) {
      alert("XP insuficiente! Complete mais lições da trilha, quizzes ou duelos para acumular XP.");
      return;
    }

    if (item.type === "pet_food") {
      if (onBuyPetFood) {
        onBuyPetFood(item);
        playCoinCascade(4);
        confetti({ particleCount: 70, spread: 60 });
      }
      return;
    }

    if (item.type === "permanent_energy" && item.permanentMaxEnergy) {
      if (onUpgradeMaxEnergy) {
        onUpgradeMaxEnergy(item.permanentMaxEnergy, item.cost);
        playCoinCascade(6);
        confetti({ particleCount: 80, spread: 70 });
      }
      return;
    }

    if (item.type === "energy") {
      const maxEnergy = user.maxEnergy ?? 10;
      const currentEnergy = user.energy ?? 10;
      if (currentEnergy >= maxEnergy) {
        alert("Sua energia já está no nível máximo!");
        return;
      }
      if (onBuyEnergy && item.energyAmount) {
        onBuyEnergy(item.energyAmount, item.cost);
        playCoinCascade(4);
        confetti({ particleCount: 70, spread: 60 });
      }
      return;
    }

    if (item.type === "theme" && item.themeId) {
      if (user.unlockedThemes.includes(item.themeId)) {
        onEquipTheme(item.themeId);
        playCoinSound(987);
        return;
      }
      onBuyTheme(item.themeId, item.cost);
      playCoinCascade(5);
      confetti({ particleCount: 70, spread: 60 });
    } else if (item.type === "badge" && item.badgeId) {
      if (user.unlockedBadges.includes(item.badgeId)) {
        onEquipBadge(item.badgeId);
        playCoinSound(987);
        return;
      }
      onBuyBadge(item.badgeId, item.cost);
      playCoinCascade(5);
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  return (
    <section id="tab-store" className="p-5 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="bg-[#111111] p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Subtle Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#e2ff31] opacity-5 blur-[100px] pointer-events-none" />

        {/* Store Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-white/5 relative z-10">
          <div>
            <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-semibold">
              Recompensas & Customização
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-1">
              Loja de Recompensas
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Gaste seu XP e moedas acumulados para desbloquear temas visuais futuristas, cores exclusivas e brasões lendários.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-2xl">
              <span className="text-lg">🪙</span>
              <div>
                <div className="text-xs text-neutral-400 font-medium">Moedas</div>
                <div className="text-sm font-extrabold text-amber-400 font-mono">
                  {(user.coins ?? 250).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-2xl">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div>
                <div className="text-xs text-neutral-400 font-medium">Saldo XP</div>
                <div className="text-sm font-extrabold text-white font-mono">
                  {user.xp} XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {STORE_ITEMS.map((item) => {
            const isTheme = item.type === "theme";
            const isUnlocked = isTheme
              ? item.themeId && user.unlockedThemes.includes(item.themeId)
              : item.badgeId && user.unlockedBadges.includes(item.badgeId);

            const isEquipped = isTheme
              ? user.activeTheme === item.themeId
              : user.equippedBadge === item.badgeId;

            const canAfford = user.xp >= item.cost;

            return (
              <div
                key={item.id}
                className={`p-6 sm:p-7 border rounded-[2rem] flex flex-col justify-between gap-5 transition-all ${
                  isEquipped
                    ? "border-[#e2ff31]/60 bg-[#161616] ring-1 ring-[#e2ff31]/20 shadow-lg shadow-[#e2ff31]/5"
                    : isUnlocked
                    ? "border-white/10 bg-[#141414]"
                    : "border-white/5 bg-[#121212] hover:border-white/15"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {item.badgeEmoji || (isTheme ? "🎨" : "👑")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{item.name}</h4>
                      {isEquipped && (
                        <span className="bg-[#e2ff31] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Equipado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs font-bold text-neutral-300 font-mono">
                    {isUnlocked ? "Adquirido" : `${item.cost} XP`}
                  </span>

                  <button
                    onClick={() => handlePurchase(item)}
                    className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                      isEquipped
                        ? "bg-[#222] text-neutral-400 cursor-default border border-white/5"
                        : isUnlocked
                        ? "bg-[#e2ff31] hover:bg-[#d4f222] text-black"
                        : canAfford
                        ? "bg-[#e2ff31] hover:bg-[#d4f222] text-black shadow-md"
                        : "bg-[#181818] text-neutral-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Em Uso
                      </>
                    ) : isUnlocked ? (
                      "Equipar"
                    ) : (
                      `Comprar (${item.cost} XP)`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
