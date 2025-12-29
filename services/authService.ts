
import { UserProfile, PlayerClass } from '../types';

const USERS_KEY = 'sidequest_users_db_v1';
const SESSION_KEY = 'sidequest_session_token';

interface StoredUser extends UserProfile {
  passwordHash: string;
}

// Securely hash passwords using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  async register(email: string, password: string, name: string): Promise<UserProfile> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    
    if (users[email]) {
      throw new Error("Account already exists with this email.");
    }

    const passwordHash = await hashPassword(password);

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar: '👤',
      avatarColor: 'bg-indigo-600',
      title: 'Awakened Soul',
      level: 1,
      currentXP: 0,
      nextLevelXP: 500,
      playerClass: PlayerClass.ROGUE,
      streak: 1,
      lastLogin: new Date().toISOString(),
      completedQuests: 0,
      attributes: { strength: 10, intellect: 10, charisma: 10 },
      inventory: [],
      achievements: [],
      abilityCooldown: null,
      loreUnlocked: [],
      dailyNarrative: '',
      hasOnboarded: false,
      narrativeMode: 'Cyberpunk', // Default
      dopaminePreference: 'Gaming & Snacks' // Default
    };

    // Store user with hashed password
    const storedUser: StoredUser = { ...newUser, passwordHash };
    users[email] = storedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login after register
    this.setSession(email);
    return newUser;
  },

  async login(email: string, password: string): Promise<UserProfile> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[email] as StoredUser;

    if (!user) throw new Error("User not found.");
    
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new Error("Invalid password.");

    this.setSession(email);
    
    // Return UserProfile (excluding passwordHash)
    const { passwordHash, ...profile } = user;
    return profile;
  },

  setSession(email: string) {
    localStorage.setItem(SESSION_KEY, email);
  },

  getSession(): UserProfile | null {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[email];
    if (!user) return null;

    const { passwordHash, ...profile } = user;
    return profile;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  updateUser(user: UserProfile) {
    if (!user.email) return;
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const existing = users[user.email] as StoredUser;
    
    if (existing) {
      // Preserve the password hash when updating other fields
      users[user.email] = { ...user, passwordHash: existing.passwordHash };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
};
