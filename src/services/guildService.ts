import { EnergyRequest, GuildInfo, GuildMessage, UserProfile } from "../types";
import { GUILDS_LIST } from "../data/initialData";

const GUILDS_STORAGE_KEY = "studyhub_real_user_guilds_v4";
const GUILD_MESSAGES_STORAGE_PREFIX = "studyhub_team_messages_";
const GUILD_ENERGY_REQUESTS_PREFIX = "studyhub_team_energy_requests_";

/**
 * Loads all teams from API or localStorage (strictly real user created teams)
 */
export async function getGuildsList(userEmail?: string): Promise<GuildInfo[]> {
  try {
    const res = await fetch("/api/guilds");
    if (res.ok) {
      const data = await res.json();
      if (data.guilds && Array.isArray(data.guilds)) {
        localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(data.guilds));
        return markUserGuild(data.guilds, userEmail);
      }
    }
  } catch (err) {
    console.warn("Could not fetch teams from server, using local cache:", err);
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(GUILDS_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return markUserGuild(parsed, userEmail);
      }
    }
  } catch (e) {
    console.warn("Error reading local teams cache:", e);
  }

  return markUserGuild(GUILDS_LIST, userEmail);
}

/**
 * Marks which team belongs to the user and recalculates member counts based on real members
 */
function markUserGuild(guilds: GuildInfo[], userEmail?: string): GuildInfo[] {
  const normEmail = userEmail ? userEmail.trim().toLowerCase() : "";

  return guilds.map((g) => {
    const isLeader = normEmail ? g.leaderEmail?.toLowerCase() === normEmail : false;
    const isMember = normEmail ? g.members?.some((m) => m.email.toLowerCase() === normEmail) : false;
    const realMembersCount = g.members?.length || g.membersCount || 1;
    return {
      ...g,
      membersCount: realMembersCount,
      isUserGuild: isLeader || isMember || false,
    };
  });
}

/**
 * Creates a new custom team
 */
export async function createCustomGuild(
  params: {
    name: string;
    tag?: string;
    description?: string;
    crest: string;
    category: string;
    motto?: string;
    bannerColor?: string;
  },
  user: UserProfile
): Promise<{ guild: GuildInfo; allGuilds: GuildInfo[] }> {
  try {
    const res = await fetch("/api/guilds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        creatorEmail: user.email,
        creatorName: user.name,
        creatorXp: user.xp,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.guild && data.guilds) {
        localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(data.guilds));
        return {
          guild: data.guild,
          allGuilds: markUserGuild(data.guilds, user.email),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to create team on server, creating locally:", e);
  }

  // Fallback local creation
  const all = await getGuildsList(user.email);
  const formattedTag = params.tag
    ? params.tag.startsWith("#") ? params.tag.toUpperCase() : `#${params.tag.toUpperCase()}`
    : `#${params.name.slice(0, 4).toUpperCase()}`;

  const newGuild: GuildInfo = {
    id: `guild_local_${Date.now()}`,
    name: params.name.trim(),
    tag: formattedTag,
    description: params.description || "Equipe criada por estudante dedicado.",
    crest: params.crest || "🛡️",
    category: params.category || "Geral",
    motto: params.motto || "Juntos rumo ao topo!",
    bannerColor: params.bannerColor || "from-amber-600/30 to-orange-950/20",
    leaderName: user.name,
    leaderEmail: user.email,
    createdAt: new Date().toISOString(),
    totalXp: Math.max(500, user.xp),
    membersCount: 1,
    isUserGuild: true,
    rank: all.length + 1,
    messages: [
      {
        id: `msg_welcome_${Date.now()}`,
        senderName: "Sistema Brain Studio",
        senderEmail: "system@brainstudio.ai",
        senderRole: "Sistema",
        text: `🎉 Sejam bem-vindos à equipe "${params.name.trim()}"! Usem este mural para estudar juntos e compartilhar estratégias.`,
        timestamp: new Date().toISOString(),
        badge: "👑",
      },
    ],
    members: [
      {
        email: user.email,
        name: user.name,
        role: "Líder",
        xp: user.xp,
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  const updatedList = [newGuild, ...all.map((g) => ({ ...g, isUserGuild: false }))];
  updatedList.sort((a, b) => b.totalXp - a.totalXp);
  updatedList.forEach((g, idx) => {
    g.rank = idx + 1;
  });

  localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(updatedList));

  return {
    guild: newGuild,
    allGuilds: updatedList,
  };
}

/**
 * Join an existing team
 */
export async function joinGuild(
  guildId: string,
  user: UserProfile
): Promise<{ guild?: GuildInfo; allGuilds: GuildInfo[] }> {
  try {
    const res = await fetch(`/api/guilds/${guildId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: user.email,
        userName: user.name,
        userXp: user.xp,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.guilds) {
        localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(data.guilds));
        return {
          guild: data.guild,
          allGuilds: markUserGuild(data.guilds, user.email),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to join team on server, joining locally:", e);
  }

  // Local join
  const all = await getGuildsList(user.email);
  const normEmail = user.email.toLowerCase();

  const updatedList = all.map((g) => {
    const isTarget = g.id === guildId;
    let members = g.members || [];

    // Remove from other teams
    members = members.filter((m) => m.email.toLowerCase() !== normEmail);

    if (isTarget) {
      members.push({
        email: user.email,
        name: user.name,
        role: g.leaderEmail?.toLowerCase() === normEmail ? "Líder" : "Membro",
        xp: user.xp,
        joinedAt: new Date().toISOString(),
      });
      return {
        ...g,
        members,
        membersCount: members.length,
        totalXp: g.totalXp + Math.floor(user.xp * 0.1) + 100,
        isUserGuild: true,
      };
    }

    return {
      ...g,
      members,
      membersCount: Math.max(1, members.length),
      isUserGuild: false,
    };
  });

  updatedList.sort((a, b) => b.totalXp - a.totalXp);
  updatedList.forEach((g, idx) => {
    g.rank = idx + 1;
  });

  localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(updatedList));
  const target = updatedList.find((g) => g.id === guildId);

  return {
    guild: target,
    allGuilds: updatedList,
  };
}

/**
 * Deletes a custom team created by the user
 */
export async function deleteGuild(
  guildId: string,
  userEmail: string
): Promise<{ success: boolean; allGuilds: GuildInfo[] }> {
  try {
    const res = await fetch(`/api/guilds/${guildId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.guilds) {
        localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(data.guilds));
        localStorage.removeItem(GUILD_MESSAGES_STORAGE_PREFIX + guildId);
        return {
          success: true,
          allGuilds: markUserGuild(data.guilds, userEmail),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to delete team on server, deleting locally:", e);
  }

  // Local fallback deletion
  const all = await getGuildsList(userEmail);
  const updatedList = all.filter((g) => g.id !== guildId);

  updatedList.sort((a, b) => b.totalXp - a.totalXp);
  updatedList.forEach((g, idx) => {
    g.rank = idx + 1;
  });

  localStorage.setItem(GUILDS_STORAGE_KEY, JSON.stringify(updatedList));
  localStorage.removeItem(GUILD_MESSAGES_STORAGE_PREFIX + guildId);

  return {
    success: true,
    allGuilds: markUserGuild(updatedList, userEmail),
  };
}

/**
 * Contribute XP to active team
 */
export async function contributeGuildXp(guildId: string, amount: number, userEmail?: string) {
  if (!guildId) return;
  try {
    await fetch(`/api/guilds/${guildId}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, userEmail }),
    });
  } catch (e) {
    console.warn("Could not contribute XP to team:", e);
  }
}

/**
 * Fetch messages for a specific team
 */
export async function getGuildMessages(guildId: string): Promise<GuildMessage[]> {
  if (!guildId) return [];
  try {
    const res = await fetch(`/api/guilds/${guildId}/messages`);
    if (res.ok) {
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        localStorage.setItem(
          GUILD_MESSAGES_STORAGE_PREFIX + guildId,
          JSON.stringify(data.messages)
        );
        return data.messages;
      }
    }
  } catch (e) {
    console.warn("Could not fetch team messages from server, reading local cache:", e);
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem(GUILD_MESSAGES_STORAGE_PREFIX + guildId);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Ignore error
  }

  return [];
}

/**
 * Send a message to a team
 */
export async function sendGuildMessage(
  guildId: string,
  message: {
    text: string;
    senderName: string;
    senderEmail: string;
    senderRole?: "Líder" | "Vice-Líder" | "Membro" | "Sistema";
    badge?: string;
  }
): Promise<{ success: boolean; message?: GuildMessage; messages: GuildMessage[] }> {
  if (!guildId || !message.text.trim()) {
    return { success: false, messages: [] };
  }

  try {
    const res = await fetch(`/api/guilds/${guildId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.messages) {
        localStorage.setItem(
          GUILD_MESSAGES_STORAGE_PREFIX + guildId,
          JSON.stringify(data.messages)
        );
        return {
          success: true,
          message: data.message,
          messages: data.messages,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to post message to server, saving locally:", e);
  }

  // Fallback local save
  const current = await getGuildMessages(guildId);
  const newMsg: GuildMessage = {
    id: `msg_local_${Date.now()}`,
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    senderRole: message.senderRole || "Membro",
    text: message.text.trim(),
    timestamp: new Date().toISOString(),
    badge: message.badge,
  };

  const updated = [...current, newMsg];
  localStorage.setItem(
    GUILD_MESSAGES_STORAGE_PREFIX + guildId,
    JSON.stringify(updated)
  );

  return {
    success: true,
    message: newMsg,
    messages: updated,
  };
}

/**
 * Get active energy requests for a team
 */
export async function getGuildEnergyRequests(guildId: string): Promise<EnergyRequest[]> {
  if (!guildId) return [];

  try {
    const res = await fetch(`/api/guilds/${guildId}/energy-requests`);
    if (res.ok) {
      const data = await res.json();
      if (data.energyRequests) {
        localStorage.setItem(
          GUILD_ENERGY_REQUESTS_PREFIX + guildId,
          JSON.stringify(data.energyRequests)
        );
        return data.energyRequests;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch energy requests from server, using local cache:", e);
  }

  try {
    const local = localStorage.getItem(GUILD_ENERGY_REQUESTS_PREFIX + guildId);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.warn("Error reading local energy requests:", e);
  }

  return [];
}

/**
 * Create a new energy request for the team
 */
export async function requestGuildEnergy(
  guildId: string,
  user: UserProfile,
  requestedAmount: number = 5
): Promise<{ success: boolean; energyRequest?: EnergyRequest; energyRequests: EnergyRequest[]; message?: string }> {
  if (!guildId || !user?.email) {
    return { success: false, energyRequests: [] };
  }

  try {
    const res = await fetch(`/api/guilds/${guildId}/energy-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: user.email,
        userName: user.name,
        requestedAmount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.energyRequests) {
        localStorage.setItem(
          GUILD_ENERGY_REQUESTS_PREFIX + guildId,
          JSON.stringify(data.energyRequests)
        );
        return {
          success: true,
          energyRequest: data.energyRequest,
          energyRequests: data.energyRequests,
          message: data.message,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to create energy request on server, saving locally:", e);
  }

  // Local fallback
  const current = await getGuildEnergyRequests(guildId);
  const normEmail = user.email.toLowerCase();

  const existing = current.find(
    (r) =>
      r.userEmail.toLowerCase() === normEmail &&
      r.status === "active" &&
      new Date(r.expiresAt).getTime() > Date.now()
  );

  if (existing) {
    return {
      success: true,
      energyRequest: existing,
      energyRequests: current,
      message: "Você já possui um pedido ativo de energia!",
    };
  }

  const newReq: EnergyRequest = {
    id: `req_local_${Date.now()}`,
    guildId,
    userEmail: normEmail,
    userName: user.name,
    requestedAmount,
    receivedAmount: 0,
    donors: [],
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };

  const updated = [newReq, ...current];
  localStorage.setItem(
    GUILD_ENERGY_REQUESTS_PREFIX + guildId,
    JSON.stringify(updated)
  );

  return {
    success: true,
    energyRequest: newReq,
    energyRequests: updated,
  };
}

/**
 * Donate energy to a teammate
 */
export async function donateGuildEnergy(
  guildId: string,
  requestId: string,
  donor: UserProfile,
  amount: number = 1
): Promise<{
  success: boolean;
  energyRequest?: EnergyRequest;
  energyRequests: EnergyRequest[];
  donorXpReward?: number;
  energyDonated?: number;
  message?: string;
  error?: string;
}> {
  if (!guildId || !requestId || !donor?.email) {
    return { success: false, energyRequests: [] };
  }

  try {
    const res = await fetch(`/api/guilds/${guildId}/energy-requests/${requestId}/donate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorEmail: donor.email,
        donorName: donor.name,
        amount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.energyRequests) {
        localStorage.setItem(
          GUILD_ENERGY_REQUESTS_PREFIX + guildId,
          JSON.stringify(data.energyRequests)
        );
        return {
          success: true,
          energyRequest: data.energyRequest,
          energyRequests: data.energyRequests,
          donorXpReward: data.donorXpReward,
          energyDonated: data.energyDonated,
          message: data.message,
        };
      }
    } else {
      const errData = await res.json();
      return { success: false, energyRequests: [], error: errData.error };
    }
  } catch (e) {
    console.warn("Failed to donate energy on server, falling back locally:", e);
  }

  // Local fallback
  const current = await getGuildEnergyRequests(guildId);
  const targetReq = current.find((r) => r.id === requestId);

  if (!targetReq) {
    return { success: false, energyRequests: current, error: "Pedido não encontrado." };
  }

  if (targetReq.userEmail.toLowerCase() === donor.email.toLowerCase()) {
    return { success: false, energyRequests: current, error: "Não é possível doar para si mesmo." };
  }

  if (targetReq.status === "completed" || targetReq.receivedAmount >= targetReq.requestedAmount) {
    return { success: false, energyRequests: current, error: "Este pedido já foi concluído!" };
  }

  targetReq.receivedAmount += amount;
  if (targetReq.receivedAmount >= targetReq.requestedAmount) {
    targetReq.status = "completed";
  }

  targetReq.donors.push({
    donorEmail: donor.email,
    donorName: donor.name,
    amount,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem(
    GUILD_ENERGY_REQUESTS_PREFIX + guildId,
    JSON.stringify(current)
  );

  return {
    success: true,
    energyRequest: targetReq,
    energyRequests: current,
    donorXpReward: 25 * amount,
    energyDonated: amount,
    message: `Você doou ${amount} ⚡ para ${targetReq.userName} e ganhou +${25 * amount} XP!`,
  };
}

