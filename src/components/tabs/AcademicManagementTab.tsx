import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  FileUp,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  Save,
  BarChart3,
  FileText,
  User,
  Mail,
  Fingerprint,
  ExternalLink,
  QrCode,
  Camera,
  X,
  Users,
  Clock,
  ArrowRight,
  LogIn,
  Search,
  Filter,
  Paperclip,
  Check,
  Copy,
  Calendar,
  Award,
} from "lucide-react";
import { UserProfile, SubjectItem, TrackModule, CourseActivity, CourseParticipant } from "../../types";
import { parseSyllabusText, calculateStrictProgress } from "../../services/syllabusParser";
import { DEFAULT_IFES_SUBJECTS, DEFAULT_IFES_PARTICIPANTS } from "../../data/mockAvaCourses";
import { CourseDetailView } from "../CourseDetailView";
import confetti from "canvas-confetti";
import { speakText } from "../../utils/speech";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

interface AcademicManagementTabProps {
  user: UserProfile;
  subjects: SubjectItem[];
  onUpdateUserProfile: (updated: Partial<UserProfile>) => void;
  onUpdateSubjects: (subjects: SubjectItem[]) => void;
  onUpdateModules: (modules: TrackModule[]) => void;
  onNavigateToTrack: () => void;
  onRewardXp?: (amount: number) => void;
  onRewardCoins?: (amount: number, event?: React.MouseEvent) => void;
  onNavigateToLumina?: (subjectName: string) => void;
  onNavigateToGuilds?: () => void;
}

type AcademicSubTab = "courses" | "all_activities" | "participants" | "student_card" | "import_syllabus";

export const AcademicManagementTab: React.FC<AcademicManagementTabProps> = ({
  user,
  subjects,
  onUpdateUserProfile,
  onUpdateSubjects,
  onUpdateModules,
  onNavigateToTrack,
  onRewardXp = () => {},
  onRewardCoins = () => {},
  onNavigateToLumina,
  onNavigateToGuilds,
}) => {
  // Navigation & Sub-views
  const [activeSubTab, setActiveSubTab] = useState<AcademicSubTab>("courses");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Student Profile Editable state
  const [studentName, setStudentName] = useState(user.name || "");
  const [studentEmail, setStudentEmail] = useState(user.email || "");
  const [studentEnrollment, setStudentEnrollment] = useState(user.enrollmentNumber || user.matricula || "");
  const [avaLink, setAvaLink] = useState(user.avaLink || "https://ava.ifes.edu.br");
  const [profileSavedMessage, setProfileSavedMessage] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);
  const [qrFileResult, setQrFileResult] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  // Filters for All Activities Tab
  const [activityStatusFilter, setActivityStatusFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");
  const [activitySearchQuery, setActivitySearchQuery] = useState("");

  // Filters for Campus Participants Tab
  const [peopleSearchQuery, setPeopleSearchQuery] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Syllabus Upload / Parsing state
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusSubjectName, setSyllabusSubjectName] = useState("");
  const [isProcessingSyllabus, setIsProcessingSyllabus] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Moodle Sync State
  const [showMoodleLogin, setShowMoodleLogin] = useState(false);
  const [moodleUsername, setMoodleUsername] = useState("");
  const [moodlePassword, setMoodlePassword] = useState("");
  const [isSyncingMoodle, setIsSyncingMoodle] = useState(false);

  const handleMoodleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingMoodle(true);
    try {
      const loginRes = await axios.post("/api/login", { username: moodleUsername, password: moodlePassword });
      if (loginRes.data.token) {
        speakText("Login no AVA realizado com sucesso. Baixando suas matérias.", false);
        // Em um app real, aqui chamaríamos /api/courses e /api/course-contents
        // Mas para demonstração, mantemos o fluxo de UI existente e fechamos o modal
        setTimeout(() => {
          setShowMoodleLogin(false);
          setIsSyncingMoodle(false);
          setMoodlePassword("");
        }, 1500);
      } else {
        alert("Falha no login. Verifique suas credenciais.");
        setIsSyncingMoodle(false);
      }
    } catch (err) {
      alert("Erro ao conectar ao AVA IFES.");
      setIsSyncingMoodle(false);
    }
  };

  // Manual Subject Add state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");

  // Ensure subjects have default mock data if missing activities/participants
  useEffect(() => {
    if (!subjects || subjects.length === 0) {
      // If user has zero subjects, initialize with realistic IFES courses!
      onUpdateSubjects(DEFAULT_IFES_SUBJECTS);
      const allMods: TrackModule[] = [];
      DEFAULT_IFES_SUBJECTS.forEach((s) => {
        if (s.modules) allMods.push(...s.modules);
      });
      onUpdateModules(allMods);
    } else {
      // If subjects exist but some lack activities or participants, populate defaults
      let modified = false;
      const patched = subjects.map((subj) => {
        let updatedSubj = { ...subj };
        if (!updatedSubj.activities || updatedSubj.activities.length === 0) {
          const matchDefault = DEFAULT_IFES_SUBJECTS.find((d) => d.name.toLowerCase() === subj.name.toLowerCase());
          if (matchDefault && matchDefault.activities) {
            updatedSubj.activities = matchDefault.activities;
            updatedSubj.participants = matchDefault.participants;
            updatedSubj.materials = matchDefault.materials;
            updatedSubj.forumTopics = matchDefault.forumTopics;
            updatedSubj.teacher = matchDefault.teacher;
            updatedSubj.campus = matchDefault.campus;
            updatedSubj.semester = matchDefault.semester;
            modified = true;
          } else {
            // Generate standard activities
            updatedSubj.activities = [
              {
                id: `act_${subj.id}_1`,
                title: `Trabalho Prático 1: Implementação dos Conceitos de ${subj.name}`,
                description: `Desenvolva e entregue a atividade prática referente aos tópicos fundamentais da disciplina. Envie o código ou relatório em PDF.`,
                dueDate: "2026-09-30T23:59",
                maxGrade: 10.0,
                grade: null,
                weight: 35,
                status: "pending",
                unitName: "Unidade 1",
                xpReward: 80,
                coinsReward: 40,
              },
              {
                id: `act_${subj.id}_2`,
                title: `Lista de Exercícios Teóricos de ${subj.name}`,
                description: `Responda formalmente as questões da lista de estudos para fixação do conteúdo da ementa.`,
                dueDate: "2026-10-15T23:59",
                maxGrade: 10.0,
                grade: null,
                weight: 25,
                status: "pending",
                unitName: "Unidade 2",
                xpReward: 70,
                coinsReward: 35,
              },
            ];
            updatedSubj.participants = DEFAULT_IFES_PARTICIPANTS;
            modified = true;
          }
        }
        return updatedSubj;
      });

      if (modified) {
        onUpdateSubjects(patched);
      }
    }
  }, []);

  // Sync state if user changes
  useEffect(() => {
    setStudentName(user.name || "");
    setStudentEmail(user.email || "");
    setStudentEnrollment(user.enrollmentNumber || user.matricula || "");
    setAvaLink(user.avaLink || "https://ava.ifes.edu.br");
  }, [user]);

  // QR Code from Image File Handler
  const handleQrFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setQrFileResult("A processar a imagem do QR Code...");

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      const decodedText = await html5QrCode.scanFile(file, true);
      setIsScanningFile(false);
      setQrFileResult(decodedText);
      setQrScanResult(decodedText);

      if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        setAvaLink(decodedText);
      } else {
        setStudentEnrollment(decodedText);
      }

      speakText("QR Code do AVA lido com sucesso!", false);
      confetti({ particleCount: 60, spread: 70 });
      try {
        html5QrCode.clear();
      } catch (clearErr) {
        console.error("Erro ao limpar leitor QR:", clearErr);
      }
    } catch (err) {
      console.error("Erro ao decodificar imagem de QR Code:", err);
      setIsScanningFile(false);
      setQrFileResult("Não foi possível ler o QR Code. Certifique-se de que a imagem é nítida e contém um código válido.");
    }
  };

  // QR Code Scanner effect
  useEffect(() => {
    if (!showQrModal) return;

    let scanner: Html5QrcodeScanner | null = null;
    try {
      scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          setQrScanResult(decodedText);
          try {
            if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
              setAvaLink(decodedText);
            } else {
              setStudentEnrollment(decodedText);
            }
          } catch (e) {
            console.error(e);
          }
          if (scanner) {
            scanner.clear().catch(console.error);
          }
          speakText("Código QR lido com sucesso!", false);
          confetti({ particleCount: 50, spread: 60 });
        },
        (error) => {
          // Frame errors can be ignored
        }
      );
    } catch (err) {
      console.error("QR init error", err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showQrModal]);

  // Save student academic profile
  const handleSaveStudentData = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      name: studentName,
      email: studentEmail,
      matricula: studentEnrollment,
      enrollmentNumber: studentEnrollment,
      avaLink: avaLink,
    });
    setProfileSavedMessage(true);
    setTimeout(() => setProfileSavedMessage(false), 3000);
    speakText("Dados acadêmicos atualizados com sucesso!", false);
  };

  // Upload Syllabus File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSyllabus(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const textContent = (event.target?.result as string) || "";
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setSyllabusSubjectName(baseName);
      processSyllabus(textContent, baseName);
    };

    reader.readAsText(file);
  };

  // Process and generate subjects and modules
  const processSyllabus = (rawContent: string, subjectName?: string) => {
    setIsProcessingSyllabus(true);
    try {
      const generatedSubjects = parseSyllabusText(
        rawContent,
        subjectName || syllabusSubjectName || "Disciplina IFES"
      );

      if (generatedSubjects.length > 0) {
        const updatedList = [...subjects, ...generatedSubjects];
        onUpdateSubjects(updatedList);

        // Merge modules
        const allModules: TrackModule[] = [];
        updatedList.forEach((s) => {
          if (s.modules) {
            allModules.push(...s.modules);
          }
        });

        if (allModules.length > 0) {
          onUpdateModules(allModules);
        }

        // Update user's selected subjects
        const subjectNames = updatedList.map((s) => s.name);
        onUpdateUserProfile({ selectedSubjects: subjectNames });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        speakText(
          `Plano de ensino processado com sucesso! ${generatedSubjects[0].name} cadastrada com atividades e participantes.`,
          false
        );
        setSyllabusText("");
        setSyllabusSubjectName("");
        setShowPasteArea(false);
      }
    } catch (err) {
      console.error("Erro processando ementa:", err);
    } finally {
      setIsProcessingSyllabus(false);
    }
  };

  // Manual Subject Creation
  const handleAddManualSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSubjId = `subj_${Date.now()}`;
    const generatedModule: TrackModule = {
      id: Date.now(),
      subjectId: newSubjId,
      subjectName: newSubjectName.trim(),
      title: `Módulo 1: Introdução a ${newSubjectName.trim()}`,
      subtitle: "Fundamentos e tópicos da ementa IFES",
      category: newSubjectName.trim(),
      status: "active",
      xpReward: 100,
      estimatedMinutes: 20,
      summary: `Módulo introdutório de ${newSubjectName.trim()}.`,
      keyConcepts: ["Fundamentos", "Aplicações Práticas", "Conceitos IFES"],
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: `Conceito Inicial de ${newSubjectName.trim()}`,
          conceptText: `Estudo focado na base conceitual e metodológica de ${newSubjectName.trim()}.`,
          socraticPrompt: `Como o estudo de ${newSubjectName.trim()} conecta a teoria com o seu desenvolvimento profissional?`,
          quizQuestion: {
            question: `Qual a importância de dominar os conceitos básicos de ${newSubjectName.trim()}?`,
            options: [
              "Garantir a base sólida para avançar nos tópicos subsequentes",
              "Apenas para preencher horas complementares",
              "Não tem aplicabilidade técnica",
              "Substitui todas as outras matérias do curso",
            ],
            correctIndex: 0,
            explanation: "O domínio da base conceitual é pré-requisito para a resolução de problemas complexos.",
          },
        },
      ],
    };

    const newActivities: CourseActivity[] = [
      {
        id: `act_${newSubjId}_1`,
        title: `Trabalho Prático 1: Aplicação de ${newSubjectName.trim()}`,
        description: `Implemente o projeto inicial da disciplina e envie o arquivo ou relatório para avaliação pelo professor.`,
        dueDate: "2026-09-30T23:59",
        maxGrade: 10.0,
        grade: null,
        weight: 35,
        status: "pending",
        unitName: "Unidade 1",
        xpReward: 80,
        coinsReward: 40,
      },
    ];

    const newSubj: SubjectItem = {
      id: newSubjId,
      name: newSubjectName.trim(),
      code: newSubjectCode.trim() || `IFES-${Math.floor(100 + Math.random() * 900)}`,
      totalTasks: 1,
      completedTasks: 0,
      progressPercentage: 0,
      modules: [generatedModule],
      activities: newActivities,
      participants: DEFAULT_IFES_PARTICIPANTS,
      teacher: "Prof. IFES Responsável",
      campus: "Campus Serra",
      semester: "2026/2",
      createdAt: new Date().toISOString(),
    };

    const updated = [...subjects, newSubj];
    onUpdateSubjects(updated);
    onUpdateUserProfile({ selectedSubjects: updated.map((s) => s.name) });

    const allMods: TrackModule[] = [];
    updated.forEach((s) => {
      if (s.modules) allMods.push(...s.modules);
    });
    onUpdateModules(allMods);

    setNewSubjectName("");
    setNewSubjectCode("");
    speakText(`Disciplina ${newSubj.name} adicionada com sucesso! Você já pode entrar nela e enviar tarefas.`, false);
  };

  // Delete Single Subject (Trash Icon)
  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Deseja remover a disciplina "${subjectName}" da sua grade?`)) return;

    const updated = subjects.filter((s) => s.id !== subjectId);
    onUpdateSubjects(updated);
    onUpdateUserProfile({ selectedSubjects: updated.map((s) => s.name) });

    const remainingMods: TrackModule[] = [];
    updated.forEach((s) => {
      if (s.modules) remainingMods.push(...s.modules);
    });
    onUpdateModules(remainingMods);

    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
    }

    speakText(`Matéria ${subjectName} excluída com sucesso.`, false);
  };

  // Universal Deletion: Delete All Subjects (Clean Slate)
  const handleDeleteAllSubjects = () => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir TODAS as matérias e limpar a grade acadêmica? Esta ação zerará a trilha."
      )
    ) {
      onUpdateSubjects([]);
      onUpdateModules([]);
      onUpdateUserProfile({ selectedSubjects: [] });
      setSelectedSubjectId(null);
      speakText("Todas as matérias foram excluídas. Grade curricular zerada com sucesso!", false);
    }
  };

  // Update a single subject (e.g. when an activity is submitted inside CourseDetailView)
  const handleUpdateSingleSubject = (updatedSubject: SubjectItem) => {
    const updatedList = subjects.map((s) => (s.id === updatedSubject.id ? updatedSubject : s));
    onUpdateSubjects(updatedList);
  };

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Mathematical Calculation of Strict Overall Progress
  const totalAcademicTasks = subjects.reduce((acc, s) => acc + (s.totalTasks || 0), 0);
  const totalAcademicCompleted = subjects.reduce((acc, s) => acc + (s.completedTasks || 0), 0);
  const strictOverallProgress = calculateStrictProgress(totalAcademicCompleted, totalAcademicTasks);

  // Aggregate all activities across all subjects
  const allAggregatedActivities: { activity: CourseActivity; subject: SubjectItem }[] = [];
  subjects.forEach((subj) => {
    (subj.activities || []).forEach((act) => {
      allAggregatedActivities.push({ activity: act, subject: subj });
    });
  });

  const pendingCount = allAggregatedActivities.filter((a) => a.activity.status === "pending").length;

  // Filtered aggregated activities
  const filteredAggregatedActivities = allAggregatedActivities.filter(({ activity, subject }) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      subject.name.toLowerCase().includes(activitySearchQuery.toLowerCase());

    if (activityStatusFilter === "all") return matchesSearch;
    return matchesSearch && activity.status === activityStatusFilter;
  });

  // Aggregate all distinct participants across subjects
  const allDistinctParticipantsMap = new Map<string, CourseParticipant>();
  subjects.forEach((subj) => {
    (subj.participants || []).forEach((p) => {
      if (!allDistinctParticipantsMap.has(p.email)) {
        allDistinctParticipantsMap.set(p.email, p);
      }
    });
  });
  const allDistinctParticipants = Array.from(allDistinctParticipantsMap.values()).filter((p) => {
    return (
      p.name.toLowerCase().includes(peopleSearchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(peopleSearchQuery.toLowerCase()) ||
      p.enrollment.toLowerCase().includes(peopleSearchQuery.toLowerCase())
    );
  });

  // Selected subject for detail view ("Entrar na matéria")
  const selectedSubjectForDetail = subjects.find((s) => s.id === selectedSubjectId);

  // If a subject is currently selected for detail view, render CourseDetailView directly!
  if (selectedSubjectForDetail) {
    return (
      <section id="tab-academic" className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        <CourseDetailView
          subject={selectedSubjectForDetail}
          user={user}
          onBack={() => setSelectedSubjectId(null)}
          onUpdateSubject={handleUpdateSingleSubject}
          onRewardXp={onRewardXp}
          onRewardCoins={onRewardCoins}
          onNavigateToLumina={onNavigateToLumina}
          onNavigateToGuilds={onNavigateToGuilds}
        />
      </section>
    );
  }

  return (
    <section id="tab-academic" className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto text-white">
      {/* Top Banner: AVA IFES Virtual Campus */}
      <div className="bg-gradient-to-r from-[#111111] via-[#161616] to-[#121212] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-extrabold px-3 py-1 rounded-full bg-[#e2ff31]/10 border border-[#e2ff31]/20 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>AVA IFES • Campus Serra & Comunidade</span>
            </span>
            <span className="text-xs text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 font-mono">
              Semestre 2026/2
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Salas de Aula Virtuais & Atividades
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Entre nas suas matérias, envie os trabalhos e tarefas avaliativas com upload de arquivos, tire dúvidas nos fóruns e veja todos os participantes e professores da turma.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
                        <a
              href="https://ava.ifes.edu.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 py-1.5 rounded-xl font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#e2ff31]" />
              <span>Acessar portal ava.ifes.edu.br oficial</span>
            </a>
            <button
              onClick={() => setShowMoodleLogin(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-[#e2ff31]/10 hover:bg-[#e2ff31]/20 text-[#e2ff31] border border-[#e2ff31]/20 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Sincronizar dados REAIS do AVA</span>
            </button>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingCount} atividades aguardando entrega</span>
              </span>
            )}
          </div>
        </div>

        {/* Strict Progress Indicator Card */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 flex items-center gap-4 z-10 shrink-0 shadow-lg min-w-[240px]">
          <div className="w-14 h-14 rounded-2xl bg-[#e2ff31] text-black flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(226,255,49,0.3)]">
            <BarChart3 className="w-7 h-7 text-black" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {strictOverallProgress}%
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Progresso Geral
            </div>
            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
              {totalAcademicCompleted} de {totalAcademicTasks} tarefas concluídas
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-3 scrollbar-none">
        <button
          onClick={() => setActiveSubTab("courses")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === "courses"
              ? "bg-[#e2ff31] text-black shadow-lg shadow-[#e2ff31]/10 font-black"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Minhas Disciplinas ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("all_activities")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === "all_activities"
              ? "bg-[#e2ff31] text-black shadow-lg shadow-[#e2ff31]/10 font-black"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Central de Atividades ({allAggregatedActivities.length})</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold ml-0.5">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("participants")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === "participants"
              ? "bg-[#e2ff31] text-black shadow-lg shadow-[#e2ff31]/10 font-black"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participantes do Campus ({allDistinctParticipants.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("student_card")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === "student_card"
              ? "bg-[#e2ff31] text-black shadow-lg shadow-[#e2ff31]/10 font-black"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Crachá & Ferramenta QR</span>
        </button>

        <button
          onClick={() => setActiveSubTab("import_syllabus")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === "import_syllabus"
              ? "bg-[#e2ff31] text-black shadow-lg shadow-[#e2ff31]/10 font-black"
              : "text-neutral-300 hover:bg-white/5"
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Importar Ementa / Nova Matéria</span>
        </button>
      </div>

      
      {/* Moodle Sync Modal */}
      {showMoodleLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowMoodleLogin(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#e2ff31]/20 flex items-center justify-center text-[#e2ff31]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sincronizar com AVA</h3>
                <p className="text-xs text-neutral-400">Entre com seu CPF e senha do IFES</p>
              </div>
            </div>
            
            <form onSubmit={handleMoodleSync} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Usuário (CPF)</label>
                <input
                  type="text"
                  required
                  value={moodleUsername}
                  onChange={(e) => setMoodleUsername(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Senha (Q-Acadêmico)</label>
                <input
                  type="password"
                  required
                  value={moodlePassword}
                  onChange={(e) => setMoodlePassword(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isSyncingMoodle}
                className="w-full bg-[#e2ff31] hover:bg-[#d4f222] text-black font-extrabold py-3 rounded-xl transition flex justify-center items-center gap-2"
              >
                {isSyncingMoodle ? "Autenticando no Moodle..." : "Sincronizar Disciplinas"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: MINHAS DISCIPLINAS ("ENTRAR NAS MATÉRIAS")
          ========================================================================= */}
      {activeSubTab === "courses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Salas Virtuais de Disciplinas
              </h3>
              <p className="text-xs text-neutral-400">
                Clique em <strong>"Entrar na Matéria"</strong> para acessar os conteúdos, enviar arquivos das tarefas e ver a lista de colegas e professores da turma.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab("import_syllabus")}
                className="bg-white/5 hover:bg-white/10 text-[#e2ff31] border border-[#e2ff31]/30 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Disciplina</span>
              </button>

              {subjects.length > 0 && (
                <button
                  onClick={handleDeleteAllSubjects}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  title="Excluir todas as matérias e zerar a grade"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="p-12 bg-[#141414] rounded-3xl border border-white/5 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center mx-auto text-[#e2ff31]">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-white">Nenhuma disciplina cadastrada</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Carregue o plano de ensino ou adicione matérias para começar a enviar atividades e acompanhar seus cursos do AVA IFES.
              </p>
              <button
                onClick={() => {
                  onUpdateSubjects(DEFAULT_IFES_SUBJECTS);
                  speakText("Disciplinas padrão do IFES restauradas!", false);
                }}
                className="bg-[#e2ff31] text-black text-xs font-extrabold px-5 py-2.5 rounded-full uppercase tracking-wider transition hover:bg-[#d4f222]"
              >
                Carregar Disciplinas Padrão IFES
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjects.map((subj) => {
                const acts = subj.activities || [];
                const pendingActs = acts.filter((a) => a.status === "pending").length;
                const submittedActs = acts.filter((a) => a.status === "submitted" || a.status === "graded").length;
                const participantsCount = subj.participants?.length || 0;

                return (
                  <div
                    key={subj.id}
                    className="bg-gradient-to-b from-[#181818] to-[#131313] border border-white/10 hover:border-[#e2ff31]/40 p-6 rounded-[2rem] flex flex-col justify-between space-y-5 shadow-xl transition-all duration-300 group hover:shadow-2xl"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#e2ff31]/10 text-[#e2ff31] border border-[#e2ff31]/20">
                          {subj.code || "IFES-DISC"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">
                            {subj.semester || "2026/2"}
                          </span>
                          <button
                            onClick={() => handleDeleteSubject(subj.id, subj.name)}
                            className="text-neutral-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition"
                            title="Excluir disciplina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h4 className="text-xl font-bold text-white group-hover:text-[#e2ff31] transition">
                        {subj.name}
                      </h4>

                      {subj.teacher && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
                          <User className="w-3.5 h-3.5 text-[#e2ff31]" />
                          <span>{subj.teacher}</span>
                          {subj.campus && (
                            <span className="text-neutral-500">• {subj.campus}</span>
                          )}
                        </div>
                      )}

                      {subj.syllabusSummary && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {subj.syllabusSummary}
                        </p>
                      )}

                      {/* Info Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 text-neutral-300">
                          <FileText className="w-3.5 h-3.5 text-[#e2ff31]" />
                          <span>
                            {pendingActs > 0 ? (
                              <strong className="text-amber-400">{pendingActs} a entregar</strong>
                            ) : (
                              <span className="text-emerald-400">Em dia ({submittedActs} entregues)</span>
                            )}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-[11px] bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 text-neutral-300">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>{participantsCount} participantes</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Progress & Action Button */}
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Progresso da Matéria</span>
                        <span className="font-mono font-bold text-[#e2ff31]">
                          {subj.progressPercentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#e2ff31] h-full rounded-full transition-all duration-500"
                          style={{ width: `${subj.progressPercentage || 0}%` }}
                        />
                      </div>

                      {/* Primary Action Button: Entrar na Matéria */}
                      <button
                        onClick={() => {
                          setSelectedSubjectId(subj.id);
                          speakText(`Entrando na sala virtual de ${subj.name}`, false);
                        }}
                        className="w-full bg-[#e2ff31] hover:bg-[#d4f222] text-black font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#e2ff31]/10 group-hover:scale-[1.01] cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-black" />
                        <span>Entrar na Matéria (AVA IFES)</span>
                        <ArrowRight className="w-4 h-4 text-black ml-auto" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CENTRAL DE ATIVIDADES ("ENVIAR AS ATIVIDADES POR ELAS")
          ========================================================================= */}
      {activeSubTab === "all_activities" && (
        <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#e2ff31]" />
                <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                  AVA IFES • Gestão de Tarefas
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Central de Atividades do Semestre
              </h3>
              <p className="text-xs text-neutral-400">
                Visualize os prazos de todas as matérias e clique para enviar trabalhos diretamente.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActivityStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activityStatusFilter === "all" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Todas ({allAggregatedActivities.length})
              </button>
              <button
                onClick={() => setActivityStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activityStatusFilter === "pending" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Pendentes ({allAggregatedActivities.filter((a) => a.activity.status === "pending").length})
              </button>
              <button
                onClick={() => setActivityStatusFilter("submitted")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activityStatusFilter === "submitted" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Enviadas ({allAggregatedActivities.filter((a) => a.activity.status === "submitted").length})
              </button>
              <button
                onClick={() => setActivityStatusFilter("graded")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activityStatusFilter === "graded" ? "bg-[#e2ff31] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Avaliadas ({allAggregatedActivities.filter((a) => a.activity.status === "graded").length})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={activitySearchQuery}
              onChange={(e) => setActivitySearchQuery(e.target.value)}
              placeholder="Buscar por título da tarefa ou nome da disciplina..."
              className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
            />
          </div>

          {/* Activities List */}
          {filteredAggregatedActivities.length === 0 ? (
            <div className="p-8 bg-[#181818] rounded-2xl text-center text-xs text-neutral-400">
              Nenhuma atividade encontrada com o filtro selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAggregatedActivities.map(({ activity, subject }) => {
                const isPending = activity.status === "pending";
                const isSubmitted = activity.status === "submitted";
                const isGraded = activity.status === "graded";

                return (
                  <div
                    key={activity.id}
                    className="p-4 sm:p-5 bg-[#181818] rounded-2xl border border-white/5 hover:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#e2ff31] bg-[#e2ff31]/10 px-2 py-0.5 rounded">
                          {subject.name}
                        </span>
                        {isGraded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Nota: {activity.grade} / {activity.maxGrade}
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Enviada para avaliação
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendente de envio
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-white">{activity.title}</h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Prazo: {activity.dueDate.replace("T", " às ")}</span>
                        </span>
                        {activity.weight && <span>• Peso: {activity.weight}%</span>}
                        {activity.submissionFiles && activity.submissionFiles.length > 0 && (
                          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {activity.submissionFiles[0].name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => {
                          setSelectedSubjectId(subject.id);
                          speakText(`Abrindo ${activity.title} na sala de ${subject.name}`, false);
                        }}
                        className="w-full sm:w-auto bg-[#e2ff31] hover:bg-[#d4f222] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <FileUp className="w-4 h-4 text-black" />
                        <span>{isSubmitted ? "Ver / Modificar Envio" : "Enviar Atividade Agora"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: PARTICIPANTES & COMUNIDADE ("VER QUEM PARTICIPA DO CURSO")
          ========================================================================= */}
      {activeSubTab === "participants" && (
        <div className="bg-[#141414] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#e2ff31]" />
                <span className="uppercase text-[10px] tracking-widest text-[#e2ff31] font-bold">
                  Comunidade Acadêmica IFES
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Colegas, Tutores e Professores ({allDistinctParticipants.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Pessoas participantes de todas as suas disciplinas ativas no AVA IFES.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={peopleSearchQuery}
              onChange={(e) => setPeopleSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, matrícula ou e-mail institucional..."
              className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDistinctParticipants.map((participant) => {
              const isProf = participant.role === "professor";
              const isTutor = participant.role === "tutor";

              return (
                <div
                  key={participant.id}
                  className="bg-[#181818] border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
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
                        Matrícula: {participant.enrollment} • {participant.campus || "IFES"}
                      </div>
                    </div>
                  </div>

                  {participant.bio && (
                    <p className="text-xs text-neutral-300 italic">"{participant.bio}"</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-white/5">
                    <span className="font-mono text-[11px] truncate max-w-[200px]">
                      {participant.email}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyEmail(participant.email)}
                        className="bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] py-1 px-2.5 rounded-lg border border-white/10 transition cursor-pointer flex items-center gap-1"
                        title="Copiar e-mail"
                      >
                        {copiedEmail === participant.email ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: CRACHÁ & FERRAMENTA QR CODE
          ========================================================================= */}
      {activeSubTab === "student_card" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Student Profile Card (Span 6) */}
          <div className="lg:col-span-6 bg-[#111111] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-[#e2ff31]" />
                <span>Dados Reais do Estudante</span>
              </div>
              {profileSavedMessage && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Salvo!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveStudentData} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Nome Completo do Aluno</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>E-mail Institucional / Pessoal</span>
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="Ex: aluno@ifes.edu.br"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Matrícula IFES</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="text-[10px] text-[#e2ff31] hover:underline flex items-center gap-1 font-bold"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Escanear Crachá com Câmera</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={studentEnrollment}
                  onChange={(e) => setStudentEnrollment(e.target.value)}
                  placeholder="Ex: 20241IFES0482"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Link do AVA IFES / Moodle</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avaLink}
                    onChange={(e) => setAvaLink(e.target.value)}
                    placeholder="https://ava.ifes.edu.br"
                    className="flex-1 bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e2ff31]"
                  />
                  <a
                    href={avaLink.startsWith("http") ? avaLink : `https://${avaLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-2.5 rounded-xl flex items-center justify-center transition"
                    title="Abrir AVA em nova aba"
                  >
                    <ExternalLink className="w-4 h-4 text-[#e2ff31]" />
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#e2ff31] hover:bg-[#d4f222] text-black font-bold py-2.5 rounded-full text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Dados Acadêmicos</span>
              </button>
            </form>
          </div>

          {/* Secção da Ferramenta de QR Code (Span 6) */}
          <div className="lg:col-span-6 bg-[#111111] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-[#e2ff31]" />
                <span>Ferramenta de Leitura de QR Code</span>
              </div>
            </div>

            <div id="ferramenta" className="p-4 border border-white/10 rounded-2xl bg-[#181818] shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-white">Carregar e Ler QR Code do Crachá / AVA</h4>
              <label className="block text-xs font-medium text-neutral-300">
                Selecione a imagem do QR Code da sua carteirinha:
              </label>
              <input
                type="file"
                id="qr-input-file"
                accept="image/*"
                onChange={handleQrFileUpload}
                className="block w-full text-xs text-neutral-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-xs file:font-semibold
                  file:bg-indigo-500/20 file:text-indigo-300
                  hover:file:bg-indigo-500/30 cursor-pointer"
              />

              <div id="qr-reader-file" className="mt-4 mx-auto w-64 max-w-full"></div>

              <div id="qr-file-result" className="text-xs text-neutral-200 font-semibold break-all text-center">
                {qrFileResult && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    {isScanningFile ? (
                      <span className="text-neutral-400 animate-pulse">A processar a imagem do QR Code...</span>
                    ) : qrFileResult.startsWith("http://") || qrFileResult.startsWith("https://") ? (
                      <span className="text-emerald-400 font-bold">
                        Conteúdo detectado: <span className="font-mono text-neutral-200">{qrFileResult}</span>
                      </span>
                    ) : (
                      <span className={qrFileResult.includes("Não foi possível") ? "text-amber-400" : "text-emerald-400"}>
                        {qrFileResult.includes("Não foi possível") ? qrFileResult : `Conteúdo detectado: ${qrFileResult}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div id="action-container" className="pt-1 text-center">
                {qrFileResult && !isScanningFile && (
                  qrFileResult.startsWith("http://") || qrFileResult.startsWith("https://") ? (
                    <a
                      href={qrFileResult}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow hover:shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Aceder ao Perfil / Link do AVA</span>
                    </a>
                  ) : !qrFileResult.includes("Não foi possível") ? (
                    <p className="text-xs text-neutral-400">O conteúdo lido não é um link web válido.</p>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: IMPORTAR EMENTA / PLANO DE ENSINO
          ========================================================================= */}
      {activeSubTab === "import_syllabus" && (
        <div className="space-y-6">
          <div className="bg-[#111111] p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <FileUp className="w-4 h-4 text-[#e2ff31]" />
                <span>Carregar Ementa / Plano de Ensino IFES</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">PDF / TXT / DOCX</span>
            </div>

            {/* Upload Dropzone */}
            <div className="border-2 border-dashed border-white/10 hover:border-[#e2ff31]/50 bg-[#161616]/60 rounded-2xl p-6 text-center transition group">
              <input
                type="file"
                id="syllabus-file-input"
                accept=".pdf,.txt,.md,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="syllabus-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-[#222] text-[#e2ff31] flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-[#e2ff31] transition">
                  {isProcessingSyllabus
                    ? "Processando plano de ensino..."
                    : "Selecionar Arquivo da Ementa IFES"}
                </span>
                <span className="text-[11px] text-neutral-400">
                  O analisador criará a disciplina completa com tarefas, fóruns e lista de participantes
                </span>
              </label>
            </div>

            {/* Collapsible Manual Text Paste */}
            <div className="space-y-3">
              <button
                onClick={() => setShowPasteArea(!showPasteArea)}
                className="text-xs text-[#e2ff31] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showPasteArea ? "Ocultar texto colado" : "Ou colar texto da ementa / disciplina"}</span>
              </button>

              {showPasteArea && (
                <div className="space-y-3 p-4 bg-[#161616] rounded-2xl border border-white/10 animate-fadeIn">
                  <input
                    type="text"
                    value={syllabusSubjectName}
                    onChange={(e) => setSyllabusSubjectName(e.target.value)}
                    placeholder="Nome da Disciplina (Ex: Sistemas Distribuídos e Cloud)"
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#e2ff31]"
                  />
                  <textarea
                    rows={4}
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    placeholder="Cole aqui o conteúdo programático, ementa ou tópicos da disciplina..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#e2ff31] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => processSyllabus(syllabusText)}
                      disabled={!syllabusText.trim() || isProcessingSyllabus}
                      className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-bold px-5 py-2 rounded-full uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Processar e Criar Disciplina</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Subject Quick Add Bar */}
          <form
            onSubmit={handleAddManualSubject}
            className="p-5 bg-[#161616] rounded-2xl border border-white/10 flex flex-wrap items-center gap-3 shadow-md"
          >
            <span className="text-xs text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#e2ff31]" /> Cadastrar Matéria Manualmente:
            </span>
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Nome da Matéria (Ex: Inteligência Artificial)"
              className="flex-1 min-w-[200px] bg-[#111] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e2ff31]"
            />
            <input
              type="text"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              placeholder="Código (Ex: IFES-IA101)"
              className="w-36 bg-[#111] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#e2ff31] font-mono"
            />
            <button
              type="submit"
              disabled={!newSubjectName.trim()}
              className="bg-[#e2ff31] hover:bg-[#d4f222] disabled:bg-neutral-800 disabled:text-neutral-500 text-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* QR Code Reader Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-[2rem] p-6 max-w-md w-full space-y-4 relative text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#e2ff31]" />
                <h4 className="font-bold text-sm">Leitor QR Code / Crachá IFES</h4>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Aponte a câmera para o QR Code da sua carteirinha estudantil IFES ou QR Code da sua turma no AVA.
            </p>

            <div id="qr-reader-container" className="rounded-xl overflow-hidden bg-black min-h-[260px]" />

            <div className="pt-2 border-t border-white/10 text-center">
              <label
                htmlFor="qr-input-file"
                onClick={() => setShowQrModal(false)}
                className="text-xs text-[#e2ff31] hover:underline cursor-pointer font-semibold flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ou selecione um arquivo de imagem do seu dispositivo</span>
              </label>
            </div>

            {qrScanResult && (
              <div className="p-3 bg-[#111] rounded-xl border border-[#e2ff31]/40 text-xs space-y-1">
                <span className="text-[#e2ff31] font-bold">Conteúdo Reconhecido:</span>
                <p className="font-mono text-neutral-300 break-all">{qrScanResult}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Fechar Leitor
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
