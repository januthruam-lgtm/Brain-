import { SubjectItem, TrackModule } from "../types";

/**
 * Intelligent syllabus / ementa parser for IFES subjects.
 * Parses raw text or structured curriculum into subjects and sequential modules.
 */
export function parseSyllabusText(rawText: string, fallbackSubjectName?: string): SubjectItem[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [];
  }

  // Detect subject names and units/topics
  const subjects: SubjectItem[] = [];
  let currentSubjectName = fallbackSubjectName || "Disciplina IFES";
  let currentModules: TrackModule[] = [];
  let globalModuleCounter = 1;

  // Search for lines that look like subjects or course titles
  const subjectHeaders = lines.filter(
    (l) =>
      l.toLowerCase().includes("disciplina:") ||
      l.toLowerCase().includes("matéria:") ||
      l.toLowerCase().includes("curso:") ||
      l.toLowerCase().includes("ementa:") ||
      l.toLowerCase().startsWith("1.") ||
      l.toLowerCase().startsWith("2.") ||
      l.toLowerCase().startsWith("3.") ||
      l.toLowerCase().startsWith("módulo") ||
      l.toLowerCase().startsWith("unidade")
  );

  // If simple text with bullet points
  const topicLines = lines.filter(
    (l) =>
      l.length > 5 &&
      !l.toLowerCase().includes("plano de ensino") &&
      !l.toLowerCase().includes("instituto federal")
  );

  // Group topics into 3-5 modular steps per detected discipline
  const chunks: string[][] = [];
  const chunkSize = Math.max(2, Math.ceil(topicLines.length / 4));
  for (let i = 0; i < topicLines.length; i += chunkSize) {
    chunks.push(topicLines.slice(i, i + chunkSize));
  }

  const subjectTitle = fallbackSubjectName || (lines[0].length < 60 ? lines[0] : "Estruturas e Algoritmos IFES");
  const subjectId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  chunks.slice(0, 5).forEach((chunk, index) => {
    const modId = globalModuleCounter++;
    const mainTopic = chunk[0] || `Conceito ${index + 1}`;
    const subTopics = chunk.slice(1);

    currentModules.push({
      id: modId,
      subjectId: subjectId,
      subjectName: subjectTitle,
      title: `Módulo ${modId}: ${mainTopic.replace(/^[-*•\d.]+\s*/, "")}`,
      subtitle: subTopics.length > 0 ? subTopics[0].replace(/^[-*•\d.]+\s*/, "") : "Fundamentos e Aplicação Prática",
      category: subjectTitle,
      status: modId === 1 ? "active" : "locked",
      xpReward: 100 + index * 20,
      estimatedMinutes: 15 + index * 5,
      summary: `Estudo focado da ementa do IFES sobre ${mainTopic}.`,
      keyConcepts: [mainTopic, ...subTopics].slice(0, 4),
      lessons: [
        {
          id: `l${modId}-1`,
          title: `Introdução a ${mainTopic.replace(/^[-*•\d.]+\s*/, "")}`,
          conceptText: `Conforme a ementa curricular do IFES, este módulo aprofunda ${mainTopic}. É essencial dominar a teoria e a resolução de exercícios aplicados.`,
          socraticPrompt: `Como o conceito de "${mainTopic}" se relaciona com os desafios práticos da sua formação técnica/superior no IFES?`,
          quizQuestion: {
            question: `Qual a principal aplicação prática de "${mainTopic.replace(/^[-*•\d.]+\s*/, "")}" no contexto desta matéria?`,
            options: [
              `Otimizar a compreensão teórica e modelagem de problemas em ${subjectTitle}`,
              "Apenas memorização de datas sem impacto prático",
              "Não possui relação com o restante do curso",
              "Substitui completamente todas as outras disciplinas",
            ],
            correctIndex: 0,
            explanation: `O domínio de ${mainTopic} é pilar estrutural para o avanço nos conteúdos subsequentes da disciplina.`,
          },
        },
      ],
    });
  });

  const totalTasks = currentModules.length;
  const completedTasks = 0;

  // Generate realistic initial activities and participants for the parsed course
  const defaultActivities = [
    {
      id: `act_${subjectId}_1`,
      title: `Trabalho Prático 1: Implementação e Aplicação de ${chunks[0]?.[0] || "Conceitos Básicos"}`,
      description: `Desenvolva e entregue a solução computacional referente aos conceitos de ${chunks[0]?.[0] || subjectTitle}. Inclua código-fonte documentado e relatório em PDF.`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxGrade: 10.0,
      grade: null,
      weight: 35,
      status: "pending" as const,
      unitName: "Unidade 1",
      xpReward: 80,
      coinsReward: 40,
    },
    {
      id: `act_${subjectId}_2`,
      title: `Lista de Exercícios Teóricos: ${chunks[1]?.[0] || "Aprofundamento"}`,
      description: `Responda formalmente as questões da lista de estudos para fixação do conteúdo abordado na ementa.`,
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxGrade: 10.0,
      grade: null,
      weight: 25,
      status: "pending" as const,
      unitName: "Unidade 2",
      xpReward: 70,
      coinsReward: 35,
    },
  ];

  const defaultParticipants = [
    {
      id: `part_prof_${subjectId}`,
      name: "Prof. Responsável IFES",
      email: "docente@ifes.edu.br",
      role: "professor" as const,
      enrollment: "1928301",
      campus: "IFES",
      lastAccess: "Online agora",
      isOnline: true,
      bio: `Docente titular responsável pela disciplina de ${subjectTitle}.`,
    },
    {
      id: `part_tutor_${subjectId}`,
      name: "Monitor Acadêmico",
      email: "monitoria@aluno.ifes.edu.br",
      role: "tutor" as const,
      enrollment: "20231IFES0199",
      campus: "IFES",
      lastAccess: "Hoje às 10:00",
      isOnline: true,
      bio: "Monitor da disciplina disponível para auxílio em atividades e dúvidas no fórum.",
    },
    {
      id: `part_colleague_1_${subjectId}`,
      name: "Lucas Silveira Rocha",
      email: "lucas.silveira@aluno.ifes.edu.br",
      role: "student" as const,
      enrollment: "20241IFES0122",
      campus: "IFES",
      lastAccess: "Há 40 minutos",
      isOnline: false,
    },
    {
      id: `part_colleague_2_${subjectId}`,
      name: "Mariana Costa Vianna",
      email: "mariana.costa@aluno.ifes.edu.br",
      role: "student" as const,
      enrollment: "20241IFES0341",
      campus: "IFES",
      lastAccess: "Hoje cedo",
      isOnline: false,
    },
  ];

  subjects.push({
    id: subjectId,
    name: subjectTitle,
    code: `IFES-${Math.floor(100 + Math.random() * 900)}`,
    teacher: "Prof. Responsável IFES",
    teacherEmail: "docente@ifes.edu.br",
    campus: "IFES",
    semester: "2026/2",
    syllabusSummary: rawText.substring(0, 280) + (rawText.length > 280 ? "..." : ""),
    totalTasks: totalTasks,
    completedTasks: completedTasks,
    progressPercentage: 0, // Strict mathematical: (completedTasks / totalTasks) * 100
    modules: currentModules,
    activities: defaultActivities,
    participants: defaultParticipants,
    materials: [
      {
        id: `mat_${subjectId}_1`,
        title: "Plano de Ensino e Ementa Oficial",
        type: "pdf",
        description: "Documento com o cronograma de aulas e critérios de avaliação.",
        unitName: "Avisos Gerais",
        dateAdded: new Date().toLocaleDateString("pt-BR"),
        fileSize: "350 KB",
      },
    ],
    forumTopics: [
      {
        id: `topic_${subjectId}_1`,
        title: "Boas-vindas à disciplina e orientações para entrega de atividades",
        authorName: "Prof. Responsável IFES",
        authorRole: "Professor",
        createdAt: "Hoje às 08:00",
        repliesCount: 1,
        lastReplyAt: "Hoje às 09:30",
        content: `Sejam bem-vindos à disciplina de ${subjectTitle}. Todas as atividades avaliativas deverão ser entregues com antecedência pelo AVA IFES. Bons estudos!`,
        pinned: true,
      },
    ],
    createdAt: new Date().toISOString(),
  });

  return subjects;
}

/**
 * Calculates strict mathematical progress
 */
export function calculateStrictProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks <= 0) return 0;
  const pct = (completedTasks / totalTasks) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10)); // 1 decimal place
}
