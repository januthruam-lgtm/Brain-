import React, { useState, useEffect } from "react";
import { Sidebar, TabId } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { LessonModal } from "./components/LessonModal";
import { SubjectSelectionModal } from "./components/SubjectSelectionModal";
import { EnergyModal } from "./components/EnergyModal";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { SocraticTutorTab } from "./components/tabs/SocraticTutorTab";
import { SequenceTrackTab } from "./components/tabs/SequenceTrackTab";
import { PdfGameGeneratorTab } from "./components/tabs/PdfGameGeneratorTab";
import { GuildsBattlesTab } from "./components/tabs/GuildsBattlesTab";
import { StoreTab } from "./components/tabs/StoreTab";
import { MascoteLabTab } from "./components/tabs/MascoteLabTab";
import { ColorsTab } from "./components/tabs/ColorsTab";
import { AcademicManagementTab } from "./components/tabs/AcademicManagementTab";
import {
  UserProfile,
  TrackModule,
  ThemeId,
  GuildInfo,
  SubjectItem,
  CustomThemeConfig,
  PetData,
  StoreItem,
} from "./types";
import { INITIAL_USER, TRACK_MODULES, GUILDS_LIST } from "./data/initialData";
import { DEFAULT_IFES_SUBJECTS } from "./data/mockAvaCourses";
import { speakText, stopSpeaking } from "./utils/speech";
import { syncRealUserWithServer } from "./services/realUsers";
import { generateTrackForSubjects } from "./services/subjectTrackGenerator";
import { syncAndCalculateUserStreak } from "./services/streakManager";
import { getGuildsList } from "./services/guildService";
import { applyThemeToDOM } from "./utils/theme";
import {
  triggerCoinExplosion,
  playCoinCascade,
  playLevelUpSound,
  playCoinSound,
} from "./utils/audio";
import confetti from "canvas-confetti";
import { Download, Share, PlusSquare, X } from "lucide-react";

export default function App() {
  // Check if a verified user session exists
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    try {
      const active = localStorage.getItem("studyhub_active_user_email");
      if (active && active.includes("@")) return active.toLowerCase();
      const last = localStorage.getItem("studyhub_last_email");
      if (last && last.includes("@")) {
        localStorage.setItem("studyhub_active_user_email", last.toLowerCase());
        return last.toLowerCase();
      }
    } catch (e) {
      console.warn(e);
    }
    return null;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const activeEmail = localStorage.getItem("studyhub_active_user_email");
      if (activeEmail) {
        const saved = localStorage.getItem("studyhub_profile_" + activeEmail.toLowerCase());
        if (saved) {
          const parsed = JSON.parse(saved);
          const streakInfo = syncAndCalculateUserStreak(activeEmail, parsed);
          return {
            ...parsed,
            streakDays: streakInfo.streakDays,
            activeDates: streakInfo.activeDates,
            lastActiveDate: streakInfo.lastActiveDate,
          };
        }
        const streakInfo = syncAndCalculateUserStreak(activeEmail);
        return {
          ...INITIAL_USER,
          email: activeEmail,
          name: activeEmail.split("@")[0],
          streakDays: streakInfo.streakDays,
          activeDates: streakInfo.activeDates,
          lastActiveDate: streakInfo.lastActiveDate,
        };
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_USER;
  });

  const [modules, setModules] = useState<TrackModule[]>(() => {
    try {
      const activeEmail = localStorage.getItem("studyhub_active_user_email");
      if (activeEmail) {
        const saved = localStorage.getItem("studyhub_modules_" + activeEmail.toLowerCase());
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return TRACK_MODULES;
  });

  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    try {
      const activeEmail = localStorage.getItem("studyhub_active_user_email");
      if (activeEmail) {
        const saved = localStorage.getItem("studyhub_subjects_" + activeEmail.toLowerCase());
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_IFES_SUBJECTS;
  });

  const [currentTab, setCurrentTab] = useState<TabId>("dashboard");
  const [isAuthOpen, setIsAuthOpen] = useState(() => {
    return !localStorage.getItem("studyhub_active_user_email");
  });
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeLessonModule, setActiveLessonModule] = useState<TrackModule | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guildsList, setGuildsList] = useState<GuildInfo[]>(GUILDS_LIST);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstallable, setPwaInstallable] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  // PWA beforeinstallprompt Listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detect iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isIos && !isStandalone) {
      setPwaInstallable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setShowIosInstallModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setPwaInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("Para instalar o app, use a opção 'Adicionar à Tela de Início' no menu do seu navegador.");
    }
  };

  // Gamified Coin & XP Handlers
  const handleRewardCoins = (amount: number, event?: React.MouseEvent) => {
    const hudMoedas = document.getElementById("hud-moedas-container");
    if (hudMoedas) {
      hudMoedas.classList.remove("balancar-hud");
      void hudMoedas.offsetWidth; // Trigger reflow
      hudMoedas.classList.add("balancar-hud");
    }

    setUser((prev) => {
      const newCoins = (prev.coins ?? 250) + amount;
      const updated = { ...prev, coins: newCoins };
      try {
        if (currentUserEmail) {
          localStorage.setItem("studyhub_profile_" + currentUserEmail, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    playCoinCascade(6);
    speakText(`Parabéns! ${amount} moedas adicionadas ao seu saldo!`, false);
  };

  const handleRewardXp = (amount: number) => {
    setUser((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 200) + 1;
      const leveledUp = newLevel > (prev.level || 1);

      if (leveledUp) {
        playLevelUpSound();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        speakText(`Sensacional! Você atingiu o Nível ${newLevel}!`, true);
      }

      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
      };

      try {
        if (currentUserEmail) {
          localStorage.setItem("studyhub_profile_" + currentUserEmail, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleUpgradeEnergyLimitWithCoins = () => {
    const currentLevel = user.level || 1;
    const upgradeCost = Math.floor(100 * Math.pow(1.15, currentLevel - 1));
    const currentCoins = user.coins ?? 250;

    if (currentCoins < upgradeCost) {
      alert(`Moedas insuficientes! Você precisa de ${upgradeCost} 🪙 para este upgrade.`);
      return;
    }

    setUser((prev) => {
      const updated = {
        ...prev,
        coins: (prev.coins ?? 250) - upgradeCost,
        maxEnergy: (prev.maxEnergy ?? 10) + 10,
        energy: (prev.energy ?? 10) + 10,
      };
      try {
        if (currentUserEmail) {
          localStorage.setItem("studyhub_profile_" + currentUserEmail, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    playCoinCascade(8);
    confetti({ particleCount: 90, spread: 70 });
    speakText("Capacidade máxima de energia aumentada em 10 pontos!", false);
  };

  // Apply visual theme to DOM in real-time
  useEffect(() => {
    applyThemeToDOM(user.activeTheme, user.customThemeConfig);
  }, [user.activeTheme, user.customThemeConfig]);

  // Load and synchronize guilds
  useEffect(() => {
    getGuildsList(user.email).then((list) => {
      setGuildsList(list);
    });
  }, [user.email, user.guildId]);

  // Synchronize streak based on real calendar days for active connected user
  useEffect(() => {
    if (!currentUserEmail) return;

    const streakInfo = syncAndCalculateUserStreak(currentUserEmail, user);
    if (
      user.streakDays !== streakInfo.streakDays ||
      user.activeDates?.length !== streakInfo.activeDates.length
    ) {
      setUser((prev) => ({
        ...prev,
        streakDays: streakInfo.streakDays,
        activeDates: streakInfo.activeDates,
        lastActiveDate: streakInfo.lastActiveDate,
      }));
    }
  }, [currentUserEmail]);

  // Sync user profile strictly to the connected user's email key
  useEffect(() => {
    if (currentUserEmail && user.email) {
      const emailKey = currentUserEmail.toLowerCase();
      localStorage.setItem("studyhub_profile_" + emailKey, JSON.stringify(user));
      localStorage.setItem("studyhub_active_user_email", emailKey);
      syncRealUserWithServer(user).catch(console.warn);
    }
  }, [user, currentUserEmail]);

  // Sync modules strictly to the connected user's email key
  useEffect(() => {
    if (currentUserEmail) {
      const emailKey = currentUserEmail.toLowerCase();
      localStorage.setItem("studyhub_modules_" + emailKey, JSON.stringify(modules));
    }
  }, [modules, currentUserEmail]);

  // Sync academic subjects strictly to the connected user's email key
  useEffect(() => {
    if (currentUserEmail) {
      const emailKey = currentUserEmail.toLowerCase();
      localStorage.setItem("studyhub_subjects_" + emailKey, JSON.stringify(subjects));
    }
  }, [subjects, currentUserEmail]);

  // Level calculator
  const calculateLevel = (xp: number) => {
    return Math.max(1, Math.floor(xp / 100) + 1);
  };

  const handleCompleteLesson = (moduleId: number, earnedXp: number) => {
    setUser((prev) => {
      const newCompleted = prev.completedModules.includes(moduleId)
        ? prev.completedModules
        : [...prev.completedModules, moduleId];
      const newXp = prev.xp + earnedXp;
      const newLevel = calculateLevel(newXp);

      return {
        ...prev,
        completedModules: newCompleted,
        xp: newXp,
        level: newLevel,
      };
    });

    // Update modules list status
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === moduleId) {
          return { ...m, status: "completed" };
        }
        if (m.id === moduleId + 1) {
          return { ...m, status: "active" };
        }
        return m;
      })
    );

    // Update subject completed tasks
    setSubjects((prev) =>
      prev.map((s) => {
        const hasModule = s.modules?.some((mod) => mod.id === moduleId);
        if (hasModule) {
          const newDone = Math.min(s.totalTasks, (s.completedTasks || 0) + 1);
          return {
            ...s,
            completedTasks: newDone,
            progressPercentage: Math.round((newDone / s.totalTasks) * 100),
          };
        }
        return s;
      })
    );

    if (voiceEnabled) {
      speakText(
        `Parabéns! Módulo concluído com sucesso. Mais ${earnedXp} XP adicionados à sua conta!`,
        true
      );
    }
  };

  // Theme Management
  const handleSelectTheme = (themeId: ThemeId) => {
    setUser((prev) => ({
      ...prev,
      activeTheme: themeId,
    }));
  };

  const handleSaveCustomTheme = (theme: CustomThemeConfig) => {
    setUser((prev) => ({
      ...prev,
      activeTheme: "custom",
      customThemeConfig: theme,
    }));
    speakText("Paleta de cores personalizada aplicada com sucesso!", false);
  };

  const handleBuyTheme = (themeId: ThemeId, cost: number) => {
    setUser((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - cost),
      unlockedThemes: prev.unlockedThemes.includes(themeId)
        ? prev.unlockedThemes
        : [...prev.unlockedThemes, themeId],
      activeTheme: themeId,
    }));
  };

  const handleEquipTheme = (themeId: ThemeId) => {
    setUser((prev) => ({
      ...prev,
      activeTheme: themeId,
    }));
  };

  const handleBuyBadge = (badgeId: string, cost: number) => {
    setUser((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - cost),
      unlockedBadges: prev.unlockedBadges.includes(badgeId)
        ? prev.unlockedBadges
        : [...prev.unlockedBadges, badgeId],
      equippedBadge: badgeId,
    }));
  };

  const handleEquipBadge = (badgeId: string) => {
    setUser((prev) => ({
      ...prev,
      equippedBadge: badgeId,
    }));
  };

  // Pet Feeding & Evolution (Exponential Curve)
  const handleFeedPet = (foodItem: StoreItem) => {
    if (user.xp < foodItem.cost) {
      alert("XP insuficiente para comprar esta ração/elixir!");
      return;
    }

    const currentPet = user.pet || {
      name: "Socrates",
      level: 1,
      xp: 0,
      xpToNextLevel: 50,
      happiness: 80,
      hunger: 40,
      mood: "happy",
    };

    const addedPetXp = foodItem.petXpAmount || 25;
    const addedHappiness = foodItem.petHappinessAmount || 20;

    let newPetXp = currentPet.xp + addedPetXp;
    let newPetLevel = currentPet.level;
    let newXpToNext = currentPet.xpToNextLevel;

    // Exponential evolution calculation: 50 * (2 ** (level - 1))
    while (newPetXp >= newXpToNext) {
      newPetXp -= newXpToNext;
      newPetLevel += 1;
      newXpToNext = 50 * Math.pow(2, newPetLevel - 1);

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
      speakText(`Incrível! Seu mascote ${currentPet.name} evoluiu para o Nível ${newPetLevel}!`, true);
    }

    const updatedPet: PetData = {
      ...currentPet,
      xp: newPetXp,
      level: newPetLevel,
      xpToNextLevel: newXpToNext,
      happiness: Math.min(100, currentPet.happiness + addedHappiness),
      hunger: Math.max(0, currentPet.hunger - 30),
      mood: "excited",
    };

    setUser((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - foodItem.cost),
      pet: updatedPet,
    }));
  };

  const handleUpdatePet = (petData: Partial<PetData>) => {
    setUser((prev) => ({
      ...prev,
      pet: {
        ...(prev.pet || {
          name: "Socrates",
          level: 1,
          xp: 0,
          xpToNextLevel: 50,
          happiness: 80,
          hunger: 40,
          mood: "happy",
        }),
        ...petData,
      },
    }));
  };

  // Energy Handlers
  const handleBuyEnergy = (amount: number, cost: number) => {
    const maxEnergy = user.maxEnergy ?? 10;
    const currentEnergy = user.energy ?? 10;

    if (currentEnergy >= maxEnergy) return;
    if (user.xp < cost) return;

    setUser((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - cost),
      energy: Math.min(maxEnergy, (prev.energy ?? 10) + amount),
    }));
  };

  const handleUpgradeMaxEnergy = (amount: number, cost: number) => {
    if (user.xp < cost) return;
    setUser((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp - cost),
      maxEnergy: (prev.maxEnergy ?? 10) + amount,
      energy: (prev.energy ?? 10) + amount,
    }));
  };

  const handleLogin = (email: string, name?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setCurrentUserEmail(normalizedEmail);
    localStorage.setItem("studyhub_active_user_email", normalizedEmail);
    localStorage.setItem("studyhub_last_email", normalizedEmail);

    try {
      const userKey = "studyhub_profile_" + normalizedEmail;
      const modulesKey = "studyhub_modules_" + normalizedEmail;
      const subjectsKey = "studyhub_subjects_" + normalizedEmail;

      const existingProfile = localStorage.getItem(userKey);
      if (existingProfile) {
        const parsed = JSON.parse(existingProfile);
        const streakInfo = syncAndCalculateUserStreak(normalizedEmail, parsed);
        const updatedProfile: UserProfile = {
          ...parsed,
          streakDays: streakInfo.streakDays,
          activeDates: streakInfo.activeDates,
          lastActiveDate: streakInfo.lastActiveDate,
        };
        setUser(updatedProfile);
        localStorage.setItem(userKey, JSON.stringify(updatedProfile));
      } else {
        const streakInfo = syncAndCalculateUserStreak(normalizedEmail);
        const freshProfile: UserProfile = {
          ...INITIAL_USER,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          xp: 0,
          level: 1,
          streakDays: streakInfo.streakDays,
          activeDates: streakInfo.activeDates,
          lastActiveDate: streakInfo.lastActiveDate,
          completedModules: [],
        };
        setUser(freshProfile);
        localStorage.setItem(userKey, JSON.stringify(freshProfile));
      }

      // Load user-specific track modules
      const existingModules = localStorage.getItem(modulesKey);
      if (existingModules) {
        setModules(JSON.parse(existingModules));
      } else {
        setModules(TRACK_MODULES);
        localStorage.setItem(modulesKey, JSON.stringify(TRACK_MODULES));
      }

      // Load user-specific subjects
      const existingSubjects = localStorage.getItem(subjectsKey);
      if (existingSubjects) {
        setSubjects(JSON.parse(existingSubjects));
      } else {
        setSubjects([]);
      }
    } catch {
      setUser((prev) => ({
        ...prev,
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
      }));
    }
    setIsAuthOpen(false);
  };

  const handleSaveSubjects = async (selectedSubjs: string[], goal: string) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        selectedSubjects: selectedSubjs,
      };
      if (currentUserEmail) {
        localStorage.setItem(
          "studyhub_profile_" + currentUserEmail.toLowerCase(),
          JSON.stringify(updated)
        );
      }
      return updated;
    });

    const newTrack = await generateTrackForSubjects(selectedSubjs, goal);
    setModules(newTrack);

    if (currentUserEmail) {
      localStorage.setItem(
        "studyhub_modules_" + currentUserEmail.toLowerCase(),
        JSON.stringify(newTrack)
      );
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    if (voiceEnabled) {
      speakText(
        `Excelente escolha! Criamos sua nova trilha de aprendizado para ${selectedSubjs
          .slice(0, 2)
          .join(" e ")}. Bons estudos!`,
        true
      );
    }
  };

  const handleLogout = () => {
    setCurrentUserEmail(null);
    localStorage.removeItem("studyhub_active_user_email");
    setUser(INITIAL_USER);
    setModules(TRACK_MODULES);
    setSubjects([]);
    setIsAuthOpen(true);
  };

  const userGuild =
    guildsList.find((g) => g.id === user.guildId || g.isUserGuild) ||
    guildsList.find((g) =>
      g.members?.some((m) => m.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    undefined;

  const handleUpdateUserProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const nextUser = {
        ...prev,
        ...updated,
      };
      if (currentUserEmail) {
        localStorage.setItem(
          "studyhub_profile_" + currentUserEmail.toLowerCase(),
          JSON.stringify(nextUser)
        );
      }
      return nextUser;
    });
  };

  return (
    <div
      id="app-body"
      className="h-screen flex font-sans overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: "var(--color-bg-main, #F8F7F2)",
        color: "var(--color-text-primary, #1A202C)",
      }}
    >
      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={currentUserEmail ? () => setIsAuthOpen(false) : undefined}
        onLogin={handleLogin}
      />

      {/* Energy Modal */}
      <EnergyModal
        isOpen={isEnergyModalOpen}
        onClose={() => setIsEnergyModalOpen(false)}
        user={user}
        onNavigateTab={(tab) => {
          setIsEnergyModalOpen(false);
          setCurrentTab(tab);
        }}
        onRefillWithXp={(amount, cost) => {
          handleBuyEnergy(amount, cost);
          return true;
        }}
      />

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          stopSpeaking();
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <main
        className="flex-1 flex flex-col h-full overflow-y-auto relative transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-main, #F8F7F2)",
          color: "var(--text-primary, #1A202C)",
        }}
      >
        {/* App Header */}
        <Header
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            stopSpeaking();
          }}
          user={user}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          onOpenEnergyModal={() => setIsEnergyModalOpen(true)}
        />

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto">
          {currentTab === "dashboard" && (
            <DashboardTab
              user={user}
              modules={modules}
              guild={userGuild}
              onNavigate={(tab) => {
                setCurrentTab(tab);
                stopSpeaking();
              }}
              onOpenActiveLesson={() => {
                const active =
                  modules.find((m) => m.status === "active") || modules[1] || modules[0];
                setActiveLessonModule(active);
              }}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
              onRewardXp={handleRewardXp}
              onRewardCoins={handleRewardCoins}
              onUpgradeEnergyLimit={handleUpgradeEnergyLimitWithCoins}
              onInstallPwa={handleInstallPwa}
              pwaInstallable={pwaInstallable}
              onUpdateUser={handleUpdateUserProfile}
            />
          )}

          {currentTab === "academic" && (
            <AcademicManagementTab
              user={user}
              subjects={subjects}
              onUpdateUserProfile={handleUpdateUserProfile}
              onUpdateSubjects={setSubjects}
              onUpdateModules={setModules}
              onNavigateToTrack={() => setCurrentTab("sequence")}
              onRewardXp={handleRewardXp}
              onRewardCoins={handleRewardCoins}
              onNavigateToLumina={(subjectName) => {
                setCurrentTab("lumina");
              }}
              onNavigateToGuilds={() => setCurrentTab("guilds")}
            />
          )}

          {currentTab === "sequence" && (
            <SequenceTrackTab
              modules={modules}
              user={user}
              onOpenLesson={(mod) => setActiveLessonModule(mod)}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            />
          )}

          {currentTab === "lumina" && (
            <SocraticTutorTab
              user={user}
              voiceEnabled={voiceEnabled}
              onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
              onRewardXp={handleRewardXp}
            />
          )}

          {currentTab === "mascot" && (
            <MascoteLabTab
              user={user}
              onUpdatePet={handleUpdatePet}
              onRewardXp={handleRewardXp}
              onNavigateToStore={() => setCurrentTab("store")}
              voiceEnabled={voiceEnabled}
            />
          )}

          {currentTab === "games" && (
            <PdfGameGeneratorTab onRewardXp={handleRewardXp} />
          )}

          {currentTab === "guilds" && (
            <GuildsBattlesTab
              user={user}
              onRewardXp={handleRewardXp}
              onUpdateUser={handleUpdateUserProfile}
            />
          )}

          {currentTab === "store" && (
            <StoreTab
              user={user}
              onBuyTheme={handleBuyTheme}
              onEquipTheme={handleEquipTheme}
              onBuyBadge={handleBuyBadge}
              onEquipBadge={handleEquipBadge}
              onBuyEnergy={handleBuyEnergy}
              onBuyPetFood={handleFeedPet}
              onUpgradeMaxEnergy={handleUpgradeMaxEnergy}
            />
          )}

          {currentTab === "colors" && (
            <ColorsTab
              user={user}
              onSelectTheme={handleSelectTheme}
              onSaveCustomTheme={handleSaveCustomTheme}
              onUpdateTheme={(themeId, config) => {
                setUser((prev) => ({
                  ...prev,
                  activeTheme: themeId,
                  customThemeConfig: config || prev.customThemeConfig,
                }));
              }}
            />
          )}
        </div>
      </main>

      {/* Subject Selection Interactive Modal */}
      <SubjectSelectionModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        currentSubjects={user.selectedSubjects}
        onSaveSubjects={handleSaveSubjects}
        forceSelection={!user.selectedSubjects || user.selectedSubjects.length === 0}
      />

      {/* Interactive Lesson Modal */}
      {activeLessonModule && (
        <LessonModal
          module={activeLessonModule}
          isOpen={!!activeLessonModule}
          onClose={() => setActiveLessonModule(null)}
          onComplete={handleCompleteLesson}
          onRewardXp={handleRewardXp}
          onAskLumina={(question) => {
            setCurrentTab("lumina");
          }}
        />
      )}

      {/* Modal Instruções iOS PWA */}
      {showIosInstallModal && (
        <div
          id="modal-ios-pwa"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowIosInstallModal(false)}
        >
          <div
            className="bg-[#111111] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffe600]">
                  Instalação no iPhone / iPad
                </span>
                <h3 className="text-xl font-bold tracking-tight">
                  Instalar Brain Studio
                </h3>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300">
              <div className="flex items-start gap-3 p-3 bg-neutral-900 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block">1. Toque no botão de Compartilhar</strong>
                  <span>Na barra inferior do Safari, clique no ícone de compartilhamento (quadrado com seta para cima).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-neutral-900 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block">2. Adicionar à Tela de Início</strong>
                  <span>Role para baixo e selecione a opção "Adicionar à Tela de Início".</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-neutral-900 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                  <span className="text-base font-bold">3</span>
                </div>
                <div>
                  <strong className="text-white block">3. Confirmar</strong>
                  <span>Toque em "Adicionar" no canto superior direito para desfrutar da experiência em tela cheia!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="btn-acao-principal w-full py-3 text-xs font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
