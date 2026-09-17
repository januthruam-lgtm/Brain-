import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Lightbulb,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { SocraticMessage, UserProfile, AnswerVerificationResult } from "../../types";
import { speakText, stopSpeaking, createSpeechRecognizer } from "../../utils/speech";

interface SocraticTutorTabProps {
  user: UserProfile;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onRewardXp?: (amount: number) => void;
}

export const SocraticTutorTab: React.FC<SocraticTutorTabProps> = ({
  user,
  voiceEnabled,
  onToggleVoice,
  onRewardXp,
}) => {
  const [activeMode, setActiveMode] = useState<"chat" | "verifier">("chat");

  const [messages, setMessages] = useState<SocraticMessage[]>([
    {
      id: "msg-0",
      role: "lumina",
      text: "Olá! Sou a **Lumina**, sua tutora socrática e verificadora de aprendizado. Qual matéria ou dúvida você gostaria de explorar hoje?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("Todas as Matérias");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Dedicated Answer Verifier States
  const [verifierQuestion, setVerifierQuestion] = useState("");
  const [verifierAnswer, setVerifierAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AnswerVerificationResult | null>(null);

  const defaultTopics = [
    "Todas as Matérias",
    "Matemática & Raciocínio Lógico",
    "História & Geografia",
    "Física & Química",
    "Biologia & Ciências",
    "Língua Portuguesa & Redação",
    "Dúvida Livre Geral",
  ];

  const topics = user.selectedSubjects && user.selectedSubjects.length > 0
    ? ["Todas as Matérias", ...user.selectedSubjects, "Dúvida Livre Geral"]
    : defaultTopics;

  const quickPrompts = [
    "Como aplicar as Leis de Newton em exercícios práticos?",
    "Qual a diferença fundamental entre mitose e meiose?",
    "Como estruturar uma tese argumentativa para o ENEM?",
    "Explique o conceito de juros compostos com um exemplo real",
  ];

  const sampleChallenges = [
    {
      question: "Qual o papel da mitocôndria na síntese de ATP e respiração celular?",
      topic: "Biologia & Ciências",
    },
    {
      question: "Por que a Primeira Lei de Newton afirma que um corpo em movimento retilíneo uniforme tende a permanecer em movimento?",
      topic: "Física & Química",
    },
    {
      question: "Quais foram os fatores socioeconômicos que desencadearam a Revolução Francesa em 1789?",
      topic: "História & Geografia",
    },
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (activeMode === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeMode]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isLoading) return;

    const userMsg: SocraticMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch("/api/socratic/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          currentModule: selectedTopic,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "Excelente reflexão! Qual seria o próximo desdobramento dessa questão?";

      const aiMsg: SocraticMessage = {
        id: "lum-" + Date.now(),
        role: "lumina",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (onRewardXp) {
        onRewardXp(15);
      }

      if (voiceEnabled) {
        speakText(replyText, true);
      }
    } catch (err) {
      console.error("Erro na comunicação com a Lumina:", err);
      const errorMsg: SocraticMessage = {
        id: "err-" + Date.now(),
        role: "lumina",
        text: "Interessante colocação! Vamos decompor isso: qual é o principal conceito biológico que você identificou nessa situação?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!verifierAnswer.trim() || isVerifying) return;
    setIsVerifying(true);

    try {
      const res = await fetch("/api/verify/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: verifierQuestion,
          userAnswer: verifierAnswer,
          contextModule: selectedTopic,
        }),
      });

      const data: AnswerVerificationResult = await res.json();
      setVerificationResult(data);

      if (data.isCorrect || data.score >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onRewardXp) {
          onRewardXp(data.xpEarned || 40);
        }
        speakText(`Resposta verificada com sucesso! Nota ${data.score}. Você ganhou ${data.xpEarned || 40} XP!`, false);
      } else if (data.score >= 40) {
        if (onRewardXp) {
          onRewardXp(20);
        }
        speakText(`Resposta parcialmente correta! Nota ${data.score}. Veja os pontos a aprimorar.`, false);
      } else {
        speakText(`Resposta avaliada. Confira a explicação científica detalhada para dominar o conteúdo.`, false);
      }
    } catch (err) {
      console.error("Erro verificando resposta:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setIsListening(false);
        if (activeMode === "chat") {
          setInputVal(transcript);
          handleSendMessage(transcript);
        } else {
          setVerifierAnswer(transcript);
        }
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer.isSupported) {
      setIsListening(true);
      recognizer.start();
    } else {
      alert("O reconhecimento de voz pelo navegador não está disponível neste dispositivo. Você pode digitar normalmente na caixa de texto!");
    }
  };

  return (
    <section id="tab-lumina" className="p-4 sm:p-8 flex flex-col h-[calc(100vh-85px)] max-w-6xl mx-auto">
      <div className="bg-[#111111] rounded-[2.5rem] border border-white/5 shadow-2xl flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle Ambient Spotlight */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#e2ff31] opacity-5 blur-[120px] pointer-events-none" />

        {/* Header bar */}
        <div className="p-5 sm:p-6 border-b border-white/5 bg-[#141414]/90 flex flex-wrap justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center text-xl shadow-md text-white">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-white">
                  Lumina Socrática
                </h4>
                <span className="bg-[#e2ff31]/10 text-[#e2ff31] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#e2ff31]/20 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e2ff31] animate-pulse" /> IA Pedagógica & Verificador
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-normal hidden sm:block mt-0.5">
                Avaliação imediata de respostas e investigação conceitual socrática.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mode Switcher Pills */}
            <div className="flex bg-[#181818] p-1 rounded-full border border-white/5">
              <button
                onClick={() => setActiveMode("chat")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === "chat"
                    ? "bg-[#e2ff31] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={() => setActiveMode("verifier")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === "verifier"
                    ? "bg-[#e2ff31] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" /> Verificar Resposta
              </button>
            </div>

            {/* Topic dropdown */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#181818] border border-white/10 text-neutral-200 text-xs font-semibold px-4 py-2 rounded-full outline-none focus:border-[#e2ff31] transition hidden md:block"
            >
              {topics.map((t) => (
                <option key={t} value={t} className="bg-[#111111] text-white">
                  {t}
                </option>
              ))}
            </select>

            {/* Voice toggle */}
            <button
              id="voice-toggle-btn"
              onClick={onToggleVoice}
              className={`border px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                voiceEnabled
                  ? "bg-[#e2ff31] border-[#e2ff31] text-black hover:brightness-95 font-bold"
                  : "bg-[#181818] border-white/10 text-neutral-400 hover:bg-[#222]"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{voiceEnabled ? "Voz" : "Mudo"}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE MODE 1: DEDICATED ANSWER VERIFIER */}
        {activeMode === "verifier" ? (
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-6 bg-[#0e0e0e]/60 bento-dot-bg">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Verifier Intro Card */}
              <div className="bg-[#161616] p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <FileCheck2 className="w-4 h-4 text-[#e2ff31]" />
                    <span>Verificador Inteligente de Respostas & Hipóteses</span>
                  </div>
                  <span className="text-[10px] bg-[#e2ff31]/10 text-[#e2ff31] font-bold px-3 py-1 rounded-full border border-[#e2ff31]/20">
                    Correção Detalhada com IA
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                    1. Enunciado ou Pergunta da Questão:
                  </label>
                  <input
                    type="text"
                    value={verifierQuestion}
                    onChange={(e) => setVerifierQuestion(e.target.value)}
                    placeholder="Digite a pergunta que você deseja responder..."
                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                  />
                </div>

                {/* Challenge prompt suggestions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#e2ff31]" /> Exemplos:
                  </span>
                  {sampleChallenges.map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setVerifierQuestion(sc.question);
                        setSelectedTopic(sc.topic);
                        setVerifierAnswer("");
                        setVerificationResult(null);
                      }}
                      className="text-xs bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 border border-white/5 px-3 py-1 rounded-full transition"
                    >
                      {sc.question.slice(0, 38)}...
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                    2. Sua Resposta / Explicação:
                  </label>
                  <textarea
                    rows={4}
                    value={verifierAnswer}
                    onChange={(e) => setVerifierAnswer(e.target.value)}
                    placeholder="Escreva sua resposta detalhada aqui. A IA analisará precisão científica, conceitos acertados e o que pode ser melhorado..."
                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#e2ff31] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleStartVoice}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border flex items-center gap-2 transition ${
                      isListening
                        ? "bg-red-500 text-white border-red-400 animate-pulse"
                        : "bg-[#1f1f1f] text-neutral-300 border-white/10 hover:bg-[#282828]"
                    }`}
                  >
                    <Mic className="w-4 h-4 text-[#e2ff31]" />
                    <span>{isListening ? "Gravando Voz..." : "Ditar Resposta"}</span>
                  </button>

                  <button
                    onClick={handleVerifyAnswer}
                    disabled={!verifierAnswer.trim() || isVerifying}
                    className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Verificando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Verificar Minha Resposta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Assessment Result Card */}
              {verificationResult && (
                <div
                  className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all space-y-5 ${
                    verificationResult.score >= 70
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-100"
                      : verificationResult.score >= 40
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-100"
                      : "bg-red-950/40 border-red-500/40 text-red-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider ${
                          verificationResult.score >= 70
                            ? "bg-emerald-500 text-black"
                            : verificationResult.score >= 40
                            ? "bg-amber-400 text-black"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {verificationResult.verdict === "Correta"
                          ? "✅ Resposta Correta"
                          : verificationResult.verdict === "Parcialmente Correta"
                          ? "⚠️ Parcialmente Correta"
                          : "❌ Resposta Incorreta"}
                      </span>
                      <span className="font-mono text-sm font-black text-white">
                        Nota Pedagógica: {verificationResult.score}/100
                      </span>
                    </div>

                    {verificationResult.xpEarned > 0 && (
                      <span className="bg-[#e2ff31] text-black text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                        <Zap className="w-4 h-4 fill-black" /> +{verificationResult.xpEarned} XP Concedidos
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-sm">Diagnóstico da Resposta:</h5>
                    <p className="text-sm leading-relaxed">{verificationResult.feedback}</p>
                  </div>

                  <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-[#e2ff31]" /> Explicação Científica & Fundamentação:
                    </h5>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                      {verificationResult.detailedExplanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {verificationResult.keyStrengths && verificationResult.keyStrengths.length > 0 && (
                      <div className="p-3.5 bg-emerald-950/60 rounded-2xl border border-emerald-500/20 text-xs">
                        <p className="font-bold text-emerald-300 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pontos que Você Acertou:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-neutral-300">
                          {verificationResult.keyStrengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {verificationResult.pointsToImprove && verificationResult.pointsToImprove.length > 0 && (
                      <div className="p-3.5 bg-amber-950/60 rounded-2xl border border-amber-500/20 text-xs">
                        <p className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> O que Pode Ser Aprimorado:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-neutral-300">
                          {verificationResult.pointsToImprove.map((pts, i) => (
                            <li key={i}>{pts}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setActiveMode("chat");
                        handleSendMessage(
                          `Minha resposta para a questão "${verifierQuestion}" foi avaliada como ${verificationResult.verdict} (Nota ${verificationResult.score}). Gostaria de aprofundar no conceito para dominar completamente!`
                        );
                      }}
                      className="bg-[#181818] hover:bg-[#222] text-[#e2ff31] border border-[#e2ff31]/30 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition"
                    >
                      Continuar Debatendo no Chat →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE MODE 2: CHAT CONVERSATION */
          <>
            {/* Quick prompt chips (Bento Pill Tags) */}
            <div className="px-5 py-3 bg-[#0d0d0d] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs relative z-10">
              <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-[#e2ff31]" /> Sugestões:
              </span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="shrink-0 bg-[#161616] hover:bg-[#222] hover:text-[#e2ff31] text-neutral-300 border border-white/5 hover:border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Chat message stream */}
            <div id="chat-box" className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-4 text-sm bg-[#0e0e0e]/60 bento-dot-bg">
              {messages.map((msg) => {
                const isLumina = msg.role === "lumina";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 max-w-2xl ${isLumina ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    {isLumina && (
                      <div className="w-8 h-8 rounded-xl bg-[#1f1f1f] border border-white/10 text-[#e2ff31] flex items-center justify-center text-xs font-black shrink-0">
                        L
                      </div>
                    )}

                    <div
                      className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed space-y-2 shadow-md ${
                        isLumina
                          ? "bg-[#161616] text-neutral-100 border border-white/5 rounded-tl-sm"
                          : "bg-[#e2ff31] text-black font-semibold rounded-tr-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div
                        className={`flex items-center justify-between text-[10px] pt-1.5 ${
                          isLumina ? "text-neutral-500" : "text-black/60 font-bold"
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isLumina && (
                          <button
                            onClick={() => speakText(msg.text, true)}
                            className="text-[#e2ff31] hover:underline font-bold flex items-center gap-1 ml-2"
                            title="Ouvir resposta em áudio"
                          >
                            <Volume2 className="w-3 h-3" /> Ouvir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 max-w-xl mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-[#1f1f1f] border border-white/10 text-[#e2ff31] flex items-center justify-center text-xs font-black shrink-0">
                    L
                  </div>
                  <div className="bg-[#161616] border border-white/5 p-4 rounded-3xl rounded-tl-sm flex items-center gap-2.5 text-neutral-300 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#e2ff31] animate-ping" />
                    <span>Lumina está verificando e elaborando a resposta pedagógica...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 sm:p-5 border-t border-white/5 bg-[#141414] flex gap-3 items-center relative z-10">
              <button
                id="mic-btn"
                onClick={handleStartVoice}
                className={`p-3.5 rounded-full font-bold transition text-lg flex items-center justify-center shrink-0 border ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse border-red-400"
                    : "bg-[#1c1c1c] hover:bg-[#252525] text-neutral-200 border-white/10"
                }`}
                title={isListening ? "Gravando voz... Clique para parar" : "Falar com a Lumina (Voz)"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                id="chat-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder={
                  isListening
                    ? "Ouvindo sua voz agora..."
                    : "Digite sua resposta, dúvida ou hipótese..."
                }
                className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-full px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#e2ff31] placeholder-neutral-500"
              />

              <button
                id="chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isLoading}
                className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

