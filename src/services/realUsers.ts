import { UserProfile } from "../types";
import { calculateStreakFromDates } from "./streakManager";

export interface RealUser {
  email: string;
  name: string;
  level: number;
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  isCurrentUser?: boolean;
}

const STORAGE_KEY = "studyhub_real_users_registry";

/**
 * Normalizes and extracts initials from a user's name or email.
 */
export function getUserInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "ST";
}

/**
 * Retrieves all real registered users stored in localStorage and syncs with backend.
 */
export function getStoredRealUsers(currentUser?: UserProfile | null): RealUser[] {
  const usersMap = new Map<string, RealUser>();

  // 1. Check existing saved registry
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: RealUser[] = JSON.parse(saved);
      parsed.forEach((u) => {
        if (u.email) {
          usersMap.set(u.email.toLowerCase(), u);
        }
      });
    }
  } catch (e) {
    console.warn("Could not read real users registry:", e);
  }

  // 2. Scan localStorage for auth_user_* and studyhub_profile_* records
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith("auth_user_")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const authData = JSON.parse(raw);
          const email = authData.email?.toLowerCase();
          if (email) {
            const existing = usersMap.get(email);
            usersMap.set(email, {
              email,
              name: authData.name || email.split("@")[0],
              level: existing?.level || 1,
              xp: existing?.xp || 0,
              streakDays: existing?.streakDays || 1,
              lastActiveDate: authData.createdAt || new Date().toISOString(),
            });
          }
        }
      } else if (key.startsWith("studyhub_profile_")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const prof = JSON.parse(raw);
          const email = prof.email?.toLowerCase();
          if (email) {
            const existing = usersMap.get(email);
            usersMap.set(email, {
              email,
              name: prof.name || email.split("@")[0],
              level: prof.level || existing?.level || 1,
              xp: prof.xp || existing?.xp || 0,
              streakDays: prof.streakDays || existing?.streakDays || 1,
              lastActiveDate: prof.lastActiveDate || new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Error scanning real user accounts:", e);
  }

  // 3. Include current active user
  if (currentUser && currentUser.email) {
    const email = currentUser.email.toLowerCase();
    usersMap.set(email, {
      email,
      name: currentUser.name || email.split("@")[0],
      level: currentUser.level || 1,
      xp: currentUser.xp || 0,
      streakDays: currentUser.streakDays || 1,
      lastActiveDate: currentUser.lastActiveDate || new Date().toISOString(),
      isCurrentUser: true,
    });
  }

  const list = Array.from(usersMap.values()).map((u) => ({
    ...u,
    isCurrentUser: currentUser?.email?.toLowerCase() === u.email.toLowerCase(),
  }));

  // Save back to registry
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to persist real users registry:", e);
  }

  return list;
}

/**
 * Synchronizes user data with the server backend.
 */
export async function syncRealUserWithServer(user: UserProfile): Promise<RealUser[]> {
  try {
    const payload = {
      email: user.email.toLowerCase(),
      name: user.name,
      level: user.level,
      xp: user.xp,
      streakDays: user.streakDays,
      lastActiveDate: user.lastActiveDate,
    };

    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
        return data.users.map((u: RealUser) => ({
          ...u,
          isCurrentUser: u.email.toLowerCase() === user.email.toLowerCase(),
        }));
      }
    }
  } catch (e) {
    console.warn("Failed to sync real user with server:", e);
  }

  return getStoredRealUsers(user);
}
