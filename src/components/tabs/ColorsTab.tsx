import React, { useState } from "react";
import { Palette, Check, Sparkles, Sliders, RefreshCw, Eye, Save } from "lucide-react";
import { CustomThemeConfig, ThemeId, UserProfile } from "../../types";
import { DEFAULT_THEMES_CONFIG } from "../../data/initialData";
import { applyThemeToDOM } from "../../utils/theme";
import confetti from "canvas-confetti";
import { speakText } from "../../utils/speech";

interface ColorsTabProps {
  user: UserProfile;
  onSelectTheme?: (themeId: ThemeId) => void;
  onSaveCustomTheme?: (config: CustomThemeConfig) => void;
  onUpdateTheme?: (themeId: ThemeId, config?: CustomThemeConfig) => void;
}

export const ColorsTab: React.FC<ColorsTabProps> = ({
  user,
  onSelectTheme,
  onSaveCustomTheme,
  onUpdateTheme,
}) => {
  const [currentConfig, setCurrentConfig] = useState<CustomThemeConfig>(() => {
    return (
      user.customThemeConfig ||
      DEFAULT_THEMES_CONFIG[user.activeTheme] ||
      DEFAULT_THEMES_CONFIG.paper_focus
    );
  });
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(user.activeTheme || "paper_focus");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Notify parent state safely
  const notifyParent = (themeId: ThemeId, config: CustomThemeConfig) => {
    if (onUpdateTheme) {
      onUpdateTheme(themeId, config);
    }
    if (onSelectTheme) {
      onSelectTheme(themeId);
    }
    if (themeId === "custom" && onSaveCustomTheme) {
      onSaveCustomTheme(config);
    }
  };

  // Handle preset selection
  const handleSelectPreset = (themeId: ThemeId) => {
    const config = DEFAULT_THEMES_CONFIG[themeId];
    if (!config) return;

    setActiveThemeId(themeId);
    setCurrentConfig(config);

    // 1. Immediately apply to DOM (:root CSS Variables)
    applyThemeToDOM(themeId, config);

    // 2. Propagate to parent & localStorage
    notifyParent(themeId, config);

    setSuccessMsg(`Paleta "${config.name}" aplicada instantaneamente!`);
    setTimeout(() => setSuccessMsg(null), 3000);
    speakText(`Paleta ${config.name} ativada.`, false);
  };

  // Handle real-time color picking
  const handleColorChange = (key: keyof CustomThemeConfig, value: string) => {
    const updated: CustomThemeConfig = {
      ...currentConfig,
      id: "custom",
      name: "Paleta Personalizada",
      [key]: value,
    };

    setActiveThemeId("custom");
    setCurrentConfig(updated);

    // Immediate DOM update for instant responsiveness
    applyThemeToDOM("custom", updated);
    notifyParent("custom", updated);
  };

  // Save custom theme explicitly
  const handleSaveCustom = () => {
    applyThemeToDOM("custom", currentConfig);
    notifyParent("custom", currentConfig);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setSuccessMsg("Paleta personalizada salva com sucesso no seu perfil!");
    setTimeout(() => setSuccessMsg(null), 3500);
    speakText("Cores salvas com sucesso!", false);
  };

  // Reset to default Paper & Focus
  const handleResetToDefault = () => {
    handleSelectPreset("paper_focus");
  };

  const presetList: ThemeId[] = [
    "paper_focus",
    "ifes_green",
    "solar",
    "sunset",
    "midnight",
    "emerald",
    "cyberpunk",
  ];

  return (
    <div id="tab-colors" className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div
        className="border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs"
              style={{
                backgroundColor: "var(--btn-primary)",
                color: "var(--btn-primary-text, #FFFFFF)",
              }}
            >
              Motor CSS Variables
            </span>
            <span
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: "var(--color-success)" }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Reatividade Instantânea
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalização de Cores 🎨
          </h2>
          <p
            className="text-sm max-w-xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Ajuste a paleta de cores do Brain Studio em tempo real. As alterações são aplicadas diretamente no elemento <code className="font-mono px-1.5 py-0.5 rounded bg-black/10 text-xs">:root</code> e salvas automaticamente no <code className="font-mono px-1.5 py-0.5 rounded bg-black/10 text-xs">localStorage</code>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl border transition cursor-pointer shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <RefreshCw className="w-4 h-4" /> Restaurar Paper & Focus
          </button>
        </div>
      </div>

      {successMsg && (
        <div
          className="p-3.5 rounded-2xl border text-xs font-bold text-center animate-fadeIn shadow-xs"
          style={{
            backgroundColor: "rgba(56, 161, 105, 0.12)",
            borderColor: "var(--color-success)",
            color: "var(--color-success)",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Preset Palettes Section */}
      <div
        className="border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" style={{ color: "var(--btn-primary)" }} />
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Paletas Prontas & Harmônicas
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {presetList.map((presetId) => {
            const config = DEFAULT_THEMES_CONFIG[presetId];
            if (!config) return null;
            const isSelected = activeThemeId === presetId;

            return (
              <button
                key={presetId}
                type="button"
                onClick={() => handleSelectPreset(presetId)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between gap-3 relative overflow-hidden group ${
                  isSelected ? "ring-2 shadow-md" : "hover:scale-[1.02]"
                }`}
                style={{
                  backgroundColor: config.bgMain,
                  borderColor: isSelected ? config.btnPrimary : "rgba(150, 150, 150, 0.2)",
                  color: config.textPrimary,
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs" style={{ color: config.textPrimary }}>
                    {config.name}
                  </span>
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs"
                      style={{ backgroundColor: config.btnPrimary }}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Color swatches preview */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/10 backdrop-blur-xs w-full">
                  <div
                    className="w-6 h-6 rounded-lg border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: config.bgMain }}
                    title="Fundo"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: config.bgCard }}
                    title="Cards"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: config.btnPrimary }}
                    title="Botão Principal"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: config.colorSuccess }}
                    title="Sucesso"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-black/20 shadow-xs shrink-0"
                    style={{ backgroundColor: config.textPrimary }}
                    title="Texto"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Custom Color Pickers */}
      <div
        className="border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5" style={{ color: "var(--btn-primary)" }} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Ajuste Fino de Cores (Seletor Livre)
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Modifique qualquer valor hexadecimal ou selecione a cor. A interface atualiza instantaneamente.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveCustom}
            className="flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md cursor-pointer transition"
            style={{
              backgroundColor: "var(--btn-primary)",
              color: "var(--btn-primary-text, #FFFFFF)",
            }}
          >
            <Save className="w-4 h-4" /> Salvar Paleta Personalizada
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Fundo Principal (--bg-main / --bg-color) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Fundo Principal (--bg-color)
              </span>
              <input
                type="text"
                value={currentConfig.bgMain}
                onChange={(e) => handleColorChange("bgMain", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.bgMain.startsWith("#") ? currentConfig.bgMain : "#F8F7F2"}
                onChange={(e) => handleColorChange("bgMain", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Cards & Containers (--bg-card) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Cards & Painéis (--bg-card)
              </span>
              <input
                type="text"
                value={currentConfig.bgCard}
                onChange={(e) => handleColorChange("bgCard", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.bgCard.startsWith("#") ? currentConfig.bgCard : "#FFFFFF"}
                onChange={(e) => handleColorChange("bgCard", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Botão Primário (--btn-primary) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Botão Primário (--btn-primary)
              </span>
              <input
                type="text"
                value={currentConfig.btnPrimary}
                onChange={(e) => handleColorChange("btnPrimary", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.btnPrimary.startsWith("#") ? currentConfig.btnPrimary : "#5D5CDE"}
                onChange={(e) => handleColorChange("btnPrimary", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Cor de Sucesso (--color-success) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Cor de Sucesso (--color-success)
              </span>
              <input
                type="text"
                value={currentConfig.colorSuccess}
                onChange={(e) => handleColorChange("colorSuccess", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.colorSuccess.startsWith("#") ? currentConfig.colorSuccess : "#38A169"}
                onChange={(e) => handleColorChange("colorSuccess", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Texto Principal (--text-primary / --text-color) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Texto Principal (--text-color)
              </span>
              <input
                type="text"
                value={currentConfig.textPrimary}
                onChange={(e) => handleColorChange("textPrimary", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.textPrimary.startsWith("#") ? currentConfig.textPrimary : "#1A202C"}
                onChange={(e) => handleColorChange("textPrimary", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>

          {/* Bordas & Divisores (--border-color) */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "var(--bg-card-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                Bordas (--border-color)
              </span>
              <input
                type="text"
                value={currentConfig.borderColor}
                onChange={(e) => handleColorChange("borderColor", e.target.value)}
                className="text-[11px] font-mono bg-transparent border-b border-neutral-400 outline-none w-20 uppercase"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.borderColor.startsWith("#") ? currentConfig.borderColor : "#E2E8F0"}
                onChange={(e) => handleColorChange("borderColor", e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 bg-transparent p-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Sample */}
      <div
        className="border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5" style={{ color: "var(--btn-primary)" }} />
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Demonstração ao Vivo dos Elementos
          </h3>
        </div>
        <div
          className="p-5 rounded-2xl border space-y-3 shadow-xs"
          style={{
            backgroundColor: "var(--bg-main)",
            borderColor: "var(--border-color)",
          }}
        >
          <h4 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Exemplo de Card Acadêmico IFES
          </h4>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Este é um texto explicativo secundário. Observe a harmonia e o contraste imediato ao mudar as cores acima.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              className="text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              style={{
                backgroundColor: "var(--btn-primary)",
                color: "var(--btn-primary-text, #FFFFFF)",
              }}
            >
              Botão Primário
            </button>
            <button
              className="text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              style={{
                backgroundColor: "var(--color-success)",
              }}
            >
              Resposta Correta (+100 XP)
            </button>
            <span
              className="px-3 py-2 rounded-xl text-xs font-semibold border shadow-xs"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              Tag Informativa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
