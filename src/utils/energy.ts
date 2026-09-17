import { UserProfile } from "../types";

export const MAX_ENERGY = 10;
export const ENERGY_REGEN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes per 1 energy

export interface EnergyStatus {
  currentEnergy: number;
  maxEnergy: number;
  nextRechargeSeconds: number;
  lastEnergyRechargeTime: string;
  hasRegenerated: boolean;
}

/**
 * Calculates current energy and next recharge time based on elapsed intervals
 */
export function calculateEnergyStatus(user: UserProfile): EnergyStatus {
  const max = user.maxEnergy || MAX_ENERGY;
  const current = typeof user.energy === "number" ? user.energy : max;
  const lastRecharge = user.lastEnergyRechargeTime ? new Date(user.lastEnergyRechargeTime).getTime() : Date.now();
  const now = Date.now();

  if (current >= max) {
    return {
      currentEnergy: current,
      maxEnergy: max,
      nextRechargeSeconds: 0,
      lastEnergyRechargeTime: new Date(now).toISOString(),
      hasRegenerated: false,
    };
  }

  const elapsedMs = Math.max(0, now - lastRecharge);
  const unitsToRegen = Math.floor(elapsedMs / ENERGY_REGEN_INTERVAL_MS);

  if (unitsToRegen > 0) {
    const newEnergy = Math.min(max, current + unitsToRegen);
    const newLastRecharge = newEnergy >= max 
      ? new Date(now).toISOString() 
      : new Date(lastRecharge + unitsToRegen * ENERGY_REGEN_INTERVAL_MS).toISOString();

    const remainingMs = newEnergy >= max ? 0 : ENERGY_REGEN_INTERVAL_MS - (elapsedMs % ENERGY_REGEN_INTERVAL_MS);

    return {
      currentEnergy: newEnergy,
      maxEnergy: max,
      nextRechargeSeconds: Math.ceil(remainingMs / 1000),
      lastEnergyRechargeTime: newLastRecharge,
      hasRegenerated: true,
    };
  }

  const remainingMs = ENERGY_REGEN_INTERVAL_MS - elapsedMs;

  return {
    currentEnergy: current,
    maxEnergy: max,
    nextRechargeSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
    lastEnergyRechargeTime: user.lastEnergyRechargeTime || new Date(now).toISOString(),
    hasRegenerated: false,
  };
}

/**
 * Format seconds into mm:ss
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
