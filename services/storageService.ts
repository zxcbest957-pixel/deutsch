import { UserProgress, SavedWord, VocabularyItem, GermanLevel, DailyMission, MistakeRecord, QuizQuestion, Achievement } from '../types';

const STORAGE_KEY = 'deutsch_meister_progress_v1';

const DEFAULT_MISSIONS: DailyMission[] = [
  { id: 'chat_msg', label: 'Написати 5 повідомлень у чаті', target: 5, progress: 0, completed: false, xpReward: 30 },
  { id: 'quiz_done', label: 'Пройти 1 граматичний тест', target: 1, progress: 0, completed: false, xpReward: 50 },
  { id: 'word_saved', label: 'Зберегти 3 нових слова', target: 3, progress: 0, completed: false, xpReward: 20 },
  { id: 'pronunciation_practice', label: 'Тренувати вимову (3 рази)', target: 3, progress: 0, completed: false, xpReward: 40 },
];

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlocked'>[] = [
  { id: 'first_step', title: 'Перший крок', description: 'Заробіть перші 100 XP', icon: '🚀', condition: (p) => p.xp >= 100 },
  { id: 'word_collector', title: 'Колекціонер слів', description: 'Збережіть 10 слів у словник', icon: '📚', condition: (p) => p.savedWords.length >= 10 },
  { id: 'grammar_guru', title: 'Граматичний Гуру', description: 'Пройдіть 5 граматичних тем', icon: '🧠', condition: (p) => p.completedTopics.length >= 5 },
  { id: 'streak_master', title: 'У вогні', description: 'Досягніть стріку в 3 дні', icon: '🔥', condition: (p) => p.streak >= 3 },
  { id: 'chatty', title: 'Базіка', description: 'Напишіть достатньо повідомлень (XP > 500)', icon: '💬', condition: (p) => p.xp >= 500 },
  { id: 'perfectionist', title: 'Перфекціоніст', description: 'Виправте 5 помилок з Банку Помилок', icon: '✨', condition: (p) => p.mistakes.length === 0 && p.xp > 200 } // Dynamic check approximation
];

const INITIAL_STATE: UserProgress = {
  xp: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedTopics: [],
  savedWords: [],
  dailyMissions: [...DEFAULT_MISSIONS],
  missionDate: new Date().toISOString().split('T')[0],
  mistakes: [],
  unlockedAchievements: []
};

export const getProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATE;
    const parsed = JSON.parse(stored);
    
    // Check if we need to reset missions (new day)
    const today = new Date().toISOString().split('T')[0];
    if (parsed.missionDate !== today) {
      const resetMissions = DEFAULT_MISSIONS.map(m => ({...m}));
      const newState = { ...INITIAL_STATE, ...parsed, dailyMissions: resetMissions, missionDate: today };
      // Ensure new fields exist if migrating from old state
      if (!newState.mistakes) newState.mistakes = [];
      if (!newState.unlockedAchievements) newState.unlockedAchievements = [];
      
      saveProgress(newState);
      return newState;
    }

    // Migration safety
    if (!parsed.mistakes) parsed.mistakes = [];
    if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];
    
    // Ensure all daily missions exist in saved state (in case we added new ones)
    DEFAULT_MISSIONS.forEach(defM => {
        if (!parsed.dailyMissions.some((m: DailyMission) => m.id === defM.id)) {
            parsed.dailyMissions.push({...defM});
        }
    });

    return { ...INITIAL_STATE, ...parsed };
  } catch (e) {
    console.error("Failed to load progress", e);
    return INITIAL_STATE;
  }
};

export const saveProgress = (progress: UserProgress) => {
  try {
    // Check for achievements before saving
    const newAchievements = [...progress.unlockedAchievements];
    let achievementUnlocked = false;

    ACHIEVEMENTS_LIST.forEach(ach => {
      if (!newAchievements.includes(ach.id) && ach.condition(progress)) {
        newAchievements.push(ach.id);
        achievementUnlocked = true;
        // Ideally trigger a notification UI here
      }
    });

    const finalProgress = achievementUnlocked ? { ...progress, unlockedAchievements: newAchievements } : progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProgress));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

const checkMissionCompletion = (current: UserProgress): UserProgress => {
  let updatedMissions = [...current.dailyMissions];
  let xpToAdd = 0;
  let missionUpdated = false;

  updatedMissions = updatedMissions.map(m => {
    if (!m.completed && m.progress >= m.target) {
      missionUpdated = true;
      xpToAdd += m.xpReward;
      return { ...m, completed: true };
    }
    return m;
  });

  if (missionUpdated) {
    const updatedState = { ...current, dailyMissions: updatedMissions, xp: current.xp + xpToAdd };
    saveProgress(updatedState);
    return updatedState;
  }
  return current;
};

export const updateMissionProgress = (type: 'chat_msg' | 'quiz_done' | 'word_saved' | 'story_read' | 'pronunciation_practice', amount = 1) => {
  const current = getProgress();
  const updatedMissions = current.dailyMissions.map(m => {
    if (m.id === type) {
      return { ...m, progress: Math.min(m.target, m.progress + amount) };
    }
    return m;
  });
  
  const tempState = { ...current, dailyMissions: updatedMissions };
  saveProgress(tempState); 
  checkMissionCompletion(tempState); 
};


export const addXp = (amount: number): UserProgress => {
  const current = getProgress();
  const today = new Date().toISOString().split('T')[0];
  
  let newStreak = current.streak;
  if (current.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (current.lastActiveDate === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1; 
    }
  }

  const updated: UserProgress = {
    ...current,
    xp: current.xp + amount,
    streak: newStreak === 0 ? 1 : newStreak, 
    lastActiveDate: today
  };
  
  saveProgress(updated);
  return updated;
};

export const markTopicComplete = (topicId: string): UserProgress => {
  const current = getProgress();
  updateMissionProgress('quiz_done', 1);

  if (current.completedTopics.includes(topicId)) return getProgress(); 

  const updated = {
    ...getProgress(), 
    completedTopics: [...current.completedTopics, topicId],
    xp: current.xp + 50 
  };
  saveProgress(updated);
  return updated;
};

export const saveWordToDictionary = (word: VocabularyItem, level: GermanLevel): UserProgress => {
  const current = getProgress();
  if (current.savedWords.some(w => w.german.toLowerCase() === word.german.toLowerCase())) {
    return current;
  }
  
  updateMissionProgress('word_saved', 1);

  const newWord: SavedWord = {
    ...word,
    id: Date.now().toString(),
    addedAt: Date.now(),
    level
  };

  const updated = {
    ...getProgress(), 
    savedWords: [newWord, ...current.savedWords],
    xp: current.xp + 10 
  };
  saveProgress(updated);
  return updated;
};

export const removeWordFromDictionary = (wordId: string): UserProgress => {
  const current = getProgress();
  const updated = {
    ...current,
    savedWords: current.savedWords.filter(w => w.id !== wordId)
  };
  saveProgress(updated);
  return updated;
};

// --- Mistake Bank Logic ---

export const saveMistake = (question: QuizQuestion, topicId: string) => {
  const current = getProgress();
  // Avoid duplicates
  if (current.mistakes.some(m => m.question.question === question.question)) {
    return;
  }

  const newMistake: MistakeRecord = {
    id: Date.now().toString(),
    question,
    topicId,
    timestamp: Date.now()
  };

  const updated = {
    ...current,
    mistakes: [newMistake, ...current.mistakes]
  };
  saveProgress(updated);
};

export const removeMistake = (mistakeId: string) => {
  const current = getProgress();
  const updated = {
    ...current,
    mistakes: current.mistakes.filter(m => m.id !== mistakeId),
    xp: current.xp + 5 // Small bonus for fixing a mistake
  };
  saveProgress(updated);
};