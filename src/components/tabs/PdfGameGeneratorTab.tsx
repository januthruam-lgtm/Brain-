import React, { useState } from "react";
import {
  Upload,
  FileText,
  Gamepad2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  HelpCircle,
  Trophy,
  RotateCw,
  Zap,
  FileCheck,
  RotateCcw,
  Brain,
  Check,
  Loader2,
  FileUp,
  FileSpreadsheet,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Flashcard, QuizQuestion, AnswerVerificationResult } from "../../types";
import { speakText } from "../../utils/speech";

interface PdfGameGeneratorTabProps {
  onRewardXp?: (amount: number) => void;
}

export const PdfGameGeneratorTab: React.FC<PdfGameGeneratorTabProps> = ({ onRewardXp }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showCustomTextInput, setShowCustomTextInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [gameTitle, setGameTitle] = useState("");
  const [gameSummary, setGameSummary] = useState("");
  const [activeGameMode, setActiveGameMode] = useState<"quiz" | "flashcards" | "open">("quiz");

  // Game data starts completely empty
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showArena, setShowArena] = useState(false);

  // Duolingo-style Missed Questions Loop state
  const [missedQuestionsQueue, setMissedQuestionsQueue] = useState<QuizQuestion[]>([]);
  const [isInReviewLoop, setIsInReviewLoop] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewAnswered, setReviewAnswered] = useState(false);
  const [reviewSelectedAnswer, setReviewSelectedAnswer] = useState<number | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Open-ended verification state
  const [openAnswer, setOpenAnswer] = useState("");
  const [isVerifyingOpen, setIsVerifyingOpen] = useState(false);
  const [openVerificationResult, setOpenVerificationResult] = useState<AnswerVerificationResult | null>(null);

  const sampleSummaries = [
    {
      label: "📄 Exemplo: História do Brasil (Era Vargas)",
      text: "A Era Vargas (1930-1945) transformou a economia e a legislação brasileira. Getúlio Vargas implementou a CLT (Consolidação das Leis do Trabalho), a criação da Petrobras e da Companhia Siderúrgica Nacional, além de passar pelo Estado Novo ditatorial.",
    },
    {
      label: "📄 Exemplo: Física (Leis de Newton)",
      text: "As três leis de Newton regem a mecânica clássica: 1ª Lei (Inércia), 2ª Lei (Princípio Fundamental da Dinâmica: Força Resultante = massa x aceleração) e 3ª Lei (Ação e Reação em corpos distintos com mesma intensidade e sentidos opostos).",
    },
    {
      label: "📄 Exemplo: Química (Tabela Periódica & Ligações)",
      text: "A tabela periódica organiza os elementos por número atômico crescente. As ligações iônicas envolvem transferência de elétrons entre metais e ametais, enquanto as ligações covalentes compartilham pares eletrônicos.",
    },
    {
      label: "📄 Exemplo: Biologia (Citologia & ATP)",
      text: "As células eucariontes utilizam mitocôndrias para oxidar nutrientes e gerar ATP. A membrana plasmática com seu modelo de mosaico fluido controla a homeostase através de osmose, difusão e bombas iônicas ativas.",
    },
  ];

  const processUploadedFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsGenerating(true);
    setGenerationStep(`Lendo arquivo "${file.name}"...`);

    const isPdfOrImage = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf") || file.type.startsWith("image/");

    if (isPdfOrImage) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const mimeType = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        setGenerationStep("IA Lumina extraindo tópicos e questões do documento...");
        await executeGameGeneration({
          fileBase64: dataUrl,
          mimeType: mimeType,
          topicName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const textContent = event.target?.result as string;
        setGenerationStep("IA Lumina formulando questões temáticas...");
        await executeGameGeneration({
          textContent: textContent || file.name,
          topicName: file.name,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const executeGameGeneration = async (payload: {
    textContent?: string;
    topicName?: string;
    fileBase64?: string;
    mimeType?: string;
  }) => {
    setIsGenerating(true);
    setShowArena(true);

    try {
      setGenerationStep("Criando Quizzes e Flashcards pertinentes...");
      const res = await fetch("/api/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.title) setGameTitle(data.title);
      if (data.summary) setGameSummary(data.summary);
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setCardFlipped(false);
      }
      if (data.quizQuestions && data.quizQuestions.length > 0) {
        setQuizQuestions(data.quizQuestions);
        setCurrentQuizIndex(0);
        setSelectedAnswer(null);
        setQuizAnswered(false);
        setMissedQuestionsQueue([]);
        setIsInReviewLoop(false);
        setSessionCompleted(false);
      }

      setOpenVerificationResult(null);
      setOpenAnswer("");

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
      });

      const announcedTitle = data.title || payload.topicName || "novo tema";
      speakText(`Perguntas e atividades geradas com sucesso para ${announcedTitle}!`, false);
    } catch (err) {
      console.error("Erro gerando quiz por documento:", err);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const handleGenerateFromText = () => {
    if (!customText.trim() || isGenerating) return;
    const title = customText.slice(0, 40).trim();
    setFileName(`Texto: ${title}...`);
    executeGameGeneration({
      textContent: customText,
      topicName: title,
    });
  };

  const handleSelectQuizOption = (idx: number) => {
    if (quizAnswered) return;
    setSelectedAnswer(idx);
    setQuizAnswered(true);

    const activeQuestion = quizQuestions[currentQuizIndex];
    const isCorrect = idx === activeQuestion.correctIndex;

    if (isCorrect) {
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.7 },
      });
      if (onRewardXp) {
        onRewardXp(activeQuestion.xpReward || 50);
      }
      speakText("Resposta correta! Ponto registrado com sucesso.", false);
    } else {
      // Duolingo rule: No XP on incorrect answer + store for review loop at end of session
      setMissedQuestionsQueue((prev) => {
        if (prev.some((q) => q.id === activeQuestion.id || q.question === activeQuestion.question)) {
          return prev;
        }
        return [...prev, activeQuestion];
      });
      speakText("Resposta incorreta. Sem XP concedido. Esta questão retornará ao final da sessão no loop de fixação!", false);
    }
  };

  const handleRetryQuizQuestion = () => {
    setSelectedAnswer(null);
    setQuizAnswered(false);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setQuizAnswered(false);
    } else {
      // Check if there are missed questions to review
      if (missedQuestionsQueue.length > 0) {
        setIsInReviewLoop(true);
        setReviewIndex(0);
        setReviewAnswered(false);
        setReviewSelectedAnswer(null);
        speakText("Iniciando Loop de Correção Duolingo! Vamos fixar as questões que você errou até acertar.", false);
      } else {
        setSessionCompleted(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
        speakText("Sessão de quiz concluída com 100% de aproveitamento!", false);
      }
    }
  };

  // Review Loop Handlers
  const handleSelectReviewOption = (idx: number) => {
    if (reviewAnswered) return;
    setReviewSelectedAnswer(idx);
    setReviewAnswered(true);

    const currentMissedQ = missedQuestionsQueue[reviewIndex];
    if (!currentMissedQ) return;

    const isCorrect = idx === currentMissedQ.correctIndex;
    if (isCorrect) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
      speakText("Correto! Conceito assimilado no loop de revisão.", false);
    } else {
      speakText("Ainda não está correto. Veja a explicação e tente até dominar!", false);
    }
  };

  const handleNextReviewQuestion = () => {
    const currentMissedQ = missedQuestionsQueue[reviewIndex];
    const isCorrect = reviewSelectedAnswer === currentMissedQ?.correctIndex;

    if (isCorrect) {
      // Remove from missed queue
      const nextQueue = missedQuestionsQueue.filter((_, i) => i !== reviewIndex);
      setMissedQuestionsQueue(nextQueue);

      if (nextQueue.length === 0) {
        // Finished all corrections!
        setIsInReviewLoop(false);
        setSessionCompleted(true);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
        });
        speakText("Parabéns! Você corrigiu e dominou todas as questões pendentes sem penalidade!", false);
      } else {
        // Move to next (or wraparound)
        const nextIdx = reviewIndex >= nextQueue.length ? 0 : reviewIndex;
        setReviewIndex(nextIdx);
        setReviewAnswered(false);
        setReviewSelectedAnswer(null);
      }
    } else {
      // Reset for current question to try again
      setReviewAnswered(false);
      setReviewSelectedAnswer(null);
    }
  };

  const handleVerifyOpenAnswer = async () => {
    if (!openAnswer.trim() || isVerifyingOpen) return;
    setIsVerifyingOpen(true);

    try {
      const activeQ = quizQuestions[currentQuizIndex] || quizQuestions[0];
      const res = await fetch("/api/verify/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQ.question,
          userAnswer: openAnswer,
          contextModule: gameTitle,
          expectedConcept: gameSummary,
        }),
      });

      const data: AnswerVerificationResult = await res.json();
      setOpenVerificationResult(data);

      if (data.isCorrect || data.score >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onRewardXp) {
          onRewardXp(data.xpEarned || 40);
        }
        speakText(`Excelente! Resposta avaliada com nota ${data.score}. XP concedido!`, false);
      } else if (data.score >= 40) {
        if (onRewardXp) {
          onRewardXp(20);
        }
      }
    } catch (err) {
      console.error("Erro verificando resposta dissertativa:", err);
    } finally {
      setIsVerifyingOpen(false);
    }
  };

  const currentQ = quizQuestions[currentQuizIndex] || {
    id: "empty",
    question: "",
    options: [],
    correctIndex: 0,
    explanation: "",
    xpReward: 50,
  };
  const currentFC = flashcards[currentCardIndex] || {
    id: "empty",
    question: "",
    answer: "",
    category: "",
  };

  return (
    <section id="tab-games" className="p-5 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Upload Bento Box */}
      <div className="bg-[#111111] p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#e2ff31] opacity-5 blur-[100px] pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-semibold">
              IA Generativa Multimodal & Verificação Pedagógica
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-1">
              Gerador de Jogos & Quizzes por Documento (PDF/Texto)
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Envie sua apostila, lista de exercícios, resumo ou PDF de qualquer disciplina. A IA analisa o documento e gera automaticamente Quizzes pertinentes com gabarito comentado, Flashcards e desafios com avaliação em tempo real.
            </p>
          </div>
        </div>

        {/* Upload dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition group relative z-10 ${
            isDragging
              ? "border-[#e2ff31] bg-[#e2ff31]/5 scale-[1.01]"
              : "border-white/10 bg-[#161616]/50 hover:bg-[#1a1a1a]"
          }`}
        >
          <input
            type="file"
            id="game-pdf-input"
            accept=".pdf,.txt,.md,.doc,.docx,image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="w-12 h-12 rounded-2xl bg-[#222222] text-[#e2ff31] border border-white/10 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition">
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#e2ff31]" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <label
            htmlFor="game-pdf-input"
            className={`cursor-pointer inline-block px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition ${
              isGenerating
                ? "bg-neutral-800 text-neutral-400 cursor-not-allowed"
                : "bg-[#e2ff31] hover:bg-[#d4f222] text-black"
            }`}
          >
            {isGenerating ? "Processando Documento..." : "Carregar Arquivo PDF / Imagem / Documento"}
          </label>

          <p className="text-xs text-neutral-400 mt-3 font-medium" id="file-status-text">
            {isGenerating
              ? `⚡ ${generationStep || "Gerando perguntas pertinentes ao tema..."}`
              : fileName
              ? `📄 Documento atual: ${fileName} (Arraste outro arquivo para substituir)`
              : "Arraste e solte seu arquivo PDF aqui, ou escolha um resumo temático abaixo:"}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowCustomTextInput(!showCustomTextInput)}
              className="text-[11px] text-[#e2ff31] hover:underline font-semibold flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>{showCustomTextInput ? "Ocultar área de texto colado" : "Ou colar texto/resumo diretamente"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Manual Text Paste Area */}
        {showCustomTextInput && (
          <div className="p-4 bg-[#161616] border border-white/10 rounded-2xl space-y-3 relative z-10 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#e2ff31]" />
                <span>Cole seu Resumo, Apostila ou Tema</span>
              </label>
              <span className="text-[10px] text-neutral-500">{customText.length} caracteres</span>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Cole aqui o texto do seu trabalho, resumo de matéria, leis, equações ou tópicos que deseja treinar..."
              className="w-full text-xs bg-[#111] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#e2ff31] resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerateFromText}
                disabled={!customText.trim() || isGenerating}
                className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-bold px-6 py-2.5 rounded-full uppercase tracking-wider transition flex items-center gap-2 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Perguntas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Quizzes Pertinentes ao Texto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick sample summaries buttons (Bento Pills) */}
        <div className="space-y-2 relative z-10">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Ou teste com tópicos prontos de diferentes disciplinas:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {sampleSummaries.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const labelTitle = s.label.replace("📄 Resumo: ", "");
                  setFileName(labelTitle + ".pdf");
                  executeGameGeneration({
                    textContent: s.text,
                    topicName: labelTitle,
                  });
                }}
                disabled={isGenerating}
                className="text-xs bg-[#161616] hover:bg-[#202020] text-neutral-300 hover:text-white border border-white/5 hover:border-white/15 font-medium px-4 py-2 rounded-full transition flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#e2ff31]" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pristine Empty State: No document loaded yet */}
      {!showArena && !isGenerating && (
        <div className="bg-[#111111] p-8 sm:p-12 rounded-[2.5rem] border border-white/5 text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-white/10 flex items-center justify-center mx-auto text-xl text-[#e2ff31]">
            <Gamepad2 className="w-6 h-6 text-[#e2ff31]" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum quiz ou matéria gerada ainda</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            Envie qualquer arquivo PDF, imagem ou texto de sua escolha acima, ou clique em um dos exemplos rápidos para a Lumina AI criar o conteúdo interativo sob demanda.
          </p>
        </div>
      )}

      {/* Dynamic Game Arena Bento Box */}
      {showArena && (
        <div
          id="dynamic-game-arena"
          className="bg-[#111111] p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 transition-all"
        >
          {/* Arena Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Conteúdo Gerado Automaticamente
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {activeGameMode === "quiz"
                    ? `Questão ${currentQuizIndex + 1}/${quizQuestions.length}`
                    : activeGameMode === "flashcards"
                    ? `Card ${currentCardIndex + 1}/${flashcards.length}`
                    : `Desafio Dissertativo`}
                </span>
              </div>
              <h3 id="dg-title" className="font-bold text-lg sm:text-xl text-white mt-1">
                {gameTitle}
              </h3>
              <p className="text-xs text-neutral-400 max-w-xl">{gameSummary}</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[#181818] p-1 rounded-full border border-white/5">
              <button
                onClick={() => setActiveGameMode("quiz")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeGameMode === "quiz"
                    ? "bg-[#e2ff31] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Quiz 4 Opções
              </button>
              <button
                onClick={() => setActiveGameMode("open")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeGameMode === "open"
                    ? "bg-[#e2ff31] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" /> Verificação Livre IA
              </button>
              <button
                onClick={() => setActiveGameMode("flashcards")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeGameMode === "flashcards"
                    ? "bg-[#e2ff31] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Flashcards
              </button>
            </div>
          </div>

          {/* Mode 1: Quiz Multiple Choice */}
          {activeGameMode === "quiz" && (
            <div className="space-y-6">
              {/* Completed Screen */}
              {sessionCompleted && (
                <div className="p-8 bg-[#161616] rounded-3xl border border-[#e2ff31]/40 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#e2ff31] text-black flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
                    🏆
                  </div>
                  <h3 className="text-2xl font-bold text-white">Sessão Concluída com Sucesso!</h3>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto">
                    Todas as questões foram respondidas e os erros foram corrigidos e dominados no loop de reforço.
                  </p>
                  <button
                    onClick={() => {
                      setSessionCompleted(false);
                      setIsInReviewLoop(false);
                      setCurrentQuizIndex(0);
                      setSelectedAnswer(null);
                      setQuizAnswered(false);
                      setMissedQuestionsQueue([]);
                    }}
                    className="bg-[#e2ff31] hover:bg-[#d4f222] text-black font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider transition shadow-md"
                  >
                    Reiniciar Sessão de Estudo
                  </button>
                </div>
              )}

              {/* Duolingo Review Loop Mode */}
              {!sessionCompleted && isInReviewLoop && missedQuestionsQueue.length > 0 && (
                <div className="space-y-4">
                  {/* Duolingo Header Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🔁</span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Loop de Correção Imediata (Estilo Duolingo)
                        </h4>
                        <p className="text-[11px] text-neutral-300">
                          Fixando erros da rodada: Questão {reviewIndex + 1} de {missedQuestionsQueue.length} restantes
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Sem Penalidade
                    </span>
                  </div>

                  {(() => {
                    const missedQ = missedQuestionsQueue[reviewIndex];
                    if (!missedQ) return null;
                    return (
                      <div className="space-y-4">
                        <div className="p-5 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            {missedQ.question}
                          </h4>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {missedQ.options.map((opt, idx) => {
                            let optStyle =
                              "border-white/5 bg-[#161616] hover:bg-[#1c1c1c] text-neutral-300 hover:border-white/10";
                            if (reviewAnswered) {
                              if (idx === missedQ.correctIndex) {
                                optStyle =
                                  "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold ring-2 ring-emerald-500/50";
                              } else if (reviewSelectedAnswer === idx) {
                                optStyle =
                                  "border-red-500 bg-red-950/60 text-red-200 font-bold ring-2 ring-red-500/50";
                              } else {
                                optStyle = "border-transparent bg-[#121212] text-neutral-600 opacity-40";
                              }
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectReviewOption(idx)}
                                disabled={reviewAnswered}
                                className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {reviewAnswered && idx === missedQ.correctIndex && (
                                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Correta!</span>
                                  </div>
                                )}
                                {reviewAnswered && reviewSelectedAnswer === idx && idx !== missedQ.correctIndex && (
                                  <div className="flex items-center gap-1 text-red-400 text-xs font-bold shrink-0">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Tente de novo</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback & explanation */}
                        {reviewAnswered && (
                          <div
                            className={`p-5 rounded-2xl border transition-all space-y-2 ${
                              reviewSelectedAnswer === missedQ.correctIndex
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                                : "bg-red-950/40 border-red-500/40 text-red-200"
                            }`}
                          >
                            <p className="font-bold flex items-center gap-2 text-sm">
                              {reviewSelectedAnswer === missedQ.correctIndex ? (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                  <span>Excelente! Questão dominada com sucesso!</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-5 h-5 text-red-400" />
                                  <span>Incorreta nesta tentativa</span>
                                </>
                              )}
                            </p>
                            <p className="text-xs sm:text-sm font-normal text-neutral-300 leading-relaxed">
                              <span className="font-bold text-white">Explicação: </span>
                              {missedQ.explanation}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNextReviewQuestion}
                            disabled={!reviewAnswered}
                            className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md"
                          >
                            {reviewSelectedAnswer === missedQ.correctIndex
                              ? "Continuar Loop →"
                              : "Tentar Novamente"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Standard Initial Quiz Mode */}
              {!sessionCompleted && !isInReviewLoop && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span className="font-semibold text-white">
                      Questão {currentQuizIndex + 1} de {quizQuestions.length}
                    </span>
                    <span className="text-[#e2ff31] font-bold">
                      +{currentQ.xpReward || 50} XP por acerto
                    </span>
                  </div>

                  <div className="p-5 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      {currentQ.question}
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options.map((opt, idx) => {
                      let optStyle =
                        "border-white/5 bg-[#161616] hover:bg-[#1c1c1c] text-neutral-300 hover:border-white/10";
                      if (quizAnswered) {
                        if (idx === currentQ.correctIndex) {
                          optStyle =
                            "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold ring-2 ring-emerald-500/50";
                        } else if (selectedAnswer === idx) {
                          optStyle =
                            "border-red-500 bg-red-950/60 text-red-200 font-bold ring-2 ring-red-500/50";
                        } else {
                          optStyle = "border-transparent bg-[#121212] text-neutral-600 opacity-40";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuizOption(idx)}
                          disabled={quizAnswered}
                          className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center justify-between ${optStyle}`}
                        >
                          <span>{opt}</span>
                          {quizAnswered && idx === currentQ.correctIndex && (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Correta</span>
                            </div>
                          )}
                          {quizAnswered && selectedAnswer === idx && idx !== currentQ.correctIndex && (
                            <div className="flex items-center gap-1 text-red-400 text-xs font-bold shrink-0">
                              <AlertCircle className="w-4 h-4" />
                              <span>Incorreta (irá pro loop)</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback and Explanation Banner */}
                  {quizAnswered && (
                    <div
                      className={`p-5 rounded-2xl border transition-all space-y-2 ${
                        selectedAnswer === currentQ.correctIndex
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : "bg-red-950/40 border-red-500/40 text-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <p className="font-bold flex items-center gap-2 text-sm">
                          {selectedAnswer === currentQ.correctIndex ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span>Resposta Correta! (+{currentQ.xpReward || 50} XP)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-400" />
                              <span>Incorreta (0 XP • Retorna no final no Loop Duolingo)</span>
                            </>
                          )}
                        </p>
                        {selectedAnswer !== currentQ.correctIndex && (
                          <button
                            onClick={handleRetryQuizQuestion}
                            className="bg-[#1c1c1c] hover:bg-[#282828] text-[#e2ff31] border border-[#e2ff31]/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Tentar Novamente
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-normal text-neutral-300 leading-relaxed">
                        <span className="font-bold text-white">Gabarito Comentado: </span>
                        {currentQ.explanation}
                      </p>
                    </div>
                  )}

                  {/* Quiz Navigation */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        setCurrentQuizIndex((prev) => Math.max(0, prev - 1));
                        setSelectedAnswer(null);
                        setQuizAnswered(false);
                      }}
                      disabled={currentQuizIndex === 0}
                      className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 transition"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={handleNextQuizQuestion}
                      className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md"
                    >
                      {currentQuizIndex === quizQuestions.length - 1
                        ? missedQuestionsQueue.length > 0
                          ? `Ir para Loop de Correção (${missedQuestionsQueue.length} erros) →`
                          : "Finalizar Sessão 🎉"
                        : "Próxima Questão →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Open-Ended AI Answer Verification */}
          {activeGameMode === "open" && (
            <div className="space-y-6">
              <div className="p-5 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-[#e2ff31] uppercase tracking-wider">
                  Questão Aberta Gerada do Arquivo:
                </span>
                <h4 className="text-base font-bold text-white">
                  {currentQ.question}
                </h4>
                <p className="text-xs text-neutral-400">
                  Responda com suas próprias palavras para a IA avaliar seu domínio do conteúdo.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  placeholder="Escreva sua resposta dissertativa aqui para ser verificada pela IA Lumina..."
                  className="w-full text-xs sm:text-sm bg-[#161616] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#e2ff31] resize-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500">
                    A IA avaliará veredito, precisão conceitual e concederá XP.
                  </span>

                  <button
                    onClick={handleVerifyOpenAnswer}
                    disabled={!openAnswer.trim() || isVerifyingOpen}
                    className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-bold px-6 py-2.5 rounded-full uppercase tracking-wider transition flex items-center gap-2 shadow-md"
                  >
                    {isVerifyingOpen ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Avaliando Resposta...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Verificar Resposta com IA (+40 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Open Answer Verification Result */}
              {openVerificationResult && (
                <div
                  className={`p-5 rounded-2xl border space-y-3 transition-all ${
                    openVerificationResult.score >= 70
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-100"
                      : openVerificationResult.score >= 40
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-100"
                      : "bg-red-950/40 border-red-500/40 text-red-100"
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          openVerificationResult.score >= 70
                            ? "bg-emerald-500 text-black"
                            : openVerificationResult.score >= 40
                            ? "bg-amber-400 text-black"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {openVerificationResult.verdict === "Correta"
                          ? "✅ Correta"
                          : openVerificationResult.verdict === "Parcialmente Correta"
                          ? "⚠️ Parcialmente Correta"
                          : "❌ Incorreta"}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Nota: {openVerificationResult.score}/100
                      </span>
                    </div>

                    <span className="bg-[#e2ff31] text-black text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-black" /> +{openVerificationResult.xpEarned} XP
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {openVerificationResult.feedback}
                  </p>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-white/10">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-[#e2ff31]" /> Gabarito Conceitual Esperado:
                    </p>
                    <p className="text-neutral-300 leading-relaxed font-normal">
                      {openVerificationResult.detailedExplanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Flashcards */}
          {activeGameMode === "flashcards" && (
            <div className="space-y-6">
              <div
                onClick={() => setCardFlipped(!cardFlipped)}
                className="cursor-pointer min-h-[220px] p-8 rounded-[2rem] bg-[#161616] border border-white/10 hover:border-white/20 transition flex flex-col justify-between items-center text-center shadow-lg relative group select-none"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#e2ff31] bg-[#e2ff31]/10 px-3 py-1 rounded-full border border-[#e2ff31]/20">
                    {currentFC.category || "Conceito Chave"}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {currentCardIndex + 1} de {flashcards.length}
                  </span>
                </div>

                <div className="my-auto py-4">
                  {!cardFlipped ? (
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {currentFC.question}
                    </h3>
                  ) : (
                    <div className="space-y-2 animate-fadeIn">
                      <p className="text-xs font-bold text-[#e2ff31] uppercase tracking-wider">
                        Resposta & Explicação:
                      </p>
                      <p className="text-sm sm:text-base font-medium text-emerald-300">
                        {currentFC.answer}
                      </p>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-neutral-500 font-medium group-hover:text-neutral-400 transition flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-[#e2ff31]" />
                  {cardFlipped ? "Clique para ver a pergunta" : "Clique para revelar o verso"}
                </span>
              </div>

              {/* Flashcard Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                    setCardFlipped(false);
                  }}
                  disabled={currentCardIndex === 0}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 transition"
                >
                  ← Card Anterior
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (onRewardXp) {
                        onRewardXp(15);
                      }
                      confetti({ particleCount: 30, spread: 40 });
                      if (currentCardIndex < flashcards.length - 1) {
                        setCurrentCardIndex((prev) => prev + 1);
                        setCardFlipped(false);
                      }
                    }}
                    className="bg-[#1c1c1c] hover:bg-[#282828] text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-[#e2ff31]" /> Já Sei (+15 XP)
                  </button>
                  <button
                    onClick={() => {
                      if (currentCardIndex < flashcards.length - 1) {
                        setCurrentCardIndex((prev) => prev + 1);
                        setCardFlipped(false);
                      } else {
                        setCurrentCardIndex(0);
                        setCardFlipped(false);
                      }
                    }}
                    className="bg-[#e2ff31] hover:bg-[#d4f222] text-black text-xs font-bold px-5 py-2 rounded-full uppercase tracking-wider transition shadow-md"
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};


