
export enum PlayerClass {
  BARD = 'Bard',
  RANGER = 'Ranger',
  ROGUE = 'Rogue',
  PALADIN = 'Paladin'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EVENT = 'World Event'
}

export type DopamineCategory = 'Appetizer' | 'Main' | 'Side' | 'Dessert';
export type NarrativeMode = 'Cyberpunk' | 'High Fantasy' | 'Modern Thriller' | 'Cozy Solarpunk';

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  type: 'solo' | 'creative' | 'social' | 'world-event' | 'timed' | 'exploration' | 'collection';
  completed: boolean;
  location?: 'wilds' | 'city' | 'tower' | 'event';
  coordinates?: { x: number; y: number }; // For custom map placement
  expiresAt?: number; // Timestamp for world events OR end time for timed quests
  durationMinutes?: number; // Static duration for timed quests
  locationHint?: string; // For exploration quests
  dopamineCategory?: DopamineCategory; // For Dopamine Menu view
}

export interface LootItem {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  image: string; // Base64 of the photo taken
  dateEarned: string;
}

export interface UserAttributes {
  strength: number; // From physical/solo tasks
  intellect: number; // From creative tasks
  charisma: number; // From social tasks
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (user: UserProfile) => boolean;
}

export type LoreCategory = 'bestiary' | 'history' | 'library';

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  title: string;
  content: string;
  subtitle?: string; // e.g., "Level 5 Beast" or "Year 2045"
  icon?: string; // Emoji
  tags?: string[];
  unlockedAt: string;
}

export interface UserProfile {
  id: string;
  email?: string; // New field for auth simulation
  name: string;
  avatar: string; // Emoji or URL
  avatarColor: string; // bg color
  title: string; // e.g. "Novice Explorer"
  level: number;
  currentXP: number;
  nextLevelXP: number;
  playerClass: PlayerClass;
  streak: number;
  lastLogin: string; // ISO Date string
  completedQuests: number;
  attributes: UserAttributes;
  inventory: LootItem[];
  achievements: string[]; // IDs of unlocked achievements
  abilityCooldown: number | null; // Timestamp when ability is ready
  loreUnlocked: LoreEntry[]; // New field for lore
  dailyNarrative?: string; // For Main Character Energy
  hasOnboarded: boolean; // New field to track walkthrough status
  narrativeMode: NarrativeMode; // Preference for AI narration style
  dopaminePreference: string; // Preference for rewards
}

export interface VerificationResult {
  success: boolean;
  xpAwarded: number;
  aiComment: string;
  confidenceScore: number; // 0-100
  sentiment: string; // e.g., "Determined", "Happy", "Tired"
  loot?: Omit<LootItem, 'id' | 'image' | 'dateEarned'>; // AI generates metadata
  creativityScore?: number; // New
  detectedObjects?: string[]; // New
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;
  questTitle: string;
  image?: string; // Optional image proof
  likes: number;
  timestamp: string;
  isUser: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string; // Emoji
  level: number;
  xp: number;
  title: string;
  isUser?: boolean;
}

export interface NPCMessage {
  id: string;
  sender: 'user' | 'npc';
  text: string;
}

export type ViewState = 'dashboard' | 'active-quest' | 'result' | 'profile' | 'inventory' | 'oracle' | 'tavern' | 'map' | 'achievements' | 'lore' | 'settings';
