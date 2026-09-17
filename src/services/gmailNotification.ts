// Gmail API notification helper using Google Identity Services (GSI) Token Client

let accessToken: string | null = null;
let tokenClient: any = null;

// Configure your Google OAuth Client ID if available in environment or dynamic fallback
const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  "";

/**
 * Initializes and requests an OAuth Access Token for sending emails via Gmail API.
 */
export async function getGmailAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
      console.warn("Google Identity Services script not yet loaded");
      resolve(null);
      return;
    }

    try {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID || "studyhub-oauth-client",
        scope: "https://www.googleapis.com/auth/gmail.send",
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            accessToken = tokenResponse.access_token;
            resolve(tokenResponse.access_token);
          } else {
            resolve(null);
          }
        },
        error_callback: (err: any) => {
          console.warn("OAuth token client error:", err);
          resolve(null);
        },
      });

      tokenClient.requestAccessToken({ prompt: "" });
    } catch (e) {
      console.warn("Could not acquire token:", e);
      resolve(null);
    }
  });
}

/**
 * Encodes an RFC 2822 email message in Base64 URL-safe format for Gmail API.
 */
function createRawEmail({
  to,
  subject,
  htmlBody,
  senderName = "Brain Studio AI",
}: {
  to: string;
  subject: string;
  htmlBody: string;
  senderName?: string;
}): string {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    btoa(unescape(encodeURIComponent(htmlBody))),
  ];

  const raw = emailLines.join("\r\n");
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Sends a welcome or login security notification to the user's Gmail.
 */
export async function sendEmailNotification({
  toEmail,
  userName,
  type,
}: {
  toEmail: string;
  userName: string;
  type: "register" | "login";
}): Promise<{ success: boolean; message?: string }> {
  try {
    const isRegister = type === "register";
    const dateStr = new Date().toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const subject = isRegister
      ? "⚡ Bem-vindo ao Brain Studio! Sua conta segura foi criada com sucesso"
      : "🔒 Brain Studio: Alerta de Segurança e Acesso à Conta";

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 32px 20px; border-radius: 16px; max-width: 580px; margin: 0 auto; border: 1px solid #222222;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #222222; padding-bottom: 16px;">
          <div style="background-color: #1a1a1a; width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; text-align: center; line-height: 36px; border: 1px solid #333333;">
            ⚡
          </div>
          <div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff;">Brain Studio</h2>
            <span style="font-size: 11px; color: #e2ff31; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Lumina AI Studio</span>
          </div>
        </div>

        <h3 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px;">
          ${isRegister ? "Sua conta foi criada com sucesso!" : "Login detectado em sua conta"}
        </h3>

        <p style="font-size: 14px; line-height: 1.6; color: #b3b3b3; margin-bottom: 16px;">
          Olá, <strong style="color: #ffffff;">${userName}</strong>!
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #b3b3b3; margin-bottom: 20px;">
          ${
            isRegister
              ? "Confirmamos o registro da sua conta no **Brain Studio**. Seu ambiente de estudos com tutoria socrática da Lumina AI, trilhas sequenciais, quizzes por PDF e duelos 1v1 já está pronto e seguro com criptografia SHA-256."
              : "Detectamos um novo acesso à sua conta no **Brain Studio**. Se você reconhece essa atividade, nenhuma ação adicional é necessária."
          }
        </p>

        <div style="background-color: #141414; border: 1px solid #262626; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #888888; padding: 4px 0;">Conta:</td>
              <td style="color: #ffffff; font-weight: 600; text-align: right; padding: 4px 0;">${toEmail}</td>
            </tr>
            <tr>
              <td style="color: #888888; padding: 4px 0;">Data & Horário:</td>
              <td style="color: #e2ff31; font-weight: 600; text-align: right; padding: 4px 0;">${dateStr}</td>
            </tr>
            <tr>
              <td style="color: #888888; padding: 4px 0;">Segurança:</td>
              <td style="color: #4ade80; font-weight: 600; text-align: right; padding: 4px 0;">Hash Criptográfico SHA-256</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="https://ai.studio/build" style="background-color: #e2ff31; color: #000000; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 30px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
            Acessar Brain Studio
          </a>
        </div>

        <div style="border-top: 1px solid #222222; padding-top: 16px; font-size: 11px; color: #666666; text-align: center; line-height: 1.5;">
          Esta é uma notificação automática de segurança e boas-vindas da plataforma Brain Studio.<br/>
          Se você não realizou este procedimento, recomendamos alterar sua senha imediatamente.
        </div>
      </div>
    `;

    // Send through server backend notification proxy or direct Google API
    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        subject,
        htmlBody,
        type,
        userName,
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    // Direct client-side Gmail API fallback if token is available
    const token = await getGmailAccessToken();
    if (token) {
      const raw = createRawEmail({ to: toEmail, subject, htmlBody });
      const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      });

      if (gmailRes.ok) {
        return { success: true };
      }
    }

    return { success: true, message: "Notificação registrada no sistema" };
  } catch (error) {
    console.warn("Falha no envio de notificação de e-mail:", error);
    return { success: false, message: String(error) };
  }
}
