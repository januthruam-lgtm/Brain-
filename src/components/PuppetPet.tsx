import React from "react";
import { Sparkles, Heart, Zap, Flame, Award, Utensils } from "lucide-react";
import { PetData } from "../types";

interface PuppetPetProps {
  pet: PetData;
  size?: "sm" | "md" | "lg" | "xl";
  isCelebrating?: boolean;
  onPetClick?: () => void;
  showStats?: boolean;
}

export const PuppetPet: React.FC<PuppetPetProps> = ({
  pet,
  size = "md",
  isCelebrating = false,
  onPetClick,
  showStats = true,
}) => {
  // Dimensions based on size
  const sizeClasses = {
    sm: "w-28 h-28",
    md: "w-48 h-48",
    lg: "w-64 h-64",
    xl: "w-80 h-80",
  }[size];

  const petXpPercentage = Math.min(
    100,
    Math.round((pet.currentXp / Math.max(1, pet.xpToNextLevel)) * 100)
  );

  return (
    <div className="flex flex-col items-center select-none">
      {/* Puppet Marionette Visual Container */}
      <div
        onClick={onPetClick}
        className={`relative ${sizeClasses} cursor-pointer group flex items-center justify-center`}
        title={`Clique para interagir com ${pet.name}!`}
      >
        {/* Soft Ambient Glow under the Pet */}
        <div
          className={`absolute bottom-2 w-3/4 h-8 bg-black/10 rounded-full blur-md transition-all duration-500 ${
            isCelebrating ? "scale-125 opacity-40" : "scale-100 opacity-20"
          }`}
        />

        {/* Custom Uploaded Transparent PNG or Built-in Marionette */}
        {pet.customImageUrl ? (
          <div
            className={`relative w-full h-full flex items-center justify-center ${
              isCelebrating ? "puppet-celebrating" : "puppet-custom-mesh"
            }`}
          >
            <img
              src={pet.customImageUrl}
              alt={pet.name}
              className="max-w-full max-h-full object-contain filter drop-shadow-lg"
              referrerPolicy="no-referrer"
            />
            {/* Sparkling Aura for Custom Pet */}
            {pet.level > 1 && (
              <div className="absolute top-2 right-2 text-yellow-500 animate-bounce">
                <Sparkles className="w-5 h-5 fill-yellow-400" />
              </div>
            )}
          </div>
        ) : (
          /* Built-in Capivara / Socratic Mascot Puppet with Separate Animated Joints */
          <div
            className={`relative w-full h-full flex items-center justify-center ${
              isCelebrating ? "puppet-celebrating" : "puppet-body"
            }`}
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full filter drop-shadow-md overflow-visible"
            >
              {/* Ground Shadow */}
              <ellipse cx="100" cy="180" rx="60" ry="12" fill="#000000" opacity="0.12" />

              {/* TAIL (Independent pendulum animation) */}
              <g className="puppet-tail" style={{ transformOrigin: "155px 145px" }}>
                <path
                  d="M 148 140 Q 170 142 165 155 Q 155 160 145 148 Z"
                  fill="#78350F"
                />
              </g>

              {/* TORSO / MAIN BODY (Organic Breathing) */}
              <g className="puppet-body" style={{ transformOrigin: "100px 170px" }}>
                {/* Back Feet */}
                <ellipse cx="65" cy="168" rx="14" ry="9" fill="#5C2607" />
                <ellipse cx="135" cy="168" rx="14" ry="9" fill="#5C2607" />

                {/* Main Torso */}
                <ellipse cx="100" cy="132" rx="52" ry="42" fill="#92400E" />
                {/* Belly patch */}
                <ellipse cx="100" cy="138" rx="34" ry="26" fill="#B45309" opacity="0.75" />

                {/* IFES Badge on Torso */}
                <circle cx="100" cy="135" r="10" fill="#2F855A" />
                <circle cx="100" cy="135" r="7" fill="#FFFFFF" />
                <rect x="98.5" y="130" width="3" height="10" fill="#2F855A" rx="1" />
                <rect x="95" y="133.5" width="10" height="3" fill="#2F855A" rx="1" />
              </g>

              {/* LEFT PAW (Independent Swaying Animation) */}
              <g className="puppet-paw-left" style={{ transformOrigin: "70px 140px" }}>
                <ellipse cx="68" cy="148" rx="10" ry="8" fill="#78350F" />
                {/* Claws */}
                <circle cx="62" cy="151" r="1.5" fill="#3E1A04" />
                <circle cx="68" cy="153" r="1.5" fill="#3E1A04" />
                <circle cx="74" cy="151" r="1.5" fill="#3E1A04" />
              </g>

              {/* RIGHT PAW (Independent Swaying Animation) */}
              <g className="puppet-paw-right" style={{ transformOrigin: "130px 140px" }}>
                <ellipse cx="132" cy="148" rx="10" ry="8" fill="#78350F" />
                {/* Claws */}
                <circle cx="126" cy="151" r="1.5" fill="#3E1A04" />
                <circle cx="132" cy="153" r="1.5" fill="#3E1A04" />
                <circle cx="138" cy="151" r="1.5" fill="#3E1A04" />
              </g>

              {/* HEAD ASSEMBLY (Tilting & Bobbing with transform-origin at neck) */}
              <g className="puppet-head" style={{ transformOrigin: "100px 110px" }}>
                {/* LEFT EAR (Fluttering Marionette Joint) */}
                <g className="puppet-ear-left" style={{ transformOrigin: "65px 65px" }}>
                  <ellipse cx="62" cy="58" rx="11" ry="14" fill="#78350F" transform="rotate(-20 62 58)" />
                  <ellipse cx="63" cy="59" rx="6" ry="9" fill="#F472B6" opacity="0.6" transform="rotate(-20 63 59)" />
                </g>

                {/* RIGHT EAR (Fluttering Marionette Joint) */}
                <g className="puppet-ear-right" style={{ transformOrigin: "135px 65px" }}>
                  <ellipse cx="138" cy="58" rx="11" ry="14" fill="#78350F" transform="rotate(20 138 58)" />
                  <ellipse cx="137" cy="59" rx="6" ry="9" fill="#F472B6" opacity="0.6" transform="rotate(20 137 59)" />
                </g>

                {/* Head Base */}
                <rect x="64" y="58" width="72" height="60" rx="26" fill="#92400E" />
                {/* Snout */}
                <rect x="76" y="82" width="48" height="34" rx="16" fill="#78350F" />
                {/* Cute Nose */}
                <ellipse cx="100" cy="88" rx="9" ry="5" fill="#1C1917" />
                {/* Cute Mouth */}
                <path d="M 96 95 Q 100 98 104 95" stroke="#1C1917" strokeWidth="2.5" fill="transparent" strokeLinecap="round" />

                {/* EYES (Independent Blinking Animation) */}
                <g className="puppet-eyes" style={{ transformOrigin: "100px 75px" }}>
                  {/* Left Eye */}
                  <circle cx="80" cy="74" r="6" fill="#1C1917" />
                  <circle cx="82" cy="72" r="2.2" fill="#FFFFFF" />
                  <circle cx="78.5" cy="75.5" r="1" fill="#FFFFFF" />

                  {/* Right Eye */}
                  <circle cx="120" cy="74" r="6" fill="#1C1917" />
                  <circle cx="122" cy="72" r="2.2" fill="#FFFFFF" />
                  <circle cx="118.5" cy="75.5" r="1" fill="#FFFFFF" />
                </g>

                {/* Cute Cheeks */}
                <circle cx="72" cy="84" r="5" fill="#F43F5E" opacity="0.35" />
                <circle cx="128" cy="84" r="5" fill="#F43F5E" opacity="0.35" />

                {/* Socratic Scholar Glasses for Level 2+ */}
                {pet.level >= 2 && (
                  <g>
                    <circle cx="80" cy="74" r="10" stroke="#5D5CDE" strokeWidth="2.5" fill="rgba(255,255,255,0.2)" />
                    <circle cx="120" cy="74" r="10" stroke="#5D5CDE" strokeWidth="2.5" fill="rgba(255,255,255,0.2)" />
                    <line x1="90" y1="74" x2="110" y2="74" stroke="#5D5CDE" strokeWidth="2.5" />
                  </g>
                )}

                {/* Graduation Cap / Capelo Acadêmico for Level 3+ */}
                {pet.level >= 3 && (
                  <g transform="translate(0, -12)">
                    <polygon points="100,30 145,45 100,60 55,45" fill="#1E1B4B" />
                    <polygon points="100,28 145,43 100,58 55,43" fill="#312E81" />
                    <rect x="75" y="48" width="50" height="12" rx="4" fill="#1E1B4B" />
                    {/* Tassel */}
                    <circle cx="100" cy="43" r="2.5" fill="#F59E0B" />
                    <path d="M 100 43 Q 130 50 135 68" stroke="#F59E0B" strokeWidth="2" fill="none" />
                    <rect x="133" y="66" width="4" height="8" rx="1" fill="#F59E0B" />
                  </g>
                )}

                {/* Golden Halo / Sparkles for Level 4+ */}
                {pet.level >= 4 && (
                  <g transform="translate(0, -28)">
                    <ellipse cx="100" cy="38" rx="35" ry="8" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="4 2" />
                  </g>
                )}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Pet Header & Level Badge */}
      <div className="text-center mt-2 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h4 className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight">
            {pet.name}
          </h4>
          <span className="inline-flex items-center gap-1 text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--btn-primary)] text-white shadow-sm">
            <Award className="w-3 h-3" /> Nv. {pet.level}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {pet.title || "Mascote Acadêmico do IFES"}
        </p>
      </div>

      {/* Dedicated Exponential XP Progress Bar */}
      {showStats && (
        <div className="w-full max-w-xs mt-3 space-y-1.5 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-secondary)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              XP de Evolução:
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {pet.currentXp} / {pet.xpToNextLevel} XP
            </span>
          </div>

          <div className="w-full h-3 bg-neutral-200/60 rounded-full overflow-hidden p-0.5 border border-black/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--btn-primary)] to-[var(--color-success)] transition-all duration-500"
              style={{ width: `${petXpPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>Nv. {pet.level}</span>
            <span>Meta dobra a cada evolução (2x)</span>
            <span>Nv. {pet.level + 1}</span>
          </div>

          {/* Quick Pet Vital Stats */}
          <div className="pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between bg-[var(--bg-card-secondary)] px-2.5 py-1.5 rounded-xl">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Utensils className="w-3 h-3 text-amber-500" /> Fome:
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {pet.hungerLevel}%
              </span>
            </div>
            <div className="flex items-center justify-between bg-[var(--bg-card-secondary)] px-2.5 py-1.5 rounded-xl">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Felicidade:
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {pet.happinessLevel}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
