export type ThemeId = "paper_focus" | "default" | "ifes_green" | "cyberpunk" | "solar" | "emerald" | "sunset" | "midnight" | "custom";

export interface CustomThemeConfig {
  id: string;
  name: string;
  bgMain: string;
  bgCard: string;
  bgCardSecondary?: string;
  textPrimary: string;
  textSecondary: string;
  textMuted?: string;
  btnPrimary: string;
  btnPrimaryText: string;
  btnPrimaryHover?: string;
  colorSuccess: string;
  colorAccent: string;
  borderColor: string;
  borderSubtle?: string;
}

export interface PetData {
  id: string;
  name: string;
  title: string;
  customImageUrl?: string; // transparent PNG uploaded by user
  baseModel: "custom" | "capivara_ifes" | "coruja_sabia" | "dragao_solar" | "robo_socratico";
  level: number;
  currentXp: number;
  xpToNextLevel: number; // Exponential progression: 50 * (2 ** (level - 1))
  hungerLevel: number; // 0-100%
  happinessLevel: number; // 0-100%
  totalFedCount: number;
  evolutionStage: number; // 1, 2, 3, 4
  mood: "happy" | "studying" | "hungry" | "excited" | "sleepy";
  createdAt?: string;
}

export interface TaskItem {
  id: string | number;
  titulo: string;
  concluida: boolean;
}

export interface CourseActivity {
  id: string;
  title: string;
  description: string;
  dueDate: string; // e.g. "2026-09-28T23:59" or "28/09/2026, 23:59"
  maxGrade: number; // e.g. 10.0
  grade?: number | null; // e.g. 9.5
  weight?: number; // e.g. 20 (percent)
  status: "pending" | "submitted" | "graded";
  submittedAt?: string | null;
  submissionText?: string;
  submissionFiles?: {
    name: string;
    size: string;
    type: string;
    submittedAt: string;
  }[];
  teacherFeedback?: string;
  unitName?: string;
  xpReward?: number;
  coinsReward?: number;
}

export interface CourseParticipant {
  id: string;
  name: string;
  email: string;
  role: "professor" | "tutor" | "student";
  enrollment: string;
  avatar?: string;
  campus?: string;
  lastAccess?: string;
  isOnline?: boolean;
  bio?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: "pdf" | "slide" | "link" | "video" | "code";
  description?: string;
  url?: string;
  unitName?: string;
  dateAdded?: string;
  fileSize?: string;
}

export interface CourseForumTopic {
  id: string;
  title: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  createdAt: string;
  repliesCount: number;
  lastReplyAt: string;
  content: string;
  pinned?: boolean;
}

export interface SubjectItem {
  id: string;
  name: string;
  cor?: string;
  tarefas?: TaskItem[];
  code?: string;
  teacher?: string;
  teacherEmail?: string;
  campus?: string;
  semester?: string;
  roomOrSchedule?: string;
  syllabusSummary?: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number; // Strictly: (completedTasks / totalTasks) * 100
  modules: TrackModule[];
  activities?: CourseActivity[];
  participants?: CourseParticipant[];
  materials?: CourseMaterial[];
  forumTopics?: CourseForumTopic[];
  createdAt?: string;
}

export interface SavedChat {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  messages: SocraticMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedDocument {
  id: string;
  subjectId: string;
  subjectName: string;
  fileName: string;
  summary: string;
  flashcardsCount: number;
  quizzesCount: number;
  rawTextPreview: string;
  createdAt: string;
}

export interface UserProfile {
  email: string;
  name: string;
  matricula?: string;
  enrollmentNumber?: string;
  avaLink?: string;
  institution?: string;
  xp: number;
  coins?: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  createdAt?: string;
  activeDates?: string[];
  activeTheme: ThemeId;
  customThemeConfig?: CustomThemeConfig;
  unlockedThemes: ThemeId[];
  equippedBadge: string;
  unlockedBadges: string[];
  completedModules: number[];
  selectedSubjects?: string[];
  subjects?: SubjectItem[];
  pet?: PetData;
  energy: number;
  maxEnergy: number;
  lastEnergyRechargeTime?: string;
  lastEnergyRequestTime?: string;
  guildId?: string;
  guildName?: string;
  guildTag?: string;
  guildCrest?: string;
  guildRole?: "Líder" | "Vice-Líder" | "Membro";
  stats: {
    socraticInteractions: number;
    quizzesAnswered: number;
    correctQuizzes: number;
    battlesWon: number;
    battlesTotal: number;
    flashcardsReviewed: number;
  };
  // App Acadêmico IFES Complete Edition Gamification & Guildas & Combos
  buffRU?: boolean;
  buffRUTimestamp?: number;
  bossHP?: number;
  enqueteRespondida?: boolean;
  cardsColecionados?: number[];
  materiasEstudadasHoje?: string[];
  guilda?: string;
  guildaXP?: number;
  passivas?: {
    regen?: boolean;
    bonusXp?: boolean;
  };
  missoes?: DailyMission[];
}

export interface GachaCard {
  id: number;
  nome: string;
  raridade: "comum" | "raro" | "epico" | "lendario";
  emoji: string;
}

export interface DailyMission {
  id: string;
  desc: string;
  meta: number;
  progresso: number;
  premio: number;
  concluida: boolean;
}

export interface SocraticMessage {
  id: string;
  role: "lumina" | "user" | "system";
  text: string;
  timestamp: string;
  topic?: string;
  subjectName?: string;
}

export interface LessonStep {
  id: string;
  title: string;
  conceptText: string;
  socraticPrompt: string;
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface TrackModule {
  id: number;
  subjectId?: string;
  subjectName?: string;
  title: string;
  subtitle: string;
  category: string;
  status: "completed" | "active" | "locked";
  xpReward: number;
  estimatedMinutes: number;
  summary: string;
  keyConcepts: string[];
  lessons: LessonStep[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export interface AnswerVerificationResult {
  isCorrect: boolean;
  score: number;
  verdict: "Correta" | "Parcialmente Correta" | "Incorreta";
  feedback: string;
  detailedExplanation: string;
  keyStrengths: string[];
  pointsToImprove: string[];
  xpEarned: number;
}

export interface StoreItem {
  id: string;
  name: string;
  type: "theme" | "badge" | "boost" | "energy" | "pet_food" | "permanent_energy";
  themeId?: ThemeId;
  badgeId?: string;
  energyAmount?: number;
  permanentMaxEnergy?: number;
  petXpAmount?: number;
  petHappinessAmount?: number;
  cost: number;
  description: string;
  icon: string;
  badgeEmoji?: string;
  badgeClass?: string;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number;
}

export interface GuildMember {
  email: string;
  name: string;
  role: "Líder" | "Vice-Líder" | "Membro" | "Sistema";
  xp: number;
  doacoes?: number;
  joinedAt: string;
}

export interface GuildMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole?: "Líder" | "Vice-Líder" | "Membro" | "Sistema";
  text: string;
  timestamp: string;
  badge?: string;
}

export interface EnergyDonor {
  donorEmail: string;
  donorName: string;
  amount: number;
  timestamp: string;
}

export interface EnergyRequest {
  id: string;
  guildId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  requestedAmount: number;
  receivedAmount: number;
  donors: EnergyDonor[];
  status: "active" | "completed";
  createdAt: string;
  expiresAt: string;
}

export interface GuildChestMilestones {
  metas: [number, number, number]; // [100, 250, 500]
  resgates: {
    nivel1: boolean;
    nivel2: boolean;
    nivel3: boolean;
  };
}

export interface GuildInfo {
  id: string;
  name: string;
  tag: string;
  rank: number;
  totalXp: number;
  membersCount: number;
  description: string;
  crest: string;
  isUserGuild?: boolean;
  leaderEmail?: string;
  leaderName?: string;
  category?: string;
  motto?: string;
  bannerColor?: string;
  createdAt?: string;
  members?: GuildMember[];
  messages?: GuildMessage[];
  energyRequests?: EnergyRequest[];
  bauXp?: number;
  bauNivelAtual?: number;
  metasBau?: number[];
  resgatesBau?: {
    nivel1: boolean;
    nivel2: boolean;
    nivel3: boolean;
  };
}

