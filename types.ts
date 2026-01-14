
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  GRAMMAR = 'GRAMMAR',
  VOCABULARY = 'VOCABULARY',
  WRITING = 'WRITING',
  READING = 'READING',
  PRONUNCIATION = 'PRONUNCIATION',
  PROFILE = 'PROFILE'
}

export type GermanLevel = 'A1' | 'A2' | 'B1.1' | 'B1.2';

export interface Message {
  role: 'user' | 'model';
  text: string;
  correction?: string;
  explanation?: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  description: string;
  promptContext: string;
  icon: string;
  color: string;
}

export type ExerciseType = 'multiple_choice' | 'sentence_order' | 'fill_gap';

export interface QuizQuestion {
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

export interface VocabularyItem {
  german: string;
  ukrainian: string;
  exampleSentence: string;
}

export interface TextAnalysis {
  word: string;
  translation: string;
  partOfSpeech: string;
  grammarInfo: string;
  conjugation?: { tense: string; forms: string[] }[];
  examples: string[];
}

export interface WritingTopic {
  topic: string;
  description: string;
  hints: string[];
}

export interface WritingAnalysis {
  correctedText: string;
  feedback: string[];
  improvedVersion: string;
  score: number;
  levelAssessment: string;
  generalComment: string;
}

export interface ReadingStory {
  title: string;
  content: string;
  genre: string;
  vocabularyHighlights: { word: string; translation: string }[];
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface PronunciationFeedback {
  score: number;
  recognizedText: string;
  feedback: string;
  tips: string[];
}

export interface DailyMission {
  id: 'chat_msg' | 'quiz_done' | 'word_saved' | 'story_read' | 'pronunciation_practice';
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
}

export interface SavedWord extends VocabularyItem {
  id: string;
  addedAt: number;
  level: GermanLevel;
}

export interface MistakeRecord {
  id: string;
  question: QuizQuestion;
  topicId: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (progress: UserProgress) => boolean;
}

export interface UserProgress {
  xp: number;
  streak: number;
  lastActiveDate: string;
  completedTopics: string[];
  savedWords: SavedWord[];
  dailyMissions: DailyMission[];
  missionDate: string;
  mistakes: MistakeRecord[];
  unlockedAchievements: string[]; // IDs of unlocked achievements
}