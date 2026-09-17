import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  GraduationCap,
  HelpCircle,
  Mail,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Swords,
  Trash2,
  User,
  Users,
  Award,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
} from "lucide-react";
import { SubjectItem, CourseActivity, CourseParticipant, CourseMaterial, CourseForumTopic, UserProfile } from "../types";
import confetti from "canvas-confetti";
import { speakText } from "../utils/speech";

interface CourseDetailViewProps {
  subject: SubjectItem;
  user: UserProfile;
  onBack: () => void;
  onUpdateSubject: (updatedSubject: SubjectItem) => void;
  onRewardXp: (amount: number) => void;
  onRewardCoins: (amount: number, event?: React.MouseEvent) => void;
  onNavigateToLumina?: (subjectName: string) => void;
  onNavigateToGuilds?: () => void;
}

type CourseTab = "content" | "activities" | "participants" | "grades" | "forum";

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  subject,
  user,
  onBack,
  onUpdateSubject,
  onRewardXp,
  onRewardCoins,
  onNavigateToLumina,
  onNavigateToGuilds,
}) => {
  const [activeTab, setActiveTab] = useState<CourseTab>("activities");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    subject.activities && subject.activities.length > 0 ? subject.activities[0].id : null
  );

  // Activity Submission State
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessMessage, setSubmissionSuccessMessage] = useState<string | null>(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  // Participants Filter State
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantRoleFilter, setParticipantRoleFilter] = useState<"all" | "professor" | "tutor" | "student">("all");
  const [messageRecipient, setMessageRecipient] = useState<CourseParticipant | null>(null);
  const [directMessageText, setDirectMessageText] = useState("");
  const [messageSentFeedback, setMessageSentFeedback] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Forum Topic Creation State
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");

  const activities = subject.activities || [];
  const participants = subject.participants || [];
  const materials = subject.materials || [];
  const forumTopics = subject.forumTopics || [];

  // Selected Activity
  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || activities[0];

  // Submission handler
  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    if (!submissionFile && !submissionText.trim()) {
      alert("Por favor, selecione um arquivo ou escreva um texto online antes de enviar.");
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const newFileObj = submissionFile
      ? {
          name: submissionFile.name,
          size: `${(submissionFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: submissionFile.type || "application/octet-stream",
          submittedAt: now.toISOString(),
        }
      : selectedActivity.submissionFiles?.[0] || {
          name: "Envio_Texto_Online.txt",
          size: "12 KB",
          type: "text/plain",
          submittedAt: now.toISOString(),
        };

    const updatedActivities: CourseActivity[] = activities.map((act) => {
      if (act.id === selectedActivity.id) {
        return {
          ...act,
          status: "submitted",
          submittedAt: now.toISOString(),
          submissionText: submissionText.trim() || act.submissionText || "Envio submetido via Sala da Disciplina AVA IFES.",
          submissionFiles: [newFileObj],
        };
      }
      return act;
    });

    const completedCount = updatedActivities.filter((a) => a.status === "submitted" || a.status === "graded").length;
    const progressPct = Math.round((completedCount / Math.max(1, updatedActivities.length)) * 100);

    const updatedSubj: SubjectItem = {
      ...subject,
      activities: updatedActivities,
      completedTasks: completedCount,
      totalTasks: updatedActivities.length,
      progressPercentage: progressPct,
    };

    onUpdateSubject(updatedSubj);

    // Reward XP & Coins
    const xpReward = selectedActivity.xpReward || 80;
    const coinsReward = selectedActivity.coinsReward || 35;
    onRewardXp(xpReward);
    onRewardCoins(coinsReward);

    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.5 },
    });

    speakText(
      `Atividade ${selectedActivity.title} enviada com sucesso no AVA IFES! Você ganhou ${xpReward} pontos de experiência e ${coinsReward} moedas!`,
      true
    );

    setIsSubmitting(false);
    setIsEditingSubmission(false);
    setSubmissionFile(null);
    setSubmissionSuccessMessage(`Atividade enviada com sucesso em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}!`);

    setTimeout(() => {
      setSubmissionSuccessMessage(null);
    }, 6000);
  };

  // Remove submission handler
  const handleRemoveSubmission = () => {
    if (!selectedActivity) return;
    if (!window.confirm("Deseja realmente remover este envio de atividade?")) return;

    const updatedActivities: CourseActivity[] = activities.map((act) => {
      if (act.id === selectedActivity.id) {
        return {
          ...act,
          status: "pending",
          submittedAt: null,
          submissionFiles: [],
          submissionText: "",
        };
      }
      return act;
    });

    const completedCount = updatedActivities.filter((a) => a.status === "submitted" || a.status === "graded").length;
    const progressPct = Math.round((completedCount / Math.max(1, updatedActivities.length)) * 100);

    const updatedSubj: SubjectItem = {
      ...subject,
      activities: updatedActivities,
      completedTasks: completedCount,
      totalTasks: updatedActivities.length,
      progressPercentage: progressPct,
    };

    onUpdateSubject(updatedSubj);
    setIsEditingSubmission(false);
    speakText("Envio removido. Você pode enviar um novo arquivo quando quiser antes do prazo.", false);
  };

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Send Direct Message inside AVA
  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMessageText.trim() || !messageRecipient) return;

    setMessageSentFeedback(true);
    speakText(`Mensagem enviada para ${messageRecipient.name}!`, false);
    setTimeout(() => {
      setMessageSentFeedback(false);
      setMessageRecipient(null);
      setDirectMessageText("");
    }, 2000);
  };

  // Create forum topic
  const handleCreateForumTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;

    const newTopic: CourseForumTopic = {
      id: `topic_${Date.now()}`,
      title: newTopicTitle.trim(),
      authorName: user.name || "Estudante IFES",
      authorRole: "Estudante",
      createdAt: "Hoje às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      repliesCount: 0,
      lastReplyAt: "Agora",
      content: newTopicContent.trim(),
      pinned: false,
    };

    const updatedSubj: SubjectItem = {
      ...subject,
      forumTopics: [newTopic, ...(subject.forumTopics || [])],
    };

    onUpdateSubject(updatedSubj);
    onRewardXp(30);
    confetti({ particleCount: 50, spread: 60 });
    speakText("Dúvida publicada no fórum da turma com sucesso!", false);
    setShowNewTopicModal(false);
    setNewTopicTitle("");
    setNewTopicContent("");
  };

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.enrollment.toLowerCase().includes(participantSearch.toLowerCase());

    if (participantRoleFilter === "all") return matchesSearch;
    return matchesSearch && p.role === participantRoleFilter;
  });

  // Calculate Weighted Grade
  const gradedActivities = activities.filter((a) => a.grade !== null && a.grade !== undefined);
  const totalWeight = gradedActivities.reduce((acc, a) => acc + (a.weight || 0), 0);
  const currentWeightedSum = gradedActivities.reduce((acc, a) => acc + (a.grade || 0) * ((a.weight || 0) / 100), 0);
  const currentAverage = totalWeight > 0 ? (currentWeightedSum / (totalWeight / 100)).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-white animate-fadeIn pb-12">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-4 rounded-2xl border border-white/5 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[#e2ff31] hover:underline font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Meus Cursos</span>
          </button>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-xs">{subject.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {subject.code && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/20">
              {subject.code}
            </span>
          )}
          <a
            href="https://ava.ifes.edu.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white/5 hover:bg-white/10 text-neutral-300 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            <span>Abrir no AVA IFES</span>
          </a>
        </div>
      </div>

      {/* Course Hero Banner */}
      <div className="bg-gradient-to-r from-[#141414] via-[#181818] to-[#121212] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#e2ff31]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold px-2.5 py-0.5 rounded-full bg-[#e2ff31]/10 border border-[#e2ff31]/20">
                Sala de Aula Virtual IFES
              </span>
              {subject.semester && (
                <span className="text-xs text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  {subject.semester}
                </span>
              )}
              {subject.campus && (
                <span className="text-xs text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  {subject.campus}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {subject.name}
            </h1>

            {subject.syllabusSummary && (
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-2">
                {subject.syllabusSummary}
              </p>
            )}

            {/* Teacher & Schedule info */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-400">
              {subject.teacher && (
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <User className="w-3.5 h-3.5 text-[#e2ff31]" />
                  <span>{subject.teacher}</span>
                  {subject.teacherEmail && (
                    <button
                      onClick={() => handleCopyEmail(subject.teacherEmail!)}
                      className="text-neutral-500 hover:text-[#e2ff31] transition ml-1"
                      title="Copiar e-mail do professor"
                    >
                      {copiedEmail === subject.teacherEmail ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              )}
              {subject.roomOrSchedule && (
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{subject.roomOrSchedule}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Quick Stats Card */}
          <div className="bg-[#181818]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col gap-3 min-w-[240px] shadow-lg">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-medium">Progresso da Disciplina</span>
              <span className="font-mono font-bold text-[#e2ff31]">
                {subject.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#e2ff31] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(226,255,49,0.5)]"
                style={{ width: `${subject.progressPercentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-400">
              <span>{subject.completedTasks || 0} de {subject.totalTasks || activities.length} concluidas</span>
              <span className="text-emerald-400 font-bold">Média: {currentAverage}</span>
            </div>

            {onNavigateToLumina && (
              <button
                onClick={() => onNavigateToLumina(subject.name)}
                className="w-full mt-1 bg-white/5 hover:bg-[#e2ff31] hover:text-black text-neutral-200 border border-white/10 hover:border-[#e2ff31] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tirar Dúvidas com Lumina IA</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Style AVA IFES / Moodle) */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-4 mt-6 scrollbar-none">
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "activities"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Atividades & Tarefas ({activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "participants"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participantes da Turma ({participants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "content"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Conteúdos & Aulas ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("grades")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "grades"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Quadro de Notas ({gradedActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("forum")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "forum"
                ? "bg-[#e2ff31] text-black shadow-md"
                : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fórum de Dúvidas ({forumTopics.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ATIVIDADES & ENVIO DE TAREFAS
          ========================================================================= */}
      {activeTab === "activities" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Activities List (Span 4) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tarefas Avaliativas
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {activities.filter((a) => a.status === "submitted" || a.status === "graded").length}/
                {activities.length} entregues
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="p-6 bg-[#141414] rounded-2xl border border-white/5 text-center text-xs text-neutral-400">
                Nenhuma atividade cadastrada para esta disciplina no momento.
              </div>
            ) : (
              activities.map((activity) => {
                const isSelected = selectedActivity?.id === activity.id;
                const isSubmitted = activity.status === "submitted";
                const isGraded = activity.status === "graded";

                return (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivityId(activity.id);
                      setIsEditingSubmission(false);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[#1c1c1c] border-[#e2ff31] shadow-lg shadow-[#e2ff31]/5"
                        : "bg-[#141414] border-white/5 hover:border-white/15 hover:bg-[#181818]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-neutral-400 truncate">
                        {activity.unitName || "Atividade"}
                      </span>
                      {isGraded ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Nota: {activity.grade}
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Enviada
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-white line-clamp-2">
                      {activity.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Prazo: {activity.dueDate.replace("T", " ")}</span>
                      </span>
                      {activity.weight && (
                        <span className="font-mono text-neutral-500">Peso: {activity.weight}%</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Activity Submission Workspace (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedActivity ? (
              <div className="bg-[#141414] p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-xl space-y-6">
                {/* Activity Header */}
                <div className="space-y-2 border-b border-white/10 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e2ff31] bg-[#e2ff31]/10 px-2.5 py-0.5 rounded-full border border-[#e2ff31]/20">
                      {selectedActivity.unitName || "Atividade Avaliativa"}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>Valor: <strong>{selectedActivity.maxGrade} pontos</strong></span>
                      {selectedActivity.weight && (
                        <span>• Peso: <strong>{selectedActivity.weight}%</strong></span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {selectedActivity.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {selectedActivity.description}
                  </p>
                </div>

                {/* Status Table (Moodle IFES Style) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Status do Envio (AVA IFES)
                  </h4>

                  <div className="rounded-2xl border border-white/10 overflow-hidden text-xs divide-y divide-white/5 bg-[#181818]">
                    <div className="grid grid-cols-3 p-3 sm:p-3.5">
                      <span className="text-neutral-400 font-medium">Status do envio:</span>
                      <div className="col-span-2">
                        {selectedActivity.status === "submitted" || selectedActivity.status === "graded" ? (
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Enviado para avaliação
                          </span>
                        ) : (
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> Nenhuma tentativa de envio
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 sm:p-3.5">
                      <span className="text-neutral-400 font-medium">Status da avaliação:</span>
                      <div className="col-span-2">
                        {selectedActivity.status === "graded" ? (
                          <span className="font-bold text-[#e2ff31] flex items-center gap-1.5">
                            <Award className="w-4 h-4" /> Avaliado • Nota: {selectedActivity.grade} / {selectedActivity.maxGrade}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Não avaliado</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 p-3 sm:p-3.5">
                      <span className="text-neutral-400 font-medium">Data de entrega:</span>
                      <span className="col-span-2 text-white font-mono">
                        {selectedActivity.dueDate.replace("T", " às ")}
                      </span>
                    </div>

                    {selectedActivity.submittedAt && (
                      <div className="grid grid-cols-3 p-3 sm:p-3.5">
                        <span className="text-neutral-400 font-medium">Última modificação:</span>
                        <span className="col-span-2 text-white font-mono">
                          {new Date(selectedActivity.submittedAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(selectedActivity.submittedAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {selectedActivity.submissionFiles && selectedActivity.submissionFiles.length > 0 && (
                      <div className="grid grid-cols-3 p-3 sm:p-3.5">
                        <span className="text-neutral-400 font-medium">Arquivos enviados:</span>
                        <div className="col-span-2 space-y-1.5">
                          {selectedActivity.submissionFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 bg-[#222] border border-white/10 px-3 py-1.5 rounded-xl text-xs text-white"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-[#e2ff31]" />
                              <span className="font-mono font-medium">{file.name}</span>
                              <span className="text-[10px] text-neutral-400">({file.size})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedActivity.submissionText && (
                      <div className="grid grid-cols-3 p-3 sm:p-3.5">
                        <span className="text-neutral-400 font-medium">Comentários do envio:</span>
                        <p className="col-span-2 text-neutral-200 italic">
                          "{selectedActivity.submissionText}"
                        </p>
                      </div>
                    )}

                    {selectedActivity.teacherFeedback && (
                      <div className="grid grid-cols-3 p-3 sm:p-3.5 bg-emerald-950/20">
                        <span className="text-emerald-400 font-bold">Feedback do Professor:</span>
                        <div className="col-span-2 space-y-1">
                          <p className="text-emerald-200 text-xs leading-relaxed">
                            {selectedActivity.teacherFeedback}
                          </p>
                          <span className="text-[10px] text-emerald-400/80 font-medium">
                            Professor Responsável: {subject.teacher || "IFES"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Success Toast */}
                {submissionSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{submissionSuccessMessage}</span>
                  </div>
                )}

                {/* Interactive Submission Box / Enviar Tarefa */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-[#e2ff31]" />
                      <span>
                        {selectedActivity.status === "submitted" && !isEditingSubmission
                          ? "Gerenciar Envio da Atividade"
                          : "Enviar Trabalho / Adicionar Envio"}
                      </span>
                    </h4>

                    {selectedActivity.status === "submitted" && !isEditingSubmission && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingSubmission(true)}
                          className="text-xs text-[#e2ff31] hover:underline font-bold transition cursor-pointer"
                        >
                          Editar Envio
                        </button>
                        <span className="text-neutral-600">•</span>
                        <button
                          onClick={handleRemoveSubmission}
                          className="text-xs text-red-400 hover:underline font-bold transition cursor-pointer"
                        >
                          Remover Envio
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedActivity.status !== "submitted" || isEditingSubmission ? (
                    <form onSubmit={handleSubmitActivity} className="space-y-4">
                      {/* Drag & Drop File Selector */}
                      <div className="border-2 border-dashed border-white/10 hover:border-[#e2ff31]/50 bg-[#181818] rounded-2xl p-6 text-center transition group">
                        <input
                          type="file"
                          id="activity-file-input"
                          onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor="activity-file-input"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-[#222] text-[#e2ff31] flex items-center justify-center group-hover:scale-105 transition shadow-inner">
                            <FileUp className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-white group-hover:text-[#e2ff31] transition">
                            {submissionFile ? submissionFile.name : "Clique para selecionar o arquivo da atividade"}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {submissionFile
                              ? `Tamanho: ${(submissionFile.size / (1024 * 1024)).toFixed(2)} MB`
                              : "Formatos aceitos: PDF, DOCX, ZIP, PY, C, JAVA, JS (Tamanho máx: 20MB)"}
                          </span>
                        </label>
                      </div>

                      {/* Online Text Submission / Comments */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">
                          Texto Online / Link do Repositório GitHub / Comentários para o Professor:
                        </label>
                        <textarea
                          rows={3}
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Ex: Segue em anexo a implementação do Trabalho 1. O código-fonte também está disponível em https://github.com/..."
                          className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#e2ff31] resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#e2ff31]" />
                          <span>Recompensa: +{selectedActivity.xpReward || 80} XP e +{selectedActivity.coinsReward || 35} 🪙</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditingSubmission && (
                            <button
                              type="button"
                              onClick={() => setIsEditingSubmission(false)}
                              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:opacity-50 text-black px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-[#e2ff31]/10 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? "Enviando ao AVA..." : "Salvar Mudanças & Enviar"}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Sua atividade está entregue</div>
                          <div className="text-[11px] text-neutral-400">
                            Aguardando correção pelo professor ou monitor.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingSubmission(true)}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Substituir Envio
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 bg-[#141414] rounded-2xl border border-white/5 text-center text-neutral-400">
                Selecione uma atividade à esquerda para visualizar os detalhes e realizar o envio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PARTICIPANTES DA TURMA ("VER QUEM PARTICIPA DO CURSO")
          ========================================================================= */}
      {activeTab === "participants" && (
        <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#e2ff31]" />
                <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                  Quadro de Pessoas
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Participantes do Curso ({participants.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Professores, tutores e estudantes matriculados nesta disciplina no AVA IFES.
              </p>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setParticipantRoleFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  participantRoleFilter === "all" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Todos ({participants.length})
              </button>
              <button
                onClick={() => setParticipantRoleFilter("professor")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  participantRoleFilter === "professor" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Professores ({participants.filter((p) => p.role === "professor").length})
              </button>
              <button
                onClick={() => setParticipantRoleFilter("tutor")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  participantRoleFilter === "tutor" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Monitores ({participants.filter((p) => p.role === "tutor").length})
              </button>
              <button
                onClick={() => setParticipantRoleFilter("student")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  participantRoleFilter === "student" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Estudantes ({participants.filter((p) => p.role === "student").length})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail institucional ou matrícula..."
              className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
            />
          </div>

          {/* Participants Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParticipants.map((participant) => {
              const isProf = participant.role === "professor";
              const isTutor = participant.role === "tutor";

              return (
                <div
                  key={participant.id}
                  className="bg-[#181818] border border-white/10 hover:border-white/20 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md ${
                            isProf
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : isTutor
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          }`}
                        >
                          {participant.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#181818] ${
                            participant.isOnline ? "bg-emerald-400" : "bg-neutral-600"
                          }`}
                          title={participant.isOnline ? "Online agora" : "Desconectado"}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{participant.name}</h4>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isProf
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : isTutor
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {isProf ? "Professor" : isTutor ? "Monitor" : "Estudante"}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Matrícula: {participant.enrollment}
                        </div>
                      </div>
                    </div>
                  </div>

                  {participant.bio && (
                    <p className="text-xs text-neutral-300 line-clamp-2 italic">
                      "{participant.bio}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-white/5">
                    <span className="truncate max-w-[180px] font-mono">{participant.email}</span>
                    <span className="text-[10px] text-neutral-500">{participant.lastAccess || "Ativo recentemente"}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setMessageRecipient(participant)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#e2ff31]" />
                      <span>Mensagem</span>
                    </button>

                    <button
                      onClick={() => handleCopyEmail(participant.email)}
                      className="bg-white/5 hover:bg-white/10 text-neutral-300 text-xs py-1.5 px-2.5 rounded-xl border border-white/10 transition cursor-pointer"
                      title="Copiar e-mail institucional"
                    >
                      {copiedEmail === participant.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onNavigateToGuilds && !isProf && (
                      <button
                        onClick={onNavigateToGuilds}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs py-1.5 px-2.5 rounded-xl border border-amber-500/20 transition cursor-pointer"
                        title="Convidar para Duelo na Equipe"
                      >
                        <Swords className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CONTEÚDO & AULAS / MATERIAIS
          ========================================================================= */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                  Material Didático Oficial
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Apostilas, Slides & Gravações do AVA
                </h3>
              </div>

              {onNavigateToLumina && (
                <button
                  onClick={() => onNavigateToLumina(subject.name)}
                  className="bg-[#e2ff31] hover:bg-[#d4f222] text-black font-bold text-xs px-4 py-2 rounded-full uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explicar Conteúdo com IA</span>
                </button>
              )}
            </div>

            {materials.length === 0 ? (
              <div className="p-8 bg-[#181818] rounded-2xl text-center text-xs text-neutral-400">
                Nenhum arquivo ou slide adicionado ainda nesta disciplina.
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-4 bg-[#181818] rounded-2xl border border-white/5 hover:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 text-[#e2ff31] flex items-center justify-center shrink-0 border border-white/10">
                        {mat.type === "pdf" ? (
                          <FileText className="w-5 h-5 text-red-400" />
                        ) : mat.type === "slide" ? (
                          <Award className="w-5 h-5 text-amber-400" />
                        ) : mat.type === "video" ? (
                          <ExternalLink className="w-5 h-5 text-blue-400" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{mat.title}</h4>
                          {mat.unitName && (
                            <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                              {mat.unitName}
                            </span>
                          )}
                        </div>
                        {mat.description && (
                          <p className="text-xs text-neutral-400">{mat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {mat.fileSize && (
                        <span className="text-xs text-neutral-500 font-mono">{mat.fileSize}</span>
                      )}
                      <a
                        href={mat.url || "#"}
                        target={mat.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!mat.url) {
                            e.preventDefault();
                            alert(`Visualizando material: ${mat.title}`);
                          }
                        }}
                        className="bg-white/5 hover:bg-white/10 text-[#e2ff31] border border-white/10 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Acessar Material</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: QUADRO DE NOTAS / LIVRO DE AVALIAÇÕES
          ========================================================================= */}
      {activeTab === "grades" && (
        <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                Livro de Notas & Avaliações
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Desempenho no Semestre
              </h3>
            </div>

            <div className="bg-[#181818] px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400">Média Parcial</div>
                <div className="text-2xl font-black text-[#e2ff31] font-mono">{currentAverage}</div>
              </div>
              <div className="text-xs text-neutral-400">
                Situação:{" "}
                <span
                  className={`font-bold ${
                    parseFloat(currentAverage) >= 7.0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {parseFloat(currentAverage) >= 7.0 ? "Aprovado / Ótimo" : "Em andamento"}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Item de Avaliação</th>
                  <th className="py-3 px-4">Peso</th>
                  <th className="py-3 px-4">Nota Obtida</th>
                  <th className="py-3 px-4">Faixa</th>
                  <th className="py-3 px-4">Feedback do Professor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{act.title}</div>
                      <div className="text-[10px] text-neutral-400">{act.unitName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {act.weight ? `${act.weight}%` : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {act.grade !== null && act.grade !== undefined ? (
                        <span className="text-emerald-400 text-sm">{act.grade.toFixed(1)}</span>
                      ) : act.status === "submitted" ? (
                        <span className="text-blue-400 italic">Aguardando</span>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-400">
                      0.0 - {act.maxGrade.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 italic max-w-xs">
                      {act.teacherFeedback || "Nenhum comentário registrado ainda."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: FÓRUM DE DÚVIDAS
          ========================================================================= */}
      {activeTab === "forum" && (
        <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                Comunidade da Disciplina
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Fórum de Dúvidas & Avisos
              </h3>
              <p className="text-xs text-neutral-400">
                Interaja com seus colegas de turma e envie perguntas ao professor da matéria.
              </p>
            </div>

            <button
              onClick={() => setShowNewTopicModal(true)}
              className="bg-[#e2ff31] hover:bg-[#d4f222] text-black font-bold text-xs px-5 py-2.5 rounded-full uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Tópico de Dúvida</span>
            </button>
          </div>

          {forumTopics.length === 0 ? (
            <div className="p-8 bg-[#181818] rounded-2xl text-center text-xs text-neutral-400">
              Nenhum tópico aberto ainda neste fórum. Seja o primeiro a perguntar!
            </div>
          ) : (
            <div className="space-y-4">
              {forumTopics.map((topic) => (
                <div
                  key={topic.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    topic.pinned
                      ? "bg-[#181818] border-[#e2ff31]/40 shadow-md"
                      : "bg-[#161616] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {topic.pinned && (
                          <span className="text-[10px] font-bold uppercase bg-[#e2ff31]/20 text-[#e2ff31] px-2 py-0.5 rounded-full border border-[#e2ff31]/30">
                            Fixado
                          </span>
                        )}
                        <h4 className="font-bold text-base text-white">{topic.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>Por <strong>{topic.authorName}</strong> ({topic.authorRole})</span>
                        <span>•</span>
                        <span>{topic.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 text-[#e2ff31]" />
                      <span>{topic.repliesCount} respostas</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed bg-[#111] p-3.5 rounded-xl border border-white/5">
                    {topic.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Direct Message to Participant */}
      {messageRecipient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-[2rem] p-6 max-w-md w-full space-y-4 text-white shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#e2ff31]" />
                <h4 className="font-bold text-sm">Enviar Mensagem Privada no AVA</h4>
              </div>
              <button
                onClick={() => setMessageRecipient(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white/5 rounded-xl text-xs space-y-0.5">
              <div className="font-bold text-white">Destinatário: {messageRecipient.name}</div>
              <div className="text-neutral-400">{messageRecipient.email} ({messageRecipient.role})</div>
            </div>

            {messageSentFeedback ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                ✓ Mensagem enviada com sucesso para a caixa postal do AVA!
              </div>
            ) : (
              <form onSubmit={handleSendDirectMessage} className="space-y-4">
                <textarea
                  rows={4}
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  placeholder="Escreva sua mensagem institucional aqui..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#e2ff31] resize-none"
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageRecipient(null)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Enviar Mensagem</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Forum Topic */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-[2rem] p-6 max-w-lg w-full space-y-4 text-white shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#e2ff31]" />
                <h4 className="font-bold text-sm">Abrir Novo Tópico de Dúvida</h4>
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForumTopic} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">Assunto / Título da Dúvida:</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ex: Dúvida sobre caso 2 do Teorema Mestre"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e2ff31]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">Mensagem Detalhada:</label>
                <textarea
                  rows={4}
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Descreva sua dúvida com o máximo de detalhes para que o professor e os colegas possam ajudar..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#e2ff31] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#e2ff31] hover:bg-[#d4f222] text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar Tópico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
