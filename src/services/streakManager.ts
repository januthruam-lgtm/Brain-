import { UserProfile } from "../types";

/**
 * Returns a date string formatted as YYYY-MM-DD in local time.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date string formatted as YYYY-MM-DD for N days in the past.
 */
export function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateString(d);
}

/**
 * Accurately calculates the consecutive daily streak based on real calendar days.
 */
export function calculateStreakFromDates(activeDates: string[]): number {
  if (!activeDates || activeDates.length === 0) {
    return 1;
  }

  const cleanDates = Array.from(
    new Set(
      activeDates
        .filter(Boolean)
        .map((d) => (d.length > 10 ? d.slice(0, 10) : d))
    )
  );

  const datesSet = new Set(cleanDates);
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getPastDateString(1);

  let streak = 0;

  if (datesSet.has(todayStr)) {
    // Active today: count today (1) + consecutive previous days
    streak = 1;
    let daysBack = 1;
    while (datesSet.has(getPastDateString(daysBack))) {
      streak++;
      daysBack++;
    }
  } else if (datesSet.has(yesterdayStr)) {
    // Active yesterday: count yesterday (1) + consecutive previous days
    streak = 1;
    let daysBack = 2;
    while (datesSet.has(getPastDateString(daysBack))) {
      streak++;
      daysBack++;
    }
  } else {
    // No recent activity in today or yesterday, resets to 1 upon current access
    streak = 1;
  }

  return Math.max(1, streak);
}

/**
 * Synchronizes and updates the real daily activity record for the user.
 */
export function syncAndCalculateUserStreak(
  email: string,
  currentProfile?: Partial<UserProfile>
): { streakDays: number; activeDates: string[]; lastActiveDate: string } {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      streakDays: 1,
      activeDates: [getLocalDateString()],
      lastActiveDate: new Date().toISOString(),
    };
  }

  const storageKey = `studyhub_active_dates_${normalizedEmail}`;
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getPastDateString(1);

  let activeDates: string[] = [];

  try {
    const savedDates = localStorage.getItem(storageKey);
    if (savedDates) {
      activeDates = JSON.parse(savedDates);
    }
  } catch (e) {
    console.warn("Could not read active dates storage:", e);
  }

  if (currentProfile?.activeDates && Array.isArray(currentProfile.activeDates)) {
    activeDates = [...activeDates, ...currentProfile.activeDates];
  }

  // Check user registration date from auth_user_*
  try {
    const authRaw = localStorage.getItem(`auth_user_${normalizedEmail}`);
    if (authRaw) {
      const authData = JSON.parse(authRaw);
      if (authData.createdAt) {
        const createdDateStr = authData.createdAt.slice(0, 10);
        if (createdDateStr && createdDateStr <= todayStr) {
          activeDates.push(createdDateStr);
        }
      }
    }
  } catch (e) {
    console.warn("Could not check auth creation date:", e);
  }

  // Check lastActiveDate from profile
  if (currentProfile?.lastActiveDate) {
    const lastStr = currentProfile.lastActiveDate.slice(0, 10);
    if (lastStr && lastStr <= todayStr) {
      activeDates.push(lastStr);
    }
  }

  // If user entered yesterday or prior, ensure yesterday is recorded if account existed
  if (currentProfile?.createdAt) {
    const createdStr = currentProfile.createdAt.slice(0, 10);
    if (createdStr === yesterdayStr) {
      activeDates.push(yesterdayStr);
    }
  }

  // Record today's visit
  activeDates.push(todayStr);

  // Deduplicate and sort dates
  const uniqueDates = Array.from(new Set(activeDates.filter(Boolean))).sort();

  // Calculate real consecutive days streak
  const streakDays = calculateStreakFromDates(uniqueDates);

  // Persist updated dates
  try {
    localStorage.setItem(storageKey, JSON.stringify(uniqueDates));
  } catch (e) {
    console.warn("Could not save active dates storage:", e);
  }

  return {
    streakDays,
    activeDates: uniqueDates,
    lastActiveDate: new Date().toISOString(),
  };
}
