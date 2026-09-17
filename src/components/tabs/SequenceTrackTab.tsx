import React from "react";
import { CheckCircle2, Lock, Play, RotateCcw, Trophy, Sparkles, ArrowRight, BookOpen, Compass } from "lucide-react";
import { TrackModule, UserProfile } from "../../types";
import { CURATED_APP_TRACKS } from "../../services/subjectTrackGenerator";

interface SequenceTrackTabProps {
  modules: TrackModule[];
  user: UserProfile;
  onOpenLesson: (module: TrackModule) => void;
  onResetTrack?: () => void;
  onOpenSubjectModal?: () => void;
}

export const SequenceTrackTab: React.FC<SequenceTrackTabProps> = ({
  modules,
  user,
  onOpenLesson,
  onOpenSubjectModal,
}) => {
  return (
    <section id="tab-sequence" className="p-5 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="bg-[#111111] p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Subtle Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#e2ff31] opacity-5 blur-[100px] pointer-events-none" />

        {/* Header summary */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-white/5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-semibold">
                Progressão Cognitiva
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-1">
              Trilha de Aprendizado em Sequência
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Complete cada módulo em ordem linear. Cada lição inclui checagem conceitual com <strong className="text-white">verificação obrigatória de gabarito</strong> e reflexão socrática antes de avançar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenSubjectModal && (
              <button
                onClick={onOpenSubjectModal}
                className="text-xs font-bold bg-[#e2ff31] hover:bg-[#d4f222] text-black px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Escolha quais matérias você precisa estudar"
              >
                <span>📚</span>
                <span>Mudar Matérias</span>
              </button>
            )}
            <div className="bg-[#181818] border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#e2ff31]" />
              <span className="text-xs font-bold text-neutral-200">
                {user.completedModules.length} de {modules.length} Módulos Concluídos
              </span>
            </div>
          </div>
        </div>

        {/* Curated App Tracks Discovery Strip */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#e2ff31]" />
              <span>Trilhas Prontas Fornecidas pelo App</span>
            </span>
            {onOpenSubjectModal && (
              <button
                onClick={onOpenSubjectModal}
                className="text-xs text-[#e2ff31] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Ver Catálogo Completo <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
            {CURATED_APP_TRACKS.map((t) => {
              const isCurrent = t.subjects.every((s) => user.selectedSubjects?.includes(s));
              return (
                <button
                  key={t.id}
                  onClick={onOpenSubjectModal}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                    isCurrent
                      ? "bg-[#1f2411] border-[#e2ff31] text-[#e2ff31] font-bold"
                      : "bg-[#181818] border-white/5 text-neutral-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                  {isCurrent ? (
                    <span className="text-[10px] bg-[#e2ff31]/20 px-1.5 py-0.5 rounded text-[#e2ff31] font-bold">
                      Ativa
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {t.subjects.length} mats
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subjects in Focus Bar */}
        {user.selectedSubjects && user.selectedSubjects.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Matérias em Foco:
              </span>
              {user.selectedSubjects.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-200 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
            {onOpenSubjectModal && (
              <button
                onClick={onOpenSubjectModal}
                className="text-xs text-[#e2ff31] hover:underline font-semibold flex items-center gap-1"
              >
                Personalizar o que estudar <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-4 relative z-10" id="sequence-list">
          {modules.map((mod) => {
            const isCompleted = user.completedModules.includes(mod.id);
            const isPreviousCompleted = mod.id === 1 || user.completedModules.includes(mod.id - 1);
            const isActive = !isCompleted && isPreviousCompleted;

            if (isCompleted) {
              return (
                <div
                  key={mod.id}
                  className="p-6 sm:p-7 border border-emerald-500/20 bg-[#141414] rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-emerald-500/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xl shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          Concluído
                        </span>
                        <span className="text-xs text-neutral-400 font-medium">
                          +{mod.xpReward} XP Conquistados
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base sm:text-lg mt-1">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-neutral-400">{mod.subtitle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenLesson(mod)}
                    className="w-full sm:w-auto bg-[#1a1a1a] hover:bg-[#252525] text-neutral-200 border border-white/10 px-5 py-2.5 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#e2ff31]" /> Revisar Lição
                  </button>
                </div>
              );
            }

            if (isActive) {
              return (
                <div
                  key={mod.id}
                  className="p-6 sm:p-7 border border-[#e2ff31]/60 bg-[#161616] rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl shadow-[#e2ff31]/5 transition-all ring-1 ring-[#e2ff31]/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e2ff31] text-black rounded-2xl flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      0{mod.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e2ff31] animate-ping" /> Módulo Ativo
                        </span>
                        <span className="text-xs font-bold text-[#e2ff31]">
                          +{mod.xpReward} XP
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base sm:text-lg mt-1">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-neutral-400">{mod.subtitle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenLesson(mod)}
                    className="w-full sm:w-auto bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Iniciar Lição (+{mod.xpReward} XP)</span>
                  </button>
                </div>
              );
            }

            // Locked module
            return (
              <div
                key={mod.id}
                className="p-6 sm:p-7 border border-white/5 bg-[#111111]/40 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-50 select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#181818] border border-white/5 text-neutral-500 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-white/5 text-neutral-500 border border-white/5 px-2.5 py-0.5 rounded-full">
                      Bloqueado
                    </span>
                    <h4 className="font-bold text-neutral-300 text-base sm:text-lg mt-1">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Complete o Módulo {mod.id - 1} para desbloquear esta etapa.
                    </p>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full sm:w-auto bg-[#161616] text-neutral-600 px-5 py-2.5 rounded-full text-xs font-bold cursor-not-allowed shrink-0 border border-white/5"
                >
                  Indisponível
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
