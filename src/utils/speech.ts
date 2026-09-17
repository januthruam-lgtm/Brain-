// Speech synthesis and recognition utility with robust browser fallback

export function speakText(text: string, enabled: boolean = true): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances
    // Remove markdown formatting like **, ##, etc. for cleaner speech
    const cleanText = text
      .replace(/[*#_`~>[\]]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try finding a natural pt-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") || v.lang === "pt_BR" || v.lang === "pt-PT");
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeechRecognitionWrapper {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError?: (error: any) => void,
  onEnd?: () => void
): SpeechRecognitionWrapper {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Speech recognition already running or failed to start", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        // silent
      }
    },
    isSupported: true,
  };
}
