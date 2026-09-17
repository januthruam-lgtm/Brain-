import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Plus,
  X,
  Check,
  GraduationCap,
  Target,
  ArrowRight,
  BrainCircuit,
  Loader2,
  Search,
  Compass,
  Layers,
  Flame,
  CheckCircle2,
} from "lucide-react";
import {
  PRESET_SUBJECTS,
  CURATED_APP_TRACKS,
  CuratedTrack,
} from "../services/subjectTrackGenerator";

interface SubjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubjects?: string[];
  onSaveSubjects: (subjects: string[], goal: string) => Promise<void>;
  forceSelection?: boolean;
}

export const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({
  isOpen,
  onClose,
  currentSubjects = [],
  onSaveSubjects,
  forceSelection = false,
}) => {
  const [activeTab, setActiveTab] = useState<"curated" | "catalog" | "custom">("curated");
  const [selected, setSelected] = useState<string[]>(() => {
    return currentSubjects.length > 0
      ? currentSubjects
      : [
          "Matemática & Raciocínio",
          "Língua Portuguesa & Redação",
          "Biologia & Genética",
        ];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [customInput, setCustomInput] = useState("");
  const [learningGoal, setLearningGoal] = useState("Reforço e Entendimento Profundo");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const categories = [
    "Todas",
    "Exatas",
    "Biológicas",
    "Saúde",
    "Humanas",
    "Linguagens",
    "Tecnologia",
    "Direito",
    "Concursos",
  ];

  const filteredPresets = PRESET_SUBJECTS.filter((p) => {
    const matchesCat = selectedCategory === "Todas" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleSubject = (name: string) => {
    if (selected.includes(name)) {
      if (selected.length === 1 && forceSelection) return;
      setSelected(selected.filter((s) => s !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const applyCuratedTrack = (track: CuratedTrack) => {
    setSelected(track.subjects);
    setLearningGoal(track.targetGoal);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (clean && !selected.includes(clean)) {
      setSelected([...selected, clean]);
      setCustomInput("");
    }
  };

  const handleRemoveSubject = (name: string) => {
    setSelected(selected.filter((s) => s !== name));
  };

  const handleSelectAllFiltered = () => {
    const newItems = filteredPresets.map((p) => p.name).filter((n) => !selected.includes(n));
    setSelected([...selected, ...newItems]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsGenerating(true);
    try {
      await onSaveSubjects(selected, learningGoal);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const goals = [
    { id: "reforco", label: "Reforço e Entendimento Profundo", icon: "🧠" },
    { id: "enem_provas", label: "Preparação para ENEM & Provas", icon: "🎯" },
    { id: "concursos", label: "Concursos e Alta Performance", icon: "🏆" },
    { id: "iniciante", label: "Introdução e Base do Zero", icon: "🌱" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="bg-[#111111] border border-white/10 rounded-[2.5rem] p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-5 relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e2ff31] animate-pulse" />
              <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> Currículo & Matérias do Brain Studio
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Matérias de Estudo Fornecidas pelo App
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Escolha uma trilha pronta fornecida pelo app, selecione matérias do catálogo oficial ou defina temas específicos.
            </p>
          </div>
          {!forceSelection && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("curated")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "curated"
                ? "bg-[#e2ff31] text-black shadow-xs"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trilhas Prontas do App ({CURATED_APP_TRACKS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "catalog"
                ? "bg-[#e2ff31] text-black shadow-xs"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Catálogo Geral de Matérias ({PRESET_SUBJECTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "custom"
                ? "bg-[#e2ff31] text-black shadow-xs"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Matéria Específica</span>
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
          {/* TAB 1: CURATED APP TRACKS */}
          {activeTab === "curated" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  O app fornece pacotes didáticos completos com todas as matérias organizadas e prontas para estudar:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CURATED_APP_TRACKS.map((track) => {
                  const isAllSelected = track.subjects.every((s) => selected.includes(s));
                  const matchesSome = track.subjects.filter((s) => selected.includes(s)).length;

                  return (
                    <div
                      key={track.id}
                      className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isAllSelected
                          ? "bg-[#1d2210] border-[#e2ff31] ring-1 ring-[#e2ff31]/40"
                          : "bg-[#141414] border-white/10 hover:border-white/20 hover:bg-[#181818]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{track.icon}</span>
                            <span className="font-bold text-sm text-white">{track.name}</span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#e2ff31] border border-[#e2ff31]/20">
                            {track.badge}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {track.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {track.subjects.map((sub) => (
                            <span
                              key={sub}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                selected.includes(sub)
                                  ? "bg-[#e2ff31]/20 text-[#e2ff31] border border-[#e2ff31]/30 font-semibold"
                                  : "bg-white/5 text-neutral-400 border border-white/5"
                              }`}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {track.subjects.length} matérias inclusas
                        </span>

                        <button
                          type="button"
                          onClick={() => applyCuratedTrack(track)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isAllSelected
                              ? "bg-[#e2ff31] text-black"
                              : "bg-white/10 text-white hover:bg-[#e2ff31] hover:text-black"
                          }`}
                        >
                          {isAllSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Trilha Ativa</span>
                            </>
                          ) : (
                            <>
                              <span>Ativar Trilha</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CATALOG OF ALL SUBJECTS */}
          {activeTab === "catalog" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Search & Categories Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar matéria por nome ou descrição..."
                    className="w-full bg-[#161616] border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#e2ff31]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-white/5 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Preset Subjects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPresets.map((p) => {
                  const isSelected = selected.includes(p.name);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSubject(p.name)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all text-xs cursor-pointer ${
                        isSelected
                          ? "bg-[#1f2411] border-[#e2ff31] text-white ring-1 ring-[#e2ff31]/40"
                          : "bg-[#141414] border-white/5 text-neutral-300 hover:border-white/20 hover:bg-[#181818]"
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate">{p.name}</span>
                          <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md font-mono">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#e2ff31] text-black flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/20 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM SUBJECT INPUT */}
          {activeTab === "custom" && (
            <div className="space-y-4 animate-in fade-in duration-200 p-2">
              <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#e2ff31]" />
                  <span>Cadastrar Matéria ou Disciplina Específica</span>
                </h4>
                <p className="text-xs text-neutral-400">
                  O Brain Studio conta com IA generativa para criar lições, resumos e questões socráticas sobre qualquer tema específico do seu curso universitário, concurso ou pós-graduação.
                </p>
                <form onSubmit={handleAddCustom} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Ex: Teoria Geral do Crime, Fisiopatologia Cardiovascular, Álgebra Linear..."
                    className="flex-1 bg-[#111111] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#e2ff31] transition"
                  />
                  <button
                    type="submit"
                    disabled={!customInput.trim()}
                    className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:opacity-40 text-black px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Selected Badges Preview Bar */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#e2ff31]" />
                <span>Matérias Selecionadas para Estudo ({selected.length})</span>
              </label>
              {selected.length === 0 && (
                <span className="text-[11px] text-amber-400 font-medium">
                  Selecione ao menos 1 matéria
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 bg-[#161616] border border-white/10 rounded-2xl">
              {selected.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e2ff31] text-black text-xs font-bold rounded-full shadow-xs transition"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="hover:opacity-75 p-0.5 cursor-pointer"
                    title="Remover matéria"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selected.length === 0 && (
                <span className="text-xs text-neutral-500 italic py-1">
                  Nenhuma matéria selecionada. Clique em uma trilha pronta ou adicione disciplinas acima.
                </span>
              )}
            </div>
          </div>

          {/* Learning Goal Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Objetivo Pedagógico
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setLearningGoal(g.label)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs transition cursor-pointer ${
                    learningGoal === g.label
                      ? "bg-[#181818] border-[#e2ff31] text-white"
                      : "bg-[#141414] border-white/5 text-neutral-400 hover:border-white/10"
                  }`}
                >
                  <span>{g.icon}</span>
                  <span className="font-medium truncate">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-neutral-500 hidden sm:block">
            {selected.length} matéria{selected.length > 1 ? "s" : ""} carregada{selected.length > 1 ? "s" : ""} na grade de estudos.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!forceSelection && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full border border-white/10 text-neutral-300 text-xs font-medium hover:bg-white/5 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected.length === 0 || isGenerating}
              className="flex-1 sm:flex-none bg-[#e2ff31] hover:bg-[#d4f222] disabled:opacity-50 text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparando Matérias...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Estudar Estas Matérias</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
