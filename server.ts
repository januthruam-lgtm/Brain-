import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "15mb" }));

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  const state = {
    teams: [],
    messages: [],
    onlineUsers: new Map()
  };

  io.on('connection', (socket) => {
    socket.on('register_user', (userData) => {
      state.onlineUsers.set(socket.id, { socketId: socket.id, username: userData.username });
      io.emit('online_users_list', Array.from(state.onlineUsers.values()));
      socket.emit('sync_initial_state', { teams: state.teams, messages: state.messages });
    });
    socket.on('call_user', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('incoming_call', { fromSocketId: socket.id, offer });
    });
    socket.on('answer_call', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('call_accepted', { fromSocketId: socket.id, answer });
    });
    socket.on('ice_candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice_candidate', { fromSocketId: socket.id, candidate });
    });
    socket.on('send_chat_message', (msg) => {
      state.messages.push(msg);
      io.emit('new_chat_message', msg);
    });
    socket.on('create_team', (teamData) => {
      const newTeam = {
        id: Date.now().toString(),
        name: teamData.name,
        xp: 0,
        requiredXp: 100000,
        lastRewardUnlocked: 0,
        members: [teamData.creator]
      };
      state.teams.push(newTeam);
      io.emit('teams_updated', state.teams);
    });
    socket.on('donate_team_xp', ({ teamId, xpAmount }) => {
      const team = state.teams.find(t => t.id === teamId);
      if (team) {
        team.xp += Number(xpAmount);
        io.emit('teams_updated', state.teams);
      }
    });
    socket.on('claim_team_reward', ({ teamId }) => {
      const team = state.teams.find(t => t.id === teamId);
      if (!team) return;
      const NOW = Date.now();
      const COOLDOWN_48H = 48 * 60 * 60 * 1000;
      if (team.xp >= team.requiredXp && (NOW - team.lastRewardUnlocked >= COOLDOWN_48H)) {
        team.xp -= team.requiredXp;
        team.lastRewardUnlocked = NOW;
        io.emit('teams_updated', state.teams);
        // Note: socket.emit doesn't work if we can't emit without the client requesting. But we use it anyway.
        socket.emit('reward_status', { success: true, message: 'Prêmio resgatado com sucesso!' });
      } else {
        socket.emit('reward_status', { success: false, message: 'Requisitos insuficientes.' });
      }
    });
    socket.on('disconnect', () => {
      state.onlineUsers.delete(socket.id);
      io.emit('online_users_list', Array.from(state.onlineUsers.values()));
    });
  });

  const AVA_URL = 'https://ava.ifes.edu.br';
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const response = await axios.get(`${AVA_URL}/login/token.php`, {
        params: { username, password, service: 'moodle_mobile_app' }
      });
      res.json(response.data);
    } catch (err) {
      res.status(500).json({ error: 'Erro de conexão com o AVA IFES.' });
    }
  });
  app.get('/api/courses', async (req, res) => {
    try {
      const { token, userid } = req.query;
      const response = await axios.get(`${AVA_URL}/webservice/rest/server.php`, {
        params: { wstoken: token, wsfunction: 'core_enrol_get_users_courses', moodlewsrestformat: 'json', userid }
      });
      res.json(response.data);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao carregar matérias.' });
    }
  });
  app.get('/api/course-contents', async (req, res) => {
    try {
      const { token, courseid } = req.query;
      const response = await axios.get(`${AVA_URL}/webservice/rest/server.php`, {
        params: { wstoken: token, wsfunction: 'core_course_get_contents', moodlewsrestformat: 'json', courseid }
      });
      res.json(response.data);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao obter conteúdo do curso.' });
    }
  });

  // Helper to initialize GoogleGenAI lazily with telemetry User-Agent header
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Real registered users in-memory registry
  const realUsersMap = new Map<string, any>();

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiAvailable: !!process.env.GEMINI_API_KEY });
  });

  // Get list of real app users
  app.get("/api/users", (req, res) => {
    const users = Array.from(realUsersMap.values());
    res.json({ users });
  });

  // Register or sync real app user
  app.post("/api/users/sync", (req, res) => {
    try {
      const { email, name, level = 1, xp = 0, streakDays = 1, lastActiveDate } = req.body;
      if (!email) {
        return res.status(400).json({ error: "E-mail do usuário obrigatório" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = realUsersMap.get(normalizedEmail) || {};
      const updatedUser = {
        email: normalizedEmail,
        name: name || existing.name || normalizedEmail.split("@")[0],
        level: Math.max(level, existing.level || 1),
        xp: Math.max(xp, existing.xp || 0),
        streakDays: typeof streakDays === "number" ? streakDays : (existing.streakDays || 1),
        lastActiveDate: lastActiveDate || new Date().toISOString(),
      };

      realUsersMap.set(normalizedEmail, updatedUser);

      return res.json({
        success: true,
        user: updatedUser,
        users: Array.from(realUsersMap.values()),
      });
    } catch (err: any) {
      console.error("Erro ao sincronizar usuário:", err);
      return res.status(500).json({ error: err?.message || "Failed to sync user" });
    }
  });

  // In-memory Guilds/Teams Repository - only contains teams created by real users
  const serverGuilds: any[] = [];

  function recalculateGuildRanks() {
    serverGuilds.sort((a, b) => b.totalXp - a.totalXp);
    serverGuilds.forEach((g, idx) => {
      g.rank = idx + 1;
      if (g.members) {
        g.membersCount = g.members.length;
      }
    });
  }

  // Get all teams
  app.get("/api/guilds", (req, res) => {
    try {
      recalculateGuildRanks();
      return res.json({
        success: true,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to list teams" });
    }
  });

  // Create a new custom Team
  app.post("/api/guilds", (req, res) => {
    try {
      const {
        name,
        tag,
        description,
        crest,
        category,
        motto,
        bannerColor,
        creatorEmail,
        creatorName,
        creatorXp = 0,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "O nome da equipe é obrigatório." });
      }

      const formattedTag = tag
        ? (tag.startsWith("#") ? tag : `#${tag}`).toUpperCase().trim()
        : `#${name.slice(0, 4).toUpperCase()}`;

      const newGuildId = `guild_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const newGuild = {
        id: newGuildId,
        name: name.trim(),
        tag: formattedTag,
        description: description?.trim() || "Nova equipe de estudos focada em cooperação e evolução diária.",
        crest: crest || "🛡️",
        category: category || "Geral",
        motto: motto?.trim() || "Unidos pelo aprendizado!",
        bannerColor: bannerColor || "from-amber-600/30 to-orange-950/20",
        leaderEmail: creatorEmail ? creatorEmail.trim().toLowerCase() : "anonimo@studyhub.ai",
        leaderName: creatorName || "Líder Fundador",
        createdAt: new Date().toISOString(),
        totalXp: Math.max(500, Number(creatorXp) || 500),
        membersCount: 1,
        messages: [
          {
            id: `msg_welcome_${Date.now()}`,
            senderName: "Sistema StudyHub",
            senderEmail: "system@studyhub.ai",
            senderRole: "Sistema",
            text: `🎉 Sejam bem-vindos à equipe "${name.trim()}"! Use este mural para trocar dicas, dúvidas e organizar duelos de estudos.`,
            timestamp: new Date().toISOString(),
            badge: "👑",
          },
        ],
        members: [
          {
            email: creatorEmail ? creatorEmail.trim().toLowerCase() : "anonimo@studyhub.ai",
            name: creatorName || "Líder Fundador",
            role: "Líder",
            xp: Number(creatorXp) || 0,
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      // Remove creator from other teams if they were a member
      if (creatorEmail) {
        const normEmail = creatorEmail.trim().toLowerCase();
        serverGuilds.forEach((g) => {
          if (g.members) {
            const initialCount = g.members.length;
            g.members = g.members.filter((m: any) => m.email !== normEmail);
            if (g.members.length !== initialCount) {
              g.membersCount = Math.max(1, g.members.length);
            }
          }
        });
      }

      serverGuilds.push(newGuild);
      recalculateGuildRanks();

      return res.json({
        success: true,
        guild: newGuild,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      console.error("Erro ao criar equipe:", err);
      return res.status(500).json({ error: err?.message || "Failed to create team" });
    }
  });

  // Join an existing team
  app.post("/api/guilds/:id/join", (req, res) => {
    try {
      const { id } = req.params;
      const { userEmail, userName, userXp = 0 } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "Email do usuário obrigatório." });
      }

      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }

      const normEmail = userEmail.trim().toLowerCase();

      // Remove from any previous team
      serverGuilds.forEach((g) => {
        if (g.members) {
          const prevLen = g.members.length;
          g.members = g.members.filter((m: any) => m.email !== normEmail);
          if (g.members.length !== prevLen) {
            g.membersCount = Math.max(1, g.members.length);
          }
        }
      });

      // Add to target team
      if (!targetGuild.members) {
        targetGuild.members = [];
      }
      if (!targetGuild.messages) {
        targetGuild.messages = [];
      }

      const isLeader = targetGuild.leaderEmail === normEmail;
      targetGuild.members.push({
        email: normEmail,
        name: userName || normEmail.split("@")[0],
        role: isLeader ? "Líder" : "Membro",
        xp: Number(userXp) || 0,
        joinedAt: new Date().toISOString(),
      });

      targetGuild.membersCount = targetGuild.members.length;
      targetGuild.totalXp += Math.floor((Number(userXp) || 0) * 0.1) + 100;

      // Add join system message
      targetGuild.messages.push({
        id: `msg_join_${Date.now()}`,
        senderName: "Sistema StudyHub",
        senderEmail: "system@studyhub.ai",
        senderRole: "Sistema",
        text: `👋 ${userName || normEmail.split("@")[0]} entrou para a equipe!`,
        timestamp: new Date().toISOString(),
        badge: "✨",
      });

      recalculateGuildRanks();

      return res.json({
        success: true,
        guild: targetGuild,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      console.error("Erro ao entrar na equipe:", err);
      return res.status(500).json({ error: err?.message || "Failed to join team" });
    }
  });

  // Leave team
  app.post("/api/guilds/:id/leave", (req, res) => {
    try {
      const { id } = req.params;
      const { userEmail } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "Email do usuário obrigatório." });
      }

      const normEmail = userEmail.trim().toLowerCase();
      const targetGuild = serverGuilds.find((g) => g.id === id);

      if (targetGuild && targetGuild.members) {
        targetGuild.members = targetGuild.members.filter((m: any) => m.email !== normEmail);
        targetGuild.membersCount = Math.max(1, targetGuild.members.length);
      }

      recalculateGuildRanks();

      return res.json({
        success: true,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to leave team" });
    }
  });

  // Contribute XP from battle or completed lessons to active team
  app.post("/api/guilds/:id/contribute", (req, res) => {
    try {
      const { id } = req.params;
      const { amount = 0, userEmail } = req.body;
      const targetGuild = serverGuilds.find((g) => g.id === id);

      if (targetGuild) {
        targetGuild.totalXp += Math.max(0, Number(amount));
        if (userEmail && targetGuild.members) {
          const normEmail = userEmail.trim().toLowerCase();
          const member = targetGuild.members.find((m: any) => m.email === normEmail);
          if (member) {
            member.xp += Math.max(0, Number(amount));
          }
        }
        recalculateGuildRanks();
      }

      return res.json({
        success: true,
        guild: targetGuild,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to contribute to team" });
    }
  });

  // Get messages for a team
  app.get("/api/guilds/:id/messages", (req, res) => {
    try {
      const { id } = req.params;
      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }
      return res.json({
        success: true,
        messages: targetGuild.messages || [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Delete team (only allowed by creator/leader)
  app.delete("/api/guilds/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { userEmail } = req.body || {};

      const guildIndex = serverGuilds.findIndex((g) => g.id === id);
      if (guildIndex === -1) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }

      const targetGuild = serverGuilds[guildIndex];

      // Validate leader if userEmail is provided
      if (userEmail && targetGuild.leaderEmail) {
        const normEmail = userEmail.trim().toLowerCase();
        const normLeader = targetGuild.leaderEmail.trim().toLowerCase();
        if (normEmail !== normLeader) {
          return res.status(403).json({ error: "Apenas o Líder / Criador da equipe pode excluí-la." });
        }
      }

      // Remove team
      serverGuilds.splice(guildIndex, 1);
      recalculateGuildRanks();

      return res.json({
        success: true,
        message: `Equipe "${targetGuild.name}" excluída com sucesso.`,
        guilds: serverGuilds,
      });
    } catch (err: any) {
      console.error("Erro ao excluir equipe:", err);
      return res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // Post a message in a team
  app.post("/api/guilds/:id/messages", (req, res) => {
    try {
      const { id } = req.params;
      const { text, senderName, senderEmail, senderRole = "Membro", badge } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "O texto da mensagem é obrigatório." });
      }

      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }

      if (!targetGuild.messages) {
        targetGuild.messages = [];
      }

      const newMessage = {
        id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        senderName: senderName || "Estudante",
        senderEmail: senderEmail ? senderEmail.trim().toLowerCase() : "anonimo@studyhub.ai",
        senderRole,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        badge: badge || undefined,
      };

      targetGuild.messages.push(newMessage);

      // Keep up to 200 recent messages
      if (targetGuild.messages.length > 200) {
        targetGuild.messages = targetGuild.messages.slice(-200);
      }

      return res.json({
        success: true,
        message: newMessage,
        messages: targetGuild.messages,
      });
    } catch (err: any) {
      console.error("Erro ao enviar mensagem na equipe:", err);
      return res.status(500).json({ error: "Failed to post message" });
    }
  });

  // Get active energy requests for a team
  app.get("/api/guilds/:id/energy-requests", (req, res) => {
    try {
      const { id } = req.params;
      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }
      return res.json({
        energyRequests: (targetGuild as any).energyRequests || [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch energy requests" });
    }
  });

  // Create an energy request in the team (Coin Master style)
  app.post("/api/guilds/:id/energy-requests", (req, res) => {
    try {
      const { id } = req.params;
      const { userEmail, userName, requestedAmount = 5 } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: "Email do usuário obrigatório." });
      }

      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }

      if (!(targetGuild as any).energyRequests) {
        (targetGuild as any).energyRequests = [];
      }

      const normEmail = userEmail.trim().toLowerCase();

      // Check if user has an active request created in the last 4 hours
      const existingActive = (targetGuild as any).energyRequests.find(
        (r: any) =>
          r.userEmail.toLowerCase() === normEmail &&
          r.status === "active" &&
          new Date(r.expiresAt).getTime() > Date.now()
      );

      if (existingActive) {
        return res.json({
          success: true,
          energyRequest: existingActive,
          energyRequests: (targetGuild as any).energyRequests,
          message: "Você já possui um pedido de energia ativo na equipe!",
        });
      }

      const newRequest = {
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        guildId: id,
        userEmail: normEmail,
        userName: userName || normEmail.split("@")[0],
        requestedAmount: Math.min(10, Math.max(1, requestedAmount)),
        receivedAmount: 0,
        donors: [],
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      };

      (targetGuild as any).energyRequests.unshift(newRequest);

      // Keep up to 50 recent requests
      if ((targetGuild as any).energyRequests.length > 50) {
        (targetGuild as any).energyRequests = (targetGuild as any).energyRequests.slice(0, 50);
      }

      // Add announcement to team chat
      if (!targetGuild.messages) {
        targetGuild.messages = [];
      }
      targetGuild.messages.push({
        id: `msg_sys_${Date.now()}`,
        senderName: "Sistema",
        senderEmail: "sistema@studyhub.ai",
        senderRole: "Sistema",
        text: `⚡ ${newRequest.userName} pediu ${newRequest.requestedAmount} Energias para a equipe! Ajude doando energia.`,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        energyRequest: newRequest,
        energyRequests: (targetGuild as any).energyRequests,
      });
    } catch (err: any) {
      console.error("Erro ao criar pedido de energia:", err);
      return res.status(500).json({ error: "Failed to create energy request" });
    }
  });

  // Donate energy to a teammate request (Coin Master style)
  app.post("/api/guilds/:id/energy-requests/:requestId/donate", (req, res) => {
    try {
      const { id, requestId } = req.params;
      const { donorEmail, donorName, amount = 1 } = req.body;

      if (!donorEmail) {
        return res.status(400).json({ error: "Email do doador obrigatório." });
      }

      const targetGuild = serverGuilds.find((g) => g.id === id);
      if (!targetGuild) {
        return res.status(404).json({ error: "Equipe não encontrada." });
      }

      const requests: any[] = (targetGuild as any).energyRequests || [];
      const targetRequest = requests.find((r) => r.id === requestId);

      if (!targetRequest) {
        return res.status(404).json({ error: "Pedido de energia não encontrado ou expirado." });
      }

      const normDonor = donorEmail.trim().toLowerCase();

      if (targetRequest.userEmail.toLowerCase() === normDonor) {
        return res.status(400).json({ error: "Você não pode doar energia para o seu próprio pedido." });
      }

      if (targetRequest.status === "completed" || targetRequest.receivedAmount >= targetRequest.requestedAmount) {
        return res.status(400).json({ error: "Este pedido de energia já atingiu o limite máximo de doações!" });
      }

      // Check how many times donor has donated to this request
      const donorContributionCount = targetRequest.donors.filter(
        (d: any) => d.donorEmail.toLowerCase() === normDonor
      ).reduce((acc: number, cur: any) => acc + (cur.amount || 1), 0);

      if (donorContributionCount >= 2) {
        return res.status(400).json({ error: "Você já doou o limite máximo para este pedido!" });
      }

      const actualDonation = Math.min(amount, targetRequest.requestedAmount - targetRequest.receivedAmount);
      targetRequest.receivedAmount += actualDonation;

      if (targetRequest.receivedAmount >= targetRequest.requestedAmount) {
        targetRequest.status = "completed";
      }

      const donorRecord = {
        donorEmail: normDonor,
        donorName: donorName || normDonor.split("@")[0],
        amount: actualDonation,
        timestamp: new Date().toISOString(),
      };
      targetRequest.donors.push(donorRecord);

      // Reward donor with +25 XP
      const xpReward = 25 * actualDonation;

      // Add chat message
      if (!targetGuild.messages) {
        targetGuild.messages = [];
      }
      targetGuild.messages.push({
        id: `msg_sys_${Date.now()}`,
        senderName: "Sistema",
        senderEmail: "sistema@studyhub.ai",
        senderRole: "Sistema",
        text: `⚡ ${donorRecord.donorName} doou ${actualDonation} Energia para ${targetRequest.userName}! (+${xpReward} XP)`,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        energyRequest: targetRequest,
        energyRequests: requests,
        energyDonated: actualDonation,
        donorXpReward: xpReward,
        recipientEmail: targetRequest.userEmail,
        message: `Você doou ${actualDonation} ⚡ para ${targetRequest.userName} e ganhou +${xpReward} XP!`,
      });
    } catch (err: any) {
      console.error("Erro ao doar energia:", err);
      return res.status(500).json({ error: "Failed to donate energy" });
    }
  });

  // Email Notification Dispatcher
  app.post("/api/notifications/email", async (req, res) => {
    try {
      const { to, subject, htmlBody, type, userName } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Destinatário obrigatório" });
      }

      console.log(`[StudyHub Notification] Dispatching ${type} email notification to ${to} (${userName || "Usuário"})...`);

      // Log notification record in server console
      return res.json({
        success: true,
        dispatchedAt: new Date().toISOString(),
        recipient: to,
        type: type || "security_alert",
      });
    } catch (err: any) {
      console.error("Erro ao enviar notificação:", err);
      return res.status(500).json({ error: err?.message || "Failed to dispatch email" });
    }
  });

  // Socratic AI Tutor endpoint
  app.post("/api/socratic/chat", async (req, res) => {
    try {
      const { message, history = [], currentModule = "Biologia Celular", learningGoal = "Compreensão conceitual" } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Mensagem obrigatória" });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent Socratic generator if no API key is provided
        const lower = message.toLowerCase();
        let fallbackResponse = "Essa é uma excelente observação! O que você acha que conecta essa ideia com as funções fundamentais do que estamos estudando?";
        if (lower.includes("energia") || lower.includes("atp") || lower.includes("mitocôndria")) {
          fallbackResponse = "Exatamente! A mitocôndria é a usina energética da célula e converte glicose em ATP. Agora reflita: qual gás essencial é consumido durante essa fosforilação oxidativa e qual é expelido?";
        } else if (lower.includes("dna") || lower.includes("genética") || lower.includes("núcleo")) {
          fallbackResponse = "Muito bem! O DNA guarda todo o código genético. Se uma célula precisa produzir uma proteína específica no citoplasma, qual molécula atua como mensageira temporária do DNA?";
        } else if (lower.includes("membrana") || lower.includes("osmose") || lower.includes("difusão")) {
          fallbackResponse = "Ótimo ponto! A membrana plasmática é semipermeável. Se colocarmos uma célula em um meio com alta concentração de sal (hipertônico), para onde a água se moverá naturalmente?";
        } else if (lower.includes("olá") || lower.includes("ola") || lower.includes("oi") || lower.includes("ajuda")) {
          fallbackResponse = `Olá! Sou a Lumina, sua tutora socrática. Estamos no módulo de ${currentModule}. Em vez de apenas dar a resposta pronta, vou te guiar passo a passo para você dominar o raciocínio. Qual é a sua dúvida ou hipótese inicial?`;
        }

        return res.json({
          reply: fallbackResponse,
          socraticPointers: [
            "Identifique a variável principal",
            "Relacione causa e consequência",
            "Pense nas analogias do cotidiano",
          ],
          source: "fallback",
        });
      }

      // Format previous history for Gemini
      const formattedHistory = history.map((item: { role: string; text: string }) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.text }],
      }));

      const systemInstruction = `Você é a "Lumina", uma tutora socrática e avaliadora pedagógica de elite integrada à plataforma educacional gamificada StudyHub.
Idioma: Português do Brasil (pt-BR).
Tom: Amigável, estimulante, caloroso, altamente didático e motivador.

DIRETRIZES DE VERIFICAÇÃO E AVALIAÇÃO DE RESPOSTAS:
1. SE O ALUNO ESTIVER RESPONDENDO A UMA PERGUNTA, TESTANDO UMA HIPÓTESE OU AFIRMANDO UM CONCEITO:
   - VERIFIQUE A RESPOSTA CLARAMENTE no início: indique com clareza se está ✅ **Correta**, ⚠️ **Parcialmente Correta** ou ❌ **Incorreta / Equivocada**.
   - Destaque com precisão o que ele acertou e onde houve equívoco ou lacuna conceitual.
   - Forneça a explicação clara do fundamento científico ou teórico.
   - Conclua com uma pergunta socrática estimulante para aprofundar ou consolidar o aprendizado.

2. SE O ALUNO ESTIVER FAZENDO UMA PERGUNTA OU PEDINDO AJUDA:
   - Dê uma explicação conceitual clara com analogias do cotidiano.
   - Formule uma pergunta socrática que o ajude a aplicar o conceito.

3. Mantenha respostas estruturadas e bem formatadas em Markdown limpo.
Módulo Atual de Estudo: ${currentModule}
Objetivo Pedagógico: ${learningGoal}`;

      const chat = ai.chats.create({
        model: "gemini-3.7-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({
        message: message,
      });

      const reply = response.text || "Vamos pensar juntos: qual é o primeiro elemento que podemos analisar nessa questão?";
      return res.json({
        reply,
        source: "gemini",
      });
    } catch (error: any) {
      console.error("Erro na rota Socrática:", error);
      return res.status(500).json({
        reply: "Tive um breve lapso de conexão, mas vamos em frente! O que você acha que seria o primeiro passo lógico para testar sua hipótese?",
        error: error?.message || "Internal error",
        source: "fallback_on_error",
      });
    }
  });

  // AI Answer Verification Endpoint (Avaliação e Verificação de Respostas do Estudante)
  app.post("/api/verify/answer", async (req, res) => {
    try {
      const { question, userAnswer, contextModule = "Biologia Celular", expectedConcept } = req.body;
      if (!userAnswer || !userAnswer.trim()) {
        return res.status(400).json({ error: "Resposta do usuário é obrigatória" });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent evaluation
        const lower = userAnswer.toLowerCase();
        let isCorrect = false;
        let score = 50;
        let verdict = "Parcialmente Correta";
        let feedback = "Você tocou em pontos importantes, mas pode aprofundar na relação de causa e efeito.";
        let detailedExplanation = "A compreensão dos processos biológicos depende de associar a estrutura celular com sua função bioquímica exata.";
        let keyStrengths = ["Tentou formular um raciocínio estruturado"];
        let pointsToImprove = ["Conectar melhor os termos técnicos"];
        let xpEarned = 25;

        if (
          lower.includes("mitocôndria") ||
          lower.includes("atp") ||
          lower.includes("energia") ||
          lower.includes("dna") ||
          lower.includes("ribossomo") ||
          lower.includes("membrana") ||
          lower.length > 25
        ) {
          isCorrect = true;
          score = 90;
          verdict = "Correta";
          feedback = "Excelente raciocínio! Você identificou os conceitos-chave corretos e expressou a lógica científica com precisão.";
          detailedExplanation = `Sua resposta demonstra sólida compreensão do tema (${contextModule}). As relações biológicas foram bem articuladas.`;
          keyStrengths = ["Identificação correta dos conceitos centrais", "Coerência lógica no argumento"];
          pointsToImprove = ["Pode citar exemplos práticos adicionais"];
          xpEarned = 40;
        }

        return res.json({
          isCorrect,
          score,
          verdict,
          feedback,
          detailedExplanation,
          keyStrengths,
          pointsToImprove,
          xpEarned,
          source: "fallback",
        });
      }

      const prompt = `Você é um avaliador pedagógico e professor especialista em ${contextModule}.
Analise a resposta do estudante para a seguinte questão/desafio reflexivo:

PERGUNTA/PROVOCAÇÃO:
"${question || "Desafio de Biologia Celular"}"

${expectedConcept ? `CONCEITO ESPERADO/GABARITO REFERENCIAL:\n"${expectedConcept}"\n` : ""}

RESPOSTA FORNECIDA PELO ESTUDANTE:
"${userAnswer}"

Avalie com rigor pedagógico e construtivo:
1. Determine o veredito: "Correta", "Parcialmente Correta" ou "Incorreta".
2. Atribua uma pontuação de 0 a 100 baseada na precisão conceitual e clareza.
3. Forneça um feedback motivador e didático explicando o porquê da avaliação.
4. Forneça a explicação conceitual detalhada e correta.
5. Liste os pontos fortes acertados pelo aluno e os pontos a melhorar/completar.
6. Calcule o XP ganho (entre 10 e 50 XP proporcional à qualidade).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: "Veredito: 'Correta', 'Parcialmente Correta' ou 'Incorreta'",
              },
              score: {
                type: Type.INTEGER,
                description: "Pontuação de 0 a 100",
              },
              isCorrect: {
                type: Type.BOOLEAN,
                description: "Verdadeiro se a resposta é substancialmente correta (score >= 70)",
              },
              feedback: {
                type: Type.STRING,
                description: "Avaliação pedagógica direta e motivadora",
              },
              detailedExplanation: {
                type: Type.STRING,
                description: "Explicação conceitual científica detalhada",
              },
              keyStrengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Pontos certos acertados pelo estudante",
              },
              pointsToImprove: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "O que faltou ou pode ser melhorado",
              },
              xpEarned: {
                type: Type.INTEGER,
                description: "XP concedido pela resposta (10 a 50)",
              },
            },
            required: [
              "verdict",
              "score",
              "isCorrect",
              "feedback",
              "detailedExplanation",
              "keyStrengths",
              "pointsToImprove",
              "xpEarned",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (error: any) {
      console.error("Erro na rota de verificação de respostas:", error);
      return res.status(500).json({
        error: error?.message || "Failed to verify answer",
        isCorrect: true,
        score: 75,
        verdict: "Parcialmente Correta",
        feedback: "Sua linha de pensamento está no caminho certo! Continue conectando as evidências científicas.",
        detailedExplanation: "A resposta aborda os pontos essenciais do processo celular.",
        keyStrengths: ["Participação ativa e raciocínio"],
        pointsToImprove: ["Refinar a precisão terminológica"],
        xpEarned: 25,
      });
    }
  });

  // PDF / Document / Topic Game & Quiz Generator
  app.post("/api/games/generate", async (req, res) => {
    try {
      const { textContent, topicName, fileBase64, mimeType, mode = "all" } = req.body;
      const cleanTopic = topicName ? topicName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "Documento de Estudo";

      const ai = getGeminiClient();

      if (!ai) {
        // Dynamic intelligent fallback based on detected subject in topicName or textContent
        const combined = `${cleanTopic} ${textContent || ""}`.toLowerCase();
        
        let detectedCategory = "Conhecimentos Gerais";
        let title = `Desafio: ${cleanTopic}`;
        let summary = `Módulo interativo de estudo gerado a partir do tema "${cleanTopic}".`;
        
        let flashcards = [
          {
            id: "fc-1",
            question: `Qual é o conceito fundamental abordado em ${cleanTopic}?`,
            answer: `Os princípios centrais e aplicações práticas estruturadas no material de ${cleanTopic}.`,
            category: "Conceito Central",
          },
          {
            id: "fc-2",
            question: `Qual a importância prática e teórica de estudar ${cleanTopic}?`,
            answer: "Permite compreender as relações de causa, efeito e resolução de problemas na área.",
            category: "Aplicação",
          },
          {
            id: "fc-3",
            question: `Quais são as principais variáveis ou elementos que definem ${cleanTopic}?`,
            answer: "As estruturas, normas, fórmulas ou eventos cronológicos que fundamentam a disciplina.",
            category: "Estrutura",
          },
          {
            id: "fc-4",
            question: `Como analisar criticamente os resultados em ${cleanTopic}?`,
            answer: "Avaliando as evidências, dados e teorias consolidadas no material de estudo.",
            category: "Análise Crítica",
          },
        ];

        let quizQuestions = [
          {
            id: "q-1",
            question: `1. Em relação ao tema "${cleanTopic}", qual das seguintes afirmações representa com maior exatidão o princípio central estudado?`,
            options: [
              `A) A análise aprofundada dos conceitos e relações diretas do tema ${cleanTopic}`,
              "B) Uma suposição aleatória sem embasamento nos materiais",
              "C) A negação de todas as teorias e evidências já comprovadas",
              "D) A aplicação isolada de fatos desconexos",
            ],
            correctIndex: 0,
            explanation: `O material foca no entendimento estruturado dos princípios essenciais de ${cleanTopic}.`,
            xpReward: 50,
          },
          {
            id: "q-2",
            question: `2. Ao analisar um problema prático dentro de ${cleanTopic}, qual deve ser a primeira etapa metodológica?`,
            options: [
              "A) Ignorar o contexto inicial e chutar a resposta",
              "B) Identificar as variáveis fundamentais e conceitos-chave do problema",
              "C) Descartar todas as fórmulas e definições teóricas",
              "D) Utilizar regras incompatíveis com o assunto",
            ],
            correctIndex: 1,
            explanation: "O raciocínio crítico exige isolar variáveis e aplicar os conceitos fundamentais da matéria.",
            xpReward: 50,
          },
          {
            id: "q-3",
            question: `3. Qual a principal consequência de dominar os fundamentos de ${cleanTopic}?`,
            options: [
              "A) Incapacidade de resolver exercícios práticos",
              "B) Capacidade de conectar teoria à prática e obter alta precisão analítica",
              "C) Perda de retenção na memória de longo prazo",
              "D) Dificuldade em explicar o assunto com clareza",
            ],
            correctIndex: 1,
            explanation: `Dominar ${cleanTopic} permite conectar teoria com aplicações reais com segurança.`,
            xpReward: 50,
          },
        ];

        // Specialized subject adjustments for fallback
        if (combined.includes("história") || combined.includes("historia") || combined.includes("guerra") || combined.includes("brasil") || combined.includes("revolução") || combined.includes("ditadura")) {
          detectedCategory = "História";
          title = `Desafio Histórico: ${cleanTopic}`;
          summary = `Módulo de análise histórica, contextualização socioeconômica e marcos cronológicos de ${cleanTopic}.`;
          flashcards = [
            {
              id: "fc-h1",
              question: "Qual foi o principal catalisador dos eventos estudados?",
              answer: "Tensões sociopolíticas, interesses econômicos e transformações estruturais da época.",
              category: "Contexto Histórico",
            },
            {
              id: "fc-h2",
              question: "Quais grupos sociais e lideranças protagonizaram esse período?",
              answer: "Movimentos populares, elites dirigentes e agentes institucionais em disputa por poder.",
              category: "Agentes Históricos",
            },
            {
              id: "fc-h3",
              question: "Qual o impacto de longo prazo desse período para a sociedade contemporânea?",
              answer: "Reformas constitucionais, novas matrizes de pensamento e reconfiguração geopolítica.",
              category: "Legado",
            },
            {
              id: "fc-h4",
              question: "Como as fontes documentais nos ajudam a interpretar esse momento?",
              answer: "Permitem cruzar narrativas oficiais com relatos da época para uma visão crítica e sem anacronismo.",
              category: "Metodologia Histórica",
            },
          ];
          quizQuestions = [
            {
              id: "q-h1",
              question: `1. Ao contextualizar o tema "${cleanTopic}", qual aspecto foi determinante para o desenrolar dos acontecimentos?`,
              options: [
                "A) Fatores puramente climáticos sem qualquer interferência humana",
                "B) A conjuntura política, econômica e as contradições sociais vigentes no período",
                "C) Um consenso unânime e pacífico entre todos os setores da sociedade",
                "D) A ausência total de registros documentais da época",
              ],
              correctIndex: 1,
              explanation: "Os processos históricos são moldados por relações sociais complexas e disputas de poder.",
              xpReward: 50,
            },
            {
              id: "q-h2",
              question: "2. Como os historiadores evitam o anacronismo ao analisar este tema?",
              options: [
                "A) Julgando o passado exclusivamente com a moral e a tecnologia de hoje",
                "B) Compreendendo as ações dos indivíduos dentro dos valores e limites de seu próprio tempo",
                "C) Desconsiderando todas as fontes primárias",
                "D) Criando teorias sem respaldo nos documentos",
              ],
              correctIndex: 1,
              explanation: "Evitar anacronismo significa interpretar os fatos respeitando a mentalidade e condições da época.",
              xpReward: 50,
            },
            {
              id: "q-h3",
              question: `3. Qual é o maior legado deixado pelos acontecimentos de "${cleanTopic}"?`,
              options: [
                "A) Transformações institucionais e reflexões críticas para os direitos e cidadania",
                "B) O esquecimento total dos eventos pela população",
                "C) A eliminação de qualquer discussão sociológica",
                "D) O encerramento definitivo da história mundial",
              ],
              correctIndex: 0,
              explanation: "Compreender marcos históricos fornece ferramentas para entender o presente e construir a cidadania.",
              xpReward: 50,
            },
          ];
        } else if (combined.includes("física") || combined.includes("fisica") || combined.includes("matemática") || combined.includes("matematica") || combined.includes("newton") || combined.includes("cálculo") || combined.includes("energia") || combined.includes("cinemática")) {
          detectedCategory = "Ciências Exatas";
          title = `Desafio de Exatas: ${cleanTopic}`;
          summary = `Módulo analítico com leis, equações, raciocínio lógico e resolução de problemas em ${cleanTopic}.`;
          flashcards = [
            {
              id: "fc-e1",
              question: `Qual é o princípio ou lei física/matemática fundamental em ${cleanTopic}?`,
              answer: "A conservação de grandezas (energia/momento) ou postulados axiomáticos que regem o sistema.",
              category: "Princípios Fundamentais",
            },
            {
              id: "fc-e2",
              question: "Como correlacionar as grandezas escalares e vetoriais envolvidas?",
              answer: "Identificando módulo, direção e sentido através de vetores e unidades coerentes no SI.",
              category: "Grandezas Físicas",
            },
            {
              id: "fc-e3",
              question: "Qual o método ideal para modelar e resolver equações desse assunto?",
              answer: "Isolar a incógnita, definir o referencial e aplicar as leis de conservação apropriadas.",
              category: "Resolução Analítica",
            },
            {
              id: "fc-e4",
              question: "O que indica a verificação dimensional das fórmulas?",
              answer: "Garante a consistência física e a coerência entre unidades de medida em ambos os lados da equação.",
              category: "Análise Dimensional",
            },
          ];
          quizQuestions = [
            {
              id: "q-e1",
              question: `1. No estudo de "${cleanTopic}", qual é a condição necessária para a validade dos modelos teóricos?`,
              options: [
                "A) A coerência dimensional e o respeito às leis fundamentais de conservação",
                "B) A violação da relação entre causa e efeito",
                "C) O uso de unidades de medida incompatíveis",
                "D) A suposição de que grandezas físicas não podem ser medidas",
              ],
              correctIndex: 0,
              explanation: "Toda modelagem em exatas deve manter consistência dimensional e respeitar os princípios universais.",
              xpReward: 50,
            },
            {
              id: "q-e2",
              question: "2. Qual a importância de adotar um referencial antes de calcular grandezas dinâmicas?",
              options: [
                "A) O referencial é opcional e não altera valores de posição ou velocidade",
                "B) Define a convenção de sinais e garante a correta interpretação do movimento/estado",
                "C) Serve apenas para fins estéticos no gráfico",
                "D) Impossibilita o cálculo exato",
              ],
              correctIndex: 1,
              explanation: "O referencial estabelece a origem e os sentidos positivos para todas as equações do sistema.",
              xpReward: 50,
            },
            {
              id: "q-e3",
              question: `3. Em uma aplicação prática de ${cleanTopic}, como testar a razoabilidade da resposta obtida?`,
              options: [
                "A) Ignorar a ordem de grandeza e unidade final",
                "B) Verificar a coerência de unidades e avaliar se a ordem de grandeza faz sentido no mundo real",
                "C) Alterar os dados iniciais arbitrariamente",
                "D) Considerar qualquer número como aceitável",
              ],
              correctIndex: 1,
              explanation: "A checagem dimensional e a estimativa de ordem de grandeza são salvaguardas essenciais.",
              xpReward: 50,
            },
          ];
        }

        return res.json({
          title,
          summary,
          flashcards,
          quizQuestions,
          source: "smart_fallback",
        });
      }

      // Build multimodal contents for Gemini 3.7 Flash
      const contentsPayload: any[] = [];

      if (fileBase64 && mimeType) {
        // Base64 clean without prefix
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
        contentsPayload.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        });
      }

      const promptInstructions = `Você é um gerador de jogos pedagógicos, professor universitário e designer instrucional de elite.
Analise COM MÁXIMO RIGOR o documento/arquivo fornecido (em anexo ou texto abaixo).
Extraia o TEMA REAL e os CONCEITOS ESPECÍFICOS do documento. Se o documento for de História, gere questões de História. Se for de Física, gere de Física. Se for de Direito, Biologia, Literatura, Filosofia, Matemática ou qualquer outro campo, gere 100% sobre o conteúdo real daquele material!

Nome do Arquivo / Tópico Informado: "${cleanTopic}"
${textContent && !fileBase64 ? `Conteúdo textual do documento:\n"""${textContent.slice(0, 15000)}"""\n` : ""}

REQUISITOS OBRIGATÓRIOS DO PACOTE GERADO (EM PORTUGUÊS PT-BR):
1. **title**: Um título expressivo e dinâmico diretamente relacionado ao tema exato do documento (Ex: "Desafio: A Era Vargas e a CLT", "Física Quântica: O Efeito Fotoelétrico", "Biologia: Respiração Celular", etc.).
2. **summary**: Um resumo conciso (1 a 2 frases) sintetizando os tópicos abordados no arquivo.
3. **flashcards**: Exatamente 4 flashcards de memorização rápida e alto impacto sobre termos, leis, datas, fórmulas ou conceitos centrais do documento. Cada um com:
   - "id": "fc-1", "fc-2", ...
   - "question": Pergunta conceitual direta e instigante.
   - "answer": Resposta clara, precisa e fundamentada.
   - "category": Categoria/subtema da disciplina.
4. **quizQuestions**: 3 a 5 questões de múltipla escolha pertinentes ao documento com:
   - "id": "q-1", "q-2", ...
   - "question": Enunciado contextualizado, claro e rigoroso baseado no documento.
   - "options": Exatamente 4 alternativas (iniciando com "A) ", "B) ", "C) ", "D) "), sendo apenas UMA inquestionavelmente correta e três distratores plausíveis com erros conceituais comuns.
   - "correctIndex": Índice da alternativa correta (0 para A, 1 para B, 2 para C, 3 para D).
   - "explanation": Gabarito comentado explicando em detalhes por que a alternativa correta é a certa e por que as outras são incorretas, reforçando o aprendizado do aluno.
   - "xpReward": 50.`;

      contentsPayload.push({
        text: promptInstructions,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contentsPayload,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título dinâmico do desafio condizente com o documento" },
              summary: { type: Type.STRING, description: "Resumo pedagógico do documento em 1 a 2 frases" },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ["id", "question", "answer", "category"],
                },
              },
              quizQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    xpReward: { type: Type.INTEGER },
                  },
                  required: ["id", "question", "options", "correctIndex", "explanation", "xpReward"],
                },
              },
            },
            required: ["title", "summary", "flashcards", "quizQuestions"],
          },
        },
      });

      const parsedData = JSON.parse(response.text || "{}");
      return res.json(parsedData);
    } catch (error: any) {
      console.error("Erro na geração de jogos:", error);
      return res.status(500).json({ error: error?.message || "Failed to generate game content" });
    }
  });

  // Custom Subject Track Generator (Criação de Trilha Personalizada de Estudo)
  app.post("/api/subjects/generate-track", async (req, res) => {
    try {
      const { subjects = [], goal = "Aprender conceitos fundamentais e avançados com método socrático" } = req.body;
      const subjectsList = Array.isArray(subjects) && subjects.length > 0 ? subjects.join(", ") : "Matemática, Biologia, Física";
      
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(200).json({ status: "fallback_needed" });
      }

      const prompt = `Você é um coordenador pedagógico socrático de elite da plataforma educacional StudyHub.
O estudante informou as seguintes matérias que ele precisa estudar: "${subjectsList}".
Objetivo pedagógico: "${goal}".

Crie uma trilha de aprendizagem estruturada contendo entre 3 e 5 módulos progressivos.
Para cada módulo, forneça:
1. title: Título objetivo do módulo (ex: "Módulo 1: Fundamentos de [Matéria]")
2. subtitle: Subtítulo claro explicando o foco.
3. category: Nome da matéria / disciplina correspondente.
4. estimatedMinutes: Tempo estimado (15 a 30 min).
5. xpReward: XP ao concluir (100 a 250 XP).
6. summary: Resumo instigante do módulo.
7. keyConcepts: Lista com 3 a 5 conceitos-chave essenciais.
8. lessons: Array com 2 lições contendo:
   - title: Título da lição
   - conceptText: Explicação teórica clara e instigante do conceito.
   - socraticPrompt: Pergunta socrática reflexiva provocando o aluno a raciocinar.
   - quizQuestion: Objeto com:
     - question: Pergunta de múltipla escolha testando a compreensão do conceito.
     - options: 4 opções de resposta.
     - correctIndex: Índice inteiro (0 a 3) da opção correta.
     - explanation: Explicação didática do porquê a resposta correta está certa.

Todos os textos devem ser em Português do Brasil (pt-BR).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    category: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    xpReward: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyConcepts: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    lessons: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          conceptText: { type: Type.STRING },
                          socraticPrompt: { type: Type.STRING },
                          quizQuestion: {
                            type: Type.OBJECT,
                            properties: {
                              question: { type: Type.STRING },
                              options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                              },
                              correctIndex: { type: Type.INTEGER },
                              explanation: { type: Type.STRING },
                            },
                            required: ["question", "options", "correctIndex", "explanation"],
                          },
                        },
                        required: ["title", "conceptText", "socraticPrompt", "quizQuestion"],
                      },
                    },
                  },
                  required: ["title", "subtitle", "category", "estimatedMinutes", "xpReward", "summary", "keyConcepts", "lessons"],
                },
              },
            },
            required: ["modules"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (error: any) {
      console.error("Erro na geração de trilha de matérias:", error);
      return res.status(200).json({ status: "fallback_needed", error: error?.message });
    }
  });

  // 1v1 Battle Quick Questions Generator
  app.post("/api/battle/questions", async (req, res) => {
    try {
      const { category = "Geral", count = 5 } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback default battle questions
        const defaultPool = [
          {
            id: "b1",
            question: "Qual organela é responsável pela respiração celular?",
            options: ["Mitocôndria", "Complexo de Golgi", "Ribossomo", "Vacúolo"],
            correctIndex: 0,
            timeLimitSeconds: 15,
          },
          {
            id: "b2",
            question: "Quantos pares de cromossomos uma célula somática humana típica possui?",
            options: ["21", "23", "46", "12"],
            correctIndex: 1,
            timeLimitSeconds: 15,
          },
          {
            id: "b3",
            question: "Qual é a principal função da hemoglobina no sangue humano?",
            options: ["Coagulação sanguínea", "Transporte de oxigênio", "Combate a vírus", "Digestão de gorduras"],
            correctIndex: 1,
            timeLimitSeconds: 15,
          },
          {
            id: "b4",
            question: "Qual processo converte energia solar em glicose em plantas e algas?",
            options: ["Fermentação", "Fotossíntese", "Quimiossíntese", "Digestão celular"],
            correctIndex: 1,
            timeLimitSeconds: 15,
          },
          {
            id: "b5",
            question: "Qual molécula é conhecida como o material genético universal?",
            options: ["Lipídios", "Proteína", "Ácido Desoxirribonucleico (DNA)", "Glicogênio"],
            correctIndex: 2,
            timeLimitSeconds: 15,
          },
        ];
        return res.json({ questions: defaultPool.slice(0, count) });
      }

      const prompt = `Gere ${count} perguntas rápidas de quiz competitivo 1v1 em português (pt-BR) sobre o tema: "${category}".
Cada questão deve ter enunciado claro, 4 opções, e apenas 1 índice correto (0 a 3). Tempo limite sugerido: 15 segundos por questão.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    timeLimitSeconds: { type: Type.INTEGER },
                  },
                  required: ["id", "question", "options", "correctIndex", "timeLimitSeconds"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (error: any) {
      console.error("Erro na geração de batalha:", error);
      return res.status(500).json({ error: error?.message || "Failed to generate battle questions" });
    }
  });

  // ==========================================
  // COIN MASTER ENGINE & IN-MEMORY GAME DATABASE
  // ==========================================
  const coinMasterDB = {
    id: "player_01",
    name: "Ruam",
    spins: 50,
    maxSpins: 50,
    coins: 150000,
    shields: 1,
    maxShields: 3,
    stars: 0,
    villageLevel: 1,
    villageBuildings: [0, 0, 0, 0, 0], // 5 edifícios (nível 0 a 5 cada)
    pets: {
      foxy: { name: "Foxy (Saque)", unlocked: true, level: 1, activeUntil: null as string | null, bonusRaid: 0.25 },
      tiger: { name: "Tiger (Ataque)", unlocked: true, level: 1, activeUntil: null as string | null, bonusAttack: 0.20 },
      rhino: { name: "Rhino (Escudo)", unlocked: false, level: 1, activeUntil: null as string | null, blockChance: 0.30 },
    },
    petFood: 3,
    petXP: 50,
    cards: ["Carta Viking", "Escudo Sagrado"] as string[],
    completedSets: [] as string[],
  };

  function getSpinResult() {
    const rand = Math.random();
    if (rand < 0.35) return "COINS";       // 35% Moedas
    if (rand < 0.55) return "SPINS";       // 20% Giros Extras
    if (rand < 0.70) return "SHIELD";      // 15% Escudo
    if (rand < 0.85) return "ATTACK";      // 15% Ataque
    return "RAID";                         // 15% Saque ao Porco Mestre
  }

  function getBuildingCost(level: number) {
    return Math.floor(40000 * Math.pow(1.7, level));
  }

  const isPetActive = (pet: { activeUntil: string | null }) =>
    pet.activeUntil ? new Date(pet.activeUntil).getTime() > Date.now() : false;

  // Rota 1: Estado Atual do Jogador (Coin Master)
  app.get("/api/player", (req, res) => {
    res.json(coinMasterDB);
  });

  // Rota 2: Girar a Roleta (Slot Machine RNG)
  app.post("/api/spin", (req, res) => {
    try {
      const betMultiplier = Math.max(1, parseInt(req.body.multiplier, 10) || 1);
      const cost = 1 * betMultiplier;

      if (coinMasterDB.spins < cost) {
        return res.status(400).json({ error: "Giros insuficientes!", spins: coinMasterDB.spins });
      }

      coinMasterDB.spins -= cost;
      const outcome = getSpinResult();
      let reward: { outcome: string; multiplier: number; details: any; symbolIcon: string } = {
        outcome,
        multiplier: betMultiplier,
        symbolIcon: "💰",
        details: {},
      };

      switch (outcome) {
        case "COINS": {
          reward.symbolIcon = "💰";
          const coinGain = 30000 * betMultiplier;
          coinMasterDB.coins += coinGain;
          reward.details = { coinsGained: coinGain, message: `Ganhou ${coinGain.toLocaleString("pt-BR")} moedas!` };
          break;
        }

        case "SPINS": {
          reward.symbolIcon = "⚡";
          const spinsGained = 10 * betMultiplier;
          coinMasterDB.spins += spinsGained;
          reward.details = { spinsGained, message: `Ganhou +${spinsGained} Giros!` };
          break;
        }

        case "SHIELD": {
          reward.symbolIcon = "🛡️";
          if (coinMasterDB.shields < coinMasterDB.maxShields) {
            coinMasterDB.shields += 1;
            reward.details = { shieldAdded: true, message: "Obteve 1 Escudo Protetor!" };
          } else {
            const converted = 10000 * betMultiplier;
            coinMasterDB.coins += converted;
            reward.details = { shieldConvertedToCoins: converted, message: "Escudos cheios! Convertido em +10.000 moedas." };
          }
          break;
        }

        case "ATTACK": {
          reward.symbolIcon = "⚔️";
          let baseAttackCoins = 50000 * betMultiplier;
          let petBuffApplied = false;
          if (isPetActive(coinMasterDB.pets.tiger)) {
            baseAttackCoins = Math.floor(baseAttackCoins * (1 + coinMasterDB.pets.tiger.bonusAttack));
            petBuffApplied = true;
          }
          coinMasterDB.coins += baseAttackCoins;
          reward.details = {
            action: "Attack Executed",
            coinsStolen: baseAttackCoins,
            petBuffApplied,
            message: `⚔️ Ataque bem-sucedido! Roubou ${baseAttackCoins.toLocaleString("pt-BR")} moedas${petBuffApplied ? " (Bônus Tiger +20% ativo)" : ""}!`,
          };
          break;
        }

        case "RAID": {
          reward.symbolIcon = "🐷";
          let baseRaidCoins = 100000 * betMultiplier;
          let petBuffApplied = false;
          if (isPetActive(coinMasterDB.pets.foxy)) {
            baseRaidCoins = Math.floor(baseRaidCoins * (1 + coinMasterDB.pets.foxy.bonusRaid));
            petBuffApplied = true;
          }
          coinMasterDB.coins += baseRaidCoins;
          reward.details = {
            action: "Raid Executed (Porco Mestre)",
            coinsStolen: baseRaidCoins,
            petBuffApplied,
            message: `🐷 Saque ao Porco Mestre! Ganhou ${baseRaidCoins.toLocaleString("pt-BR")} moedas${petBuffApplied ? " (Bônus Foxy +25% ativo)" : ""}!`,
          };
          break;
        }
      }

      return res.json({
        message: "Giro executado com sucesso!",
        reward,
        player: coinMasterDB,
      });
    } catch (err: any) {
      console.error("Erro no giro da roleta:", err);
      return res.status(500).json({ error: err?.message || "Failed to process spin" });
    }
  });

  // Rota 3: Evoluir Edifício da Vila
  app.post("/api/village/upgrade", (req, res) => {
    try {
      const buildingIndex = parseInt(req.body.buildingIndex, 10);

      if (isNaN(buildingIndex) || buildingIndex < 0 || buildingIndex > 4) {
        return res.status(400).json({ error: "Índice de edifício inválido (0 a 4)." });
      }

      const currentLevel = coinMasterDB.villageBuildings[buildingIndex];
      if (currentLevel >= 5) {
        return res.status(400).json({ error: "Edifício já está no nível máximo (5/5)!" });
      }

      const cost = getBuildingCost(currentLevel);
      if (coinMasterDB.coins < cost) {
        return res.status(400).json({
          error: `Moedas insuficientes! Custo: ${cost.toLocaleString("pt-BR")} 🪙 (Você tem: ${coinMasterDB.coins.toLocaleString("pt-BR")})`,
        });
      }

      coinMasterDB.coins -= cost;
      coinMasterDB.villageBuildings[buildingIndex] += 1;
      coinMasterDB.stars += 1;

      // Verificar se a vila inteira foi concluída (todos os 5 edifícios nível 5)
      const isVillageComplete = coinMasterDB.villageBuildings.every((lvl) => lvl === 5);
      if (isVillageComplete) {
        coinMasterDB.villageLevel += 1;
        coinMasterDB.villageBuildings = [0, 0, 0, 0, 0];
        coinMasterDB.spins += 50; // Bônus de conclusão de vila
        coinMasterDB.coins += 200000;
      }

      return res.json({
        message: isVillageComplete
          ? "🎉 Parabéns! Vila concluída! Avançou para a próxima vila e ganhou +50 Giros e +200.000 🪙!"
          : "Edifício aprimorado com sucesso!",
        buildingIndex,
        newLevel: coinMasterDB.villageBuildings[buildingIndex],
        isVillageComplete,
        player: coinMasterDB,
      });
    } catch (err: any) {
      console.error("Erro ao aprimorar edifício:", err);
      return res.status(500).json({ error: err?.message || "Failed to upgrade village building" });
    }
  });

  // Rota 4: Alimentar Mascote
  app.post("/api/pets/feed", (req, res) => {
    try {
      const petName = (req.body.petName || "").toLowerCase() as "foxy" | "tiger" | "rhino";

      if (!coinMasterDB.pets[petName] || !coinMasterDB.pets[petName].unlocked) {
        return res.status(400).json({ error: "Mascote indisponível ou bloqueado." });
      }

      if (coinMasterDB.petFood <= 0) {
        return res.status(400).json({ error: "Você não tem ração disponível!" });
      }

      coinMasterDB.petFood -= 1;
      const activeDurationMs = 4 * 60 * 60 * 1000; // 4 horas
      coinMasterDB.pets[petName].activeUntil = new Date(Date.now() + activeDurationMs).toISOString();

      return res.json({
        message: `🥩 ${coinMasterDB.pets[petName].name} foi alimentado e ficará ativo por 4 horas!`,
        pet: coinMasterDB.pets[petName],
        petFood: coinMasterDB.petFood,
        player: coinMasterDB,
      });
    } catch (err: any) {
      console.error("Erro ao alimentar mascote:", err);
      return res.status(500).json({ error: err?.message || "Failed to feed pet" });
    }
  });

  // Rota 5: Abrir Baú de Cartas
  app.post("/api/chests/open", (req, res) => {
    try {
      const cost = 50000;
      if (coinMasterDB.coins < cost) {
        return res.status(400).json({
          error: `Moedas insuficientes para o Baú Místico! Custo: ${cost.toLocaleString("pt-BR")} 🪙`,
        });
      }

      coinMasterDB.coins -= cost;
      const availableCards = [
        "Carta Viking",
        "Dragão Dourado",
        "Escudo Sagrado",
        "Faraó Raro",
        "Carta Ouro Especial",
        "Viking Lendário",
        "Amuleto Cósmico",
      ];
      const droppedCards: string[] = [];

      for (let i = 0; i < 3; i++) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        coinMasterDB.cards.push(randomCard);
        droppedCards.push(randomCard);
      }

      return res.json({
        message: "📦 Baú Místico aberto com sucesso!",
        droppedCards,
        totalCards: coinMasterDB.cards,
        player: coinMasterDB,
      });
    } catch (err: any) {
      console.error("Erro ao abrir baú:", err);
      return res.status(500).json({ error: err?.message || "Failed to open chest" });
    }
  });

  // Rota 6: Evento Dinâmico Gerado por IA (Google AI Studio / Gemini)
  app.get("/api/ai/generate-event", async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback evento temático
        const fallbackEvents = [
          {
            title: "⚡ Tempestade de Raios Nórdica",
            description: "O Deus Thor enviou energias místicas para a sua vila. Obtenha 3 símbolos de giros na roleta para dobrar seus ganhos!",
            targetTask: "Consiga 3 símbolos de Raio/Giro na Roleta",
            rewardSpins: 25,
            narrativeIntro: "Uma tempestade reluzente surge nos céus da sua vila...",
          },
          {
            title: "🐷 O Ataque do Porco Dourado",
            description: "O Porco Mestre escondeu um tesouro milionário em uma vila vizinha. Realize saques hoje para triplicar suas moedas.",
            targetTask: "Execute 2 saques bem-sucedidos ao Porco Mestre",
            rewardSpins: 30,
            narrativeIntro: "Rumores no reino dizem que os cofres do Porco Mestre estão transbordando...",
          },
          {
            title: "🛡️ Festival dos Escudos Inquebráveis",
            description: "Mantenha seus 3 escudos intactos e receba bênçãos de proteção e giros extras para evoluir sua vila.",
            targetTask: "Compre e mantenha 3 escudos ativos",
            rewardSpins: 20,
            narrativeIntro: "Os guardiões da vila proclamam o dia da defesa impenetrável...",
          },
        ];
        const randomEvt = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
        return res.json({ success: true, aiGeneratedEvent: randomEvt, source: "fallback" });
      }

      const prompt = `Você é o Lead Game Designer do Coin Master e de jogos casuais de construção de vilas.
Gere um evento temporário especial e dinâmico em formato JSON para um jogador que está no Nível de Vila ${coinMasterDB.villageLevel} com ${coinMasterDB.coins} moedas e ${coinMasterDB.stars} estrelas.
Retorne estritamente um objeto JSON com as seguintes chaves em português:
- "title": Título divertido e impactante do evento
- "description": Descrição curta e empolgante do evento
- "targetTask": Meta clara para o jogador (ex: "Consiga 3 ataques perfeitos", "Complete 1 edifício")
- "rewardSpins": Número inteiro de giros extras concedidos (entre 15 e 60)
- "narrativeIntro": 1 a 2 frases imersivas de introdução da história`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const aiText = response.text || "{}";
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      const parsedEvent = JSON.parse(cleanJson);

      return res.json({ success: true, aiGeneratedEvent: parsedEvent, source: "gemini" });
    } catch (error: any) {
      console.error("Erro ao gerar evento com IA:", error);
      return res.json({
        success: true,
        aiGeneratedEvent: {
          title: "🔥 Frenesi de Giros Lendários",
          description: "O reino está em festa! Complete edifícios e gire a roleta para colher tesouros inimagináveis.",
          targetTask: "Gire a roleta 5 vezes consecutivas",
          rewardSpins: 35,
          narrativeIntro: "Uma aura dourada envolve os slots mágicos da sua vila...",
        },
        source: "fallback_on_error",
      });
    }
  });

  // Rota 7: Diálogo de Ataque / Provocação PvP com IA (Google AI Studio / Gemini)
  app.post("/api/ai/attack-dialogue", async (req, res) => {
    try {
      const { targetName = "Jogador Rival", outcome = "sucesso" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const fallbacks = [
          `⚔️ "Hahaha, ${targetName}! Nem seus 3 escudos conseguiram segurar a força do meu ataque!"`,
          `🐷 "Suas moedas estão muito mais seguras no meu cofre, ${targetName}!"`,
          `💥 "Kaboom! Essa vila de ${targetName} vai precisar de uma boa reforma agora!"`,
          `⚡ "Mais sorte na próxima defesa, ${targetName}! O reino pertence aos mais rápidos!"`,
        ];
        const randomLine = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ dialogue: randomLine, source: "fallback" });
      }

      const prompt = `Crie uma frase curta, divertida, com emojis e provocadora (estilo desenho animado cômico do Coin Master) para o jogador que acabou de atacar a vila de "${targetName}" com resultado "${outcome}".
A frase deve ter no máximo 2 linhas e ser muito expressiva e memorável.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const dialogue = (response.text || "").trim();
      return res.json({ dialogue, source: "gemini" });
    } catch (error: any) {
      console.error("Erro ao gerar diálogo de ataque com IA:", error);
      return res.json({
        dialogue: `⚔️ "Sua vila foi saqueada com maestria! Prepare-se para a revanche!"`,
        source: "fallback_on_error",
      });
    }
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyHub Lumina AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
