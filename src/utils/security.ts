// Helper to hash passwords using standard Web Crypto SHA-256
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  feedback: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (password.length >= 12 && score >= 3) {
    score = 4;
  }

  const levels: Record<number, { label: string; color: string; feedback: string }> = {
    0: { label: "Muito Fraca", color: "bg-red-500", feedback: "Crie uma senha com pelo menos 8 caracteres." },
    1: { label: "Fraca", color: "bg-orange-500", feedback: "Adicione letras maiúsculas e minúsculas." },
    2: { label: "Média", color: "bg-amber-400", feedback: "Adicione números para reforçar." },
    3: { label: "Forte", color: "bg-lime-400", feedback: "Adicione caracteres especiais (@, #, $, !)." },
    4: { label: "Excelente (Segura)", color: "bg-[#e2ff31]", feedback: "Sua senha atende a todos os critérios de segurança!" },
  };

  const levelInfo = levels[score] || levels[0];

  return {
    score,
    label: levelInfo.label,
    color: levelInfo.color,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    feedback: levelInfo.feedback,
  };
}
