import { TrackModule } from "../types";

export interface CuratedTrack {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  targetGoal: string;
  subjects: string[];
  color: string;
}

export const CURATED_APP_TRACKS: CuratedTrack[] = [
  {
    id: "enem_vestibulares",
    name: "Trilha ENEM & Grandes Vestibulares",
    badge: "Mais Popular",
    icon: "🎯",
    description: "Currículo completo com todas as 8 matérias essenciais cobradas no ENEM, FUVEST e vestibulares nacionais.",
    targetGoal: "Preparação para ENEM & Provas",
    subjects: [
      "Matemática & Raciocínio",
      "Língua Portuguesa & Redação",
      "Biologia & Genética",
      "Física & Mecânica",
      "Química & Matéria",
      "História Geral & Brasil",
      "Geografia & Geopolítica",
      "Filosofia & Sociologia",
    ],
    color: "from-amber-500/20 to-yellow-500/5",
  },
  {
    id: "tech_ai_dev",
    name: "Trilha Tech, IA & Engenharia de Software",
    badge: "Alta Demanda",
    icon: "💻",
    description: "Formação integral em raciocínio algorítmico, lógica estruturada, computação moderna e inteligência artificial.",
    targetGoal: "Reforço e Entendimento Profundo",
    subjects: [
      "Programação & Computação",
      "Lógica de Algoritmos & Estruturas de Dados",
      "Inteligência Artificial & Prompts",
      "Matemática Discreta & Lógica",
      "Redes & Segurança Digital",
    ],
    color: "from-sky-500/20 to-blue-500/5",
  },
  {
    id: "concursos_direito",
    name: "Trilha Carreiras Jurídicas & Concursos Públicos",
    badge: "Foco Total",
    icon: "⚖️",
    description: "Disciplinas mais cobradas em concursos federais, estaduais e tribunais (TJ, TRT, PF, PRF e Receita).",
    targetGoal: "Concursos e Alta Performance",
    subjects: [
      "Direito Constitucional & Legislação",
      "Direito Administrativo & Atos",
      "Língua Portuguesa & Interpretação",
      "Raciocínio Lógico Matemático",
      "Ética no Serviço Público",
    ],
    color: "from-purple-500/20 to-indigo-500/5",
  },
  {
    id: "medicina_saude",
    name: "Trilha Medicina & Ciências da Saúde",
    badge: "Avançado",
    icon: "🏥",
    description: "Base científica aprofundada para cursos de Medicina, Enfermagem, Biomedicina e Farmácia.",
    targetGoal: "Reforço e Entendimento Profundo",
    subjects: [
      "Medicina & Anatomia Humana",
      "Biologia Celular & Genética",
      "Fisiologia dos Sistemas",
      "Bioquímica & Metabolismo",
      "Química Orgânica & Farmacologia",
    ],
    color: "from-emerald-500/20 to-teal-500/5",
  },
  {
    id: "exatas_engenharia",
    name: "Trilha Exatas, Engenharia & Finanças",
    badge: "Raciocínio Puro",
    icon: "📐",
    description: "Cálculo, física fundamental, álgebra vetorial e raciocínio analítico para engenharias e mercado financeiro.",
    targetGoal: "Reforço e Entendimento Profundo",
    subjects: [
      "Matemática & Raciocínio",
      "Física & Mecânica",
      "Cálculo Diferencial & Integral",
      "Estatística & Probabilidade",
      "Economia & Educação Financeira",
    ],
    color: "from-orange-500/20 to-amber-500/5",
  },
  {
    id: "humanas_pensamento",
    name: "Trilha Humanidades, Sociedade & Comunicação",
    badge: "Crítica & Síntese",
    icon: "🏛️",
    description: "Desenvolvimento do pensamento crítico, análise geopolítica, história das civilizações e oratória reflexiva.",
    targetGoal: "Reforço e Entendimento Profundo",
    subjects: [
      "História Geral & Brasil",
      "Filosofia & Sociologia",
      "Geografia & Geopolítica",
      "Língua Portuguesa & Redação",
      "Inglês & Idiomas Globais",
    ],
    color: "from-rose-500/20 to-pink-500/5",
  },
];

export const PRESET_SUBJECTS = [
  // Exatas
  { id: "matematica", name: "Matemática & Raciocínio", icon: "📐", category: "Exatas", description: "Álgebra, geometria, equações e raciocínio quantitativo." },
  { id: "fisica", name: "Física & Mecânica", icon: "⚡", category: "Exatas", description: "Cinemática, Leis de Newton, energia e termodinâmica." },
  { id: "quimica", name: "Química & Matéria", icon: "🧪", category: "Exatas", description: "Estrutura atômica, ligações químicas e reações." },
  { id: "calculo", name: "Cálculo Diferencial & Integral", icon: "📈", category: "Exatas", description: "Limites, derivadas, integrais e modelagem contínua." },
  { id: "estatistica", name: "Estatística & Probabilidade", icon: "📊", category: "Exatas", description: "Análise de dados, distribuições e inferência estatística." },

  // Biológicas & Saúde
  { id: "biologia", name: "Biologia & Genética", icon: "🧬", category: "Biológicas", description: "Citologia, DNA, evolução e ecossistemas." },
  { id: "medicina", name: "Medicina & Anatomia Humana", icon: "🏥", category: "Saúde", description: "Sistemas do corpo humano, histologia e fisiologia." },
  { id: "bioquimica", name: "Bioquímica & Metabolismo", icon: "🔬", category: "Saúde", description: "Proteínas, enzimas, ciclo de Krebs e biomoléculas." },

  // Humanas & Sociais
  { id: "historia", name: "História Geral & Brasil", icon: "🏛️", category: "Humanas", description: "Civilizações, Idade Moderna, Brasil Império e República." },
  { id: "geografia", name: "Geografia & Geopolítica", icon: "🌍", category: "Humanas", description: "Espaço geográfico, clima, urbanização e relações globais." },
  { id: "filosofia", name: "Filosofia & Sociologia", icon: "💡", category: "Humanas", description: "Ética, epistemologia, teoria social e direitos humanos." },

  // Linguagens & Comunicação
  { id: "portugues", name: "Língua Portuguesa & Redação", icon: "✍️", category: "Linguagens", description: "Gramática normativa, interpretação e redação nota 1000." },
  { id: "ingles", name: "Inglês & Idiomas Globais", icon: "🌐", category: "Linguagens", description: "Gramática, vocabulário instrumental e conversação." },

  // Tecnologia & TI
  { id: "programacao", name: "Programação & Computação", icon: "💻", category: "Tecnologia", description: "Lógica de programação, algoritmos, loops e funções." },
  { id: "ia_prompts", name: "Inteligência Artificial & Prompts", icon: "🤖", category: "Tecnologia", description: "Modelos generativos, machine learning e automação." },

  // Carreiras & Concursos
  { id: "direito_const", name: "Direito Constitucional & Legislação", icon: "⚖️", category: "Direito", description: "Direitos fundamentais, organização do Estado e leis." },
  { id: "direito_adm", name: "Direito Administrativo & Atos", icon: "📜", category: "Direito", description: "Regime jurídico, licitações, servidores e poderes." },
  { id: "enem_concursos", name: "Raciocínio Lógico para Concursos", icon: "📋", category: "Concursos", description: "Proposições, tabelas-verdade, silogismos e lógica formal." },
];

/**
 * Knowledge base templates for instant local module generation when offline or fallback.
 */
const SUBJECT_KNOWLEDGE_BASE: Record<string, { title: string; subtitle: string; category: string; summary: string; keyConcepts: string[]; lessons: any[] }[]> = {
  matematica: [
    {
      title: "Fundamentos de Álgebra e Equações",
      subtitle: "Estruturação de equações de 1º e 2º grau e funções lineares.",
      category: "Álgebra",
      summary: "Aprenda a modelar problemas reais através de variáveis, incógnitas e relações funcionais.",
      keyConcepts: ["Incógnita e Variável", "Fórmula de Bhaskara", "Gráficos de Funções"],
      lessons: [
        {
          id: "mat-1",
          title: "Modelagem Algébrica e Equações de 1º Grau",
          conceptText: "Uma equação linear expressa o equilíbrio entre duas grandezas. Ao isolar a incógnita x, mantemos a equivalência aplicando as mesmas operações algébricas em ambos os lados.",
          socraticPrompt: "Se o dobro de um número somado a 15 resulta em 45, qual raciocínio lógico você utiliza para encontrar o valor original?",
          quizQuestion: {
            question: "Resolva a equação: 3x - 12 = 18. Qual o valor de x?",
            options: ["x = 6", "x = 8", "x = 10", "x = 12"],
            correctIndex: 2,
            explanation: "3x = 18 + 12 => 3x = 30 => x = 10.",
          },
        },
        {
          id: "mat-2",
          title: "Funções Afim e Interpretação Gráfica",
          conceptText: "A função afim f(x) = ax + b representa retas no plano cartesiano, onde 'a' define a taxa de variação (coeficiente angular) e 'b' o ponto de interceptação vertical.",
          socraticPrompt: "Em um plano de dados onde você paga uma taxa fixa mais um valor por gigabyte, como o coeficiente angular afeta sua conta final?",
          quizQuestion: {
            question: "Na função f(x) = -4x + 20, a reta é:",
            options: ["Crescente e corta o eixo Y em 20", "Decrescente e corta o eixo Y em 20", "Constante", "Paralela ao eixo X"],
            correctIndex: 1,
            explanation: "Como a = -4 (negativo), a função é estritamente decrescente, e b = 20 é o intercepto Y.",
          },
        },
      ],
    },
    {
      title: "Geometria e Trigonometria Essencial",
      subtitle: "Teorema de Pitágoras, razões trigonométricas e áreas planas.",
      category: "Geometria",
      summary: "Compreensão espacial das relações métricas fundamentais no triângulo retângulo e polígonos regulares.",
      keyConcepts: ["Pitágoras", "Seno, Cosseno e Tangente", "Áreas e Perímetros"],
      lessons: [
        {
          id: "mat-3",
          title: "Relações Métricas no Triângulo Retângulo",
          conceptText: "O Teorema de Pitágoras estabelece que a soma dos quadrados dos catetos é sempre igual ao quadrado da hipotenusa (a² + b² = c²).",
          socraticPrompt: "Se você precisa apoiar uma escada de 5 metros contra uma parede e a base está a 3 metros da parede, a que altura ela alcança?",
          quizQuestion: {
            question: "Em um triângulo retângulo com catetos de 6 cm e 8 cm, a hipotenusa mede:",
            options: ["10 cm", "12 cm", "14 cm", "16 cm"],
            correctIndex: 0,
            explanation: "6² + 8² = 36 + 64 = 100. Raiz quadrada de 100 = 10 cm.",
          },
        },
      ],
    },
  ],
  fisica: [
    {
      title: "Cinemática e Leis de Newton",
      subtitle: "Movimento retilíneo, inércia, dinâmica de forças e gravitação.",
      category: "Mecânica",
      summary: "Entenda os princípios de Galileu e Newton que regem a aceleração, a inércia e o equilíbrio dos corpos.",
      keyConcepts: ["Primeira Lei (Inércia)", "Segunda Lei (F=m.a)", "Ação e Reação"],
      lessons: [
        {
          id: "fis-1",
          title: "Primeira e Segunda Leis do Movimento",
          conceptText: "Um corpo em repouso permanece em repouso e um corpo em movimento retilíneo uniforme permanece em movimento a menos que uma força resultante atue sobre ele.",
          socraticPrompt: "Por que você é projetado para frente quando o ônibus freia bruscamente?",
          quizQuestion: {
            question: "Se uma força resultante de 20 N é aplicada a um corpo de massa 4 kg, qual a aceleração produzida?",
            options: ["2 m/s²", "5 m/s²", "10 m/s²", "80 m/s²"],
            correctIndex: 1,
            explanation: "F = m * a => a = F / m = 20 N / 4 kg = 5 m/s².",
          },
        },
      ],
    },
    {
      title: "Trabalho, Energia e Conservação",
      subtitle: "Energia cinética, energia potencial gravitacional e sistemas mecânicos.",
      category: "Termodinâmica & Energia",
      summary: "O princípio supremo da física: a energia não pode ser criada nem destruída, apenas transformada.",
      keyConcepts: ["Energia Cinética", "Energia Potencial", "Conservação Mecânica"],
      lessons: [
        {
          id: "fis-2",
          title: "Transformação de Energia Mecânica",
          conceptText: "Em uma montanha-russa ideal (sem atrito), a energia potencial do ponto mais alto converte-se integralmente em energia cinética no ponto mais baixo.",
          socraticPrompt: "Como a altura inicial de uma queda d'água determina a capacidade de geração elétrica em uma usina hidrelétrica?",
          quizQuestion: {
            question: "Quando um objeto é solto do repouso no vácuo, sua energia potencial diminui enquanto sua:",
            options: ["Massa aumenta", "Energia cinética aumenta", "Velocidade diminui", "Aceleração zera"],
            correctIndex: 1,
            explanation: "A energia potencial gravitacional perdida é convertida diretamente em energia cinética.",
          },
        },
      ],
    },
  ],
  quimica: [
    {
      title: "Estrutura Atômica e Tabela Periódica",
      subtitle: "Modelos atômicos, distribuição eletrônica e propriedades periódicas.",
      category: "Química Geral",
      summary: "Compreenda como os elétrons na camada de valência determinam a reatividade e as ligações químicas.",
      keyConcepts: ["Prótons, Nêutrons e Elétrons", "Eletronegatividade", "Camada de Valência"],
      lessons: [
        {
          id: "qui-1",
          title: "Ligações Químicas: Iônica vs Covalente",
          conceptText: "Ligações iônicas ocorrem por transferência de elétrons entre metais e ametais. Ligações covalentes ocorrem por compartilhamento de pares eletrônicos.",
          socraticPrompt: "Por que a molécula de água (H2O) é líquida à temperatura ambiente enquanto o CO2 é um gás, mesmo ambos tendo ligações covalentes?",
          quizQuestion: {
            question: "Qual ligação é caracterizada pelo compartilhamento de pares de elétrons?",
            options: ["Ligação Iônica", "Ligação Covalente", "Ligação Metálica", "Força de London"],
            correctIndex: 1,
            explanation: "Na ligação covalente, os átomos compartilham elétrons para atingir a estabilidade eletrônica.",
          },
        },
      ],
    },
  ],
  biologia: [
    {
      title: "Citologia e Metabolismo Energético",
      subtitle: "Organelas celulares, respiração celular, fotossíntese e síntese proteica.",
      category: "Biologia Celular",
      summary: "Descubra como as células geram energia (ATP) e expressam suas instruções genéticas.",
      keyConcepts: ["Mitocôndria e ATP", "DNA e RNA", "Membrana Plasmática"],
      lessons: [
        {
          id: "bio-1",
          title: "Respiração Celular e Fosforilação Oxidativa",
          conceptText: "A quebra da molécula de glicose no citoplasma e na mitocôndria gera ATP através da glicólise, ciclo de Krebs e cadeia respiratória.",
          socraticPrompt: "Qual o papel primordial do oxigênio na respiração celular aeróbia?",
          quizQuestion: {
            question: "Em qual organela celular ocorre a maior parte da produção de ATP aeróbio?",
            options: ["Lisossomo", "Complexo de Golgi", "Mitocôndria", "Retículo Endoplasmático"],
            correctIndex: 2,
            explanation: "A mitocôndria é a responsável pela respiração celular e produção de ATP.",
          },
        },
      ],
    },
  ],
  historia: [
    {
      title: "Idade Moderna, Iluminismo e Revoluções",
      subtitle: "O nascimento do pensamento científico, Revolução Francesa e Revolução Industrial.",
      category: "História Geral",
      summary: "Entenda a transição do absolutismo monárquico para as democracias constitucionais e o capitalismo industrial.",
      keyConcepts: ["Razão e Iluminismo", "Queda da Bastilha", "Transformação Fabril"],
      lessons: [
        {
          id: "his-1",
          title: "O Século das Luzes e a Crítica ao Absolutismo",
          conceptText: "Pensadores como Locke, Voltaire e Montesquieu defenderam os direitos naturais inalienáveis, a liberdade de expressão e a separação dos três poderes.",
          socraticPrompt: "Como a teoria dos três poderes de Montesquieu ainda protege a sociedade contra tiranias hoje?",
          quizQuestion: {
            question: "Qual filósofo iluminista é consagrado pela formulação da divisão dos poderes em Executivo, Legislativo e Judiciário?",
            options: ["Jean-Jacques Rousseau", "Montesquieu", "Thomas Hobbes", "René Descartes"],
            correctIndex: 1,
            explanation: "Montesquieu formulou em 'O Espírito das Leis' a teoria dos contrapesos e freios dos poderes.",
          },
        },
      ],
    },
  ],
  portugues: [
    {
      title: "Coesão, Coerência e Redação Dissertativa",
      subtitle: "Estrutura argumentativa, conectivos discursivos e norma culta.",
      category: "Gramática & Redação",
      summary: "Domine a construção de teses sólidas, argumentos consistentes e propostas de intervenção eficazes.",
      keyConcepts: ["Tese Argumentativa", "Conectivos Lógicos", "Intervenção Social"],
      lessons: [
        {
          id: "por-1",
          title: "A Estrutura do Texto Dissertativo-Argumentativo",
          conceptText: "Um texto dissertativo eficaz é composto por introdução com contextualização e tese explícita, parágrafos de desenvolvimento analíticos e conclusão com fechamento lógico.",
          socraticPrompt: "Qual a diferença entre expor fatos e argumentar sobre a causa dos fatos?",
          quizQuestion: {
            question: "Qual elemento NÃO pode faltar no parágrafo introdutório de uma redação nota 1000?",
            options: ["Proposta de intervenção detalhada", "Apresentação clara da tese", "Exemplo pessoal em 1ª pessoa", "Citação de poema"],
            correctIndex: 1,
            explanation: "A tese é o ponto de vista central que guiará todos os argumentos dos parágrafos seguintes.",
          },
        },
      ],
    },
  ],
  programacao: [
    {
      title: "Lógica de Programação e Estruturas de Dados",
      subtitle: "Algoritmos, variáveis, condicionais, loops e modularização.",
      category: "Ciência da Computação",
      summary: "Desenvolva o pensamento computacional para decompor problemas complexos em códigos elegantes e eficientes.",
      keyConcepts: ["Algoritmos", "Controle de Fluxo", "Funções e Escopo"],
      lessons: [
        {
          id: "prog-1",
          title: "Estruturas Condicionais e Repetições",
          conceptText: "Algoritmos tomam decisões através de condições booleanas (if/else) e automatizam tarefas iterativas com loops (for/while).",
          socraticPrompt: "Como evitar que um laço de repetição entre em loop infinito ao processar dados dinâmicos?",
          quizQuestion: {
            question: "Qual estrutura é ideal quando sabemos exatamente quantas vezes o bloco de código deve ser executado?",
            options: ["Switch / Case", "Loop For", "Try / Catch", "Variável booleana"],
            correctIndex: 1,
            explanation: "O loop 'for' é projetado para iterações contadas e previsíveis com incremento definido.",
          },
        },
      ],
    },
  ],
};

/**
 * Generates custom TrackModules based on an array of subject names.
 */
export async function generateTrackForSubjects(
  subjects: string[],
  educationGoal?: string
): Promise<TrackModule[]> {
  if (!subjects || subjects.length === 0) {
    subjects = ["Matemática & Raciocínio", "Biologia & Genética", "Física & Mecânica"];
  }

  // 1. Try server AI generation via Gemini
  try {
    const res = await fetch("/api/subjects/generate-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjects,
        goal: educationGoal || "Aprender conceitos fundamentais e avançados com método socrático",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.modules) && data.modules.length > 0) {
        return formatModules(data.modules);
      }
    }
  } catch (err) {
    console.warn("Server generation fallback to intelligent local synthesis:", err);
  }

  // 2. Local intelligent synthesis based on selected subjects
  const builtModules: TrackModule[] = [];
  let moduleId = 1;

  for (const sub of subjects) {
    const normalized = sub.toLowerCase();
    let matchedKey = Object.keys(SUBJECT_KNOWLEDGE_BASE).find((k) =>
      normalized.includes(k) || k.includes(normalized)
    );

    if (matchedKey && SUBJECT_KNOWLEDGE_BASE[matchedKey]) {
      for (const item of SUBJECT_KNOWLEDGE_BASE[matchedKey]) {
        builtModules.push({
          id: moduleId,
          title: `Módulo ${moduleId}: ${item.title}`,
          subtitle: item.subtitle,
          category: sub,
          status: moduleId === 1 ? "active" : "locked",
          xpReward: 100 + moduleId * 25,
          estimatedMinutes: 15,
          summary: item.summary,
          keyConcepts: item.keyConcepts,
          lessons: item.lessons.map((les, idx) => ({
            ...les,
            id: `mod-${moduleId}-les-${idx + 1}`,
          })),
        });
        moduleId++;
      }
    } else {
      // Dynamic synthesis for custom typed subjects (e.g. "Direito Constitucional", "Anatomia", etc.)
      const cleanSub = sub.trim();
      builtModules.push({
        id: moduleId,
        title: `Módulo ${moduleId}: Fundamentos de ${cleanSub}`,
        subtitle: `Conceitos essenciais, definições e aplicações práticas em ${cleanSub}.`,
        category: cleanSub,
        status: moduleId === 1 ? "active" : "locked",
        xpReward: 125,
        estimatedMinutes: 20,
        summary: `Explore as bases teóricas, terminologias chave e problemas centrais estudados em ${cleanSub}.`,
        keyConcepts: [
          `Princípios Centrais de ${cleanSub}`,
          "Relações de Causa e Efeito",
          "Aplicações Práticas",
        ],
        lessons: [
          {
            id: `custom-${moduleId}-1`,
            title: `Introdução e Princípios de ${cleanSub}`,
            conceptText: `O estudo de ${cleanSub} exige a compreensão dos seus axiomas fundamentais, vocabulário especializado e métodos de análise crítica estruturada.`,
            socraticPrompt: `Qual é o principal desafio ou pergunta que a área de ${cleanSub} busca responder para a sociedade?`,
            quizQuestion: {
              question: `Qual a melhor abordagem ao iniciar o estudo estruturado de ${cleanSub}?`,
              options: [
                "Decorar termos sem entender o contexto",
                "Compreender os princípios centrais e testar a aplicação em problemas reais",
                "Pular os fundamentos e ir direto para exceções raras",
                "Ignorar conexões com outras áreas do conhecimento",
              ],
              correctIndex: 1,
              explanation: "O domínio cognitivo sólido constrói-se a partir dos fundamentos essenciais e da aplicação ativa do raciocínio.",
            },
          },
          {
            id: `custom-${moduleId}-2`,
            title: `Aprofundamento e Resolução em ${cleanSub}`,
            conceptText: `A consolidação de ${cleanSub} requer sintetizar múltiplos conceitos e formular hipóteses rigorosas para resolução de cenários práticos.`,
            socraticPrompt: `Como você explicaria o conceito central de ${cleanSub} para alguém sem conhecimento prévio no assunto?`,
            quizQuestion: {
              question: `Como validar se uma hipótese em ${cleanSub} é consistente?`,
              options: [
                "Apenas por intuição",
                "Confrontando com evidências, lógica formal e regras da disciplina",
                "Perguntando em fóruns anônimos",
                "Aceitando a primeira impressão sem questionar",
              ],
              correctIndex: 1,
              explanation: "A validação científica e acadêmica baseia-se na confrontação rigorosa com a lógica e as evidências.",
            },
          },
        ],
      });
      moduleId++;
    }
  }

  return formatModules(builtModules);
}

function formatModules(mods: any[]): TrackModule[] {
  return mods.map((m, idx) => {
    const rawTitle = m.title || `Estudo de ${m.category || `Tópico ${idx + 1}`}`;
    return {
      id: idx + 1,
      title: rawTitle.startsWith("Módulo") ? rawTitle : `Módulo ${idx + 1}: ${rawTitle}`,
      subtitle: m.subtitle || `Trilha de estudo focada em ${m.category || "conhecimento"}.`,
      category: m.category || "Geral",
      status: idx === 0 ? "active" : "locked",
      xpReward: m.xpReward || 100,
      estimatedMinutes: m.estimatedMinutes || 15,
      summary: m.summary || "Módulo completo de estudo.",
      keyConcepts: m.keyConcepts || ["Conceito 1", "Conceito 2"],
      lessons: Array.isArray(m.lessons) && m.lessons.length > 0 ? m.lessons : [],
    };
  });
}
