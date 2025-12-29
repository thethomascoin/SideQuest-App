
import React, { useState, useEffect, useRef } from 'react';
import { Quest, UserProfile, PlayerClass, ViewState, VerificationResult, LootItem, SocialPost, Achievement, LeaderboardEntry, LoreEntry, LoreCategory, DopamineCategory } from './types';
import { generateDailyQuests, verifyQuestSubmission, generateOracleQuest, generateSocialFeed, generateLeaderboard, generateWorldEvent, generateLoreEntry, generateDailyNarrative } from './services/geminiService';
import { playSound } from './services/audioService';
import { QuestCard } from './components/QuestCard';
import { QuestMap } from './components/QuestMap';
import { SocialFeed } from './components/SocialFeed';
import { NPCDialog } from './components/NPCDialog';
import { AchievementsList } from './components/AchievementsList';
import { LoreLibrary } from './components/LoreLibrary';
import { Button } from './components/Button';

// --- Game Data Constants ---

const GAME_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_blood', title: 'First Steps', description: 'Complete your first quest.', icon: '🦶', unlocked: false, condition: (u) => u.completedQuests >= 1 },
    { id: 'streaker', title: 'Consistent', description: 'Reach a 3-day streak.', icon: '🔥', unlocked: false, condition: (u) => u.streak >= 3 },
    { id: 'loot_goblin', title: 'Loot Goblin', description: 'Collect 5 items.', icon: '🎒', unlocked: false, condition: (u) => u.inventory.length >= 5 },
    { id: 'jacked', title: 'Gym Rat', description: 'Reach 20 Strength.', icon: '💪', unlocked: false, condition: (u) => u.attributes.strength >= 20 },
    { id: 'bardic', title: 'Social Butterfly', description: 'Reach 20 Charisma.', icon: '🗣️', unlocked: false, condition: (u) => u.attributes.charisma >= 20 },
];

const AVATAR_COLORS = ['bg-indigo-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-pink-600', 'bg-zinc-600', 'bg-cyan-600'];

// --- Helper Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-surface-900 flex flex-col items-center justify-center z-50">
    <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
    <h2 className="text-neon-blue font-mono text-xl animate-pulse">GENERATING WORLD...</h2>
  </div>
);

const ProgressBar = ({ current, max, color = 'bg-yellow-400', height = 'h-3' }: { current: number; max: number; color?: string, height?: string }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className={`w-full ${height} bg-surface-700 rounded-full overflow-hidden`}>
      <div 
        className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const LootCard: React.FC<{ item: LootItem }> = ({ item }) => {
    const rarityColors: Record<string, string> = {
        Common: 'border-zinc-500 text-zinc-300 shadow-zinc-500/20',
        Rare: 'border-blue-500 text-blue-300 shadow-blue-500/40',
        Epic: 'border-purple-500 text-purple-300 shadow-purple-500/50',
        Legendary: 'border-orange-500 text-orange-300 shadow-orange-500/60',
    };

    const colorClass = rarityColors[item.rarity] || rarityColors['Common'];

    return (
        <div className={`bg-surface-800 rounded-xl border-2 p-3 mb-4 flex gap-4 items-center ${colorClass} shadow-lg`}>
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-600 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">{item.rarity}</div>
                <h4 className="font-bold text-white leading-tight">{item.name}</h4>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{item.description}</p>
            </div>
        </div>
    )
}

export default function App() {
  // --- State ---
  const [view, setView] = useState<ViewState>('dashboard');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'menu'>('list'); 
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [missionReport, setMissionReport] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // For active timed quests
  
  // Oracle State
  const [oraclePrompt, setOraclePrompt] = useState("");
  const [oracleLoading, setOracleLoading] = useState(false);

  // NPC State
  const [isNPChatOpen, setIsNPChatOpen] = useState(false);

  // Lore State
  const [loreLoading, setLoreLoading] = useState(false);

  // Social & Leaderboard State
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Daily Bonus State
  const [showDailyBonus, setShowDailyBonus] = useState(false);

  // Customization State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [tempAvatar, setTempAvatar] = useState("👤");
  const [tempColor, setTempColor] = useState("bg-indigo-600");

  const [user, setUser] = useState<UserProfile>({
    id: 'user-1',
    name: 'Player One',
    avatar: '🧙‍♂️',
    avatarColor: 'bg-indigo-600',
    title: 'Apprentice',
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
    loreUnlocked: [], // Init empty
    dailyNarrative: '',
  });

  // Timers ref
  const eventTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Initialization & Daily Bonus Logic ---
  useEffect(() => {
    const initGame = async () => {
      try {
        const savedUser = localStorage.getItem('sidequest_user');
        let currentUser = user;

        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            // Backwards compatibility for lore
            if (!currentUser.loreUnlocked) currentUser.loreUnlocked = [];

            const lastLoginDate = new Date(currentUser.lastLogin).toDateString();
            const today = new Date().toDateString();
            if (lastLoginDate !== today) {
                setShowDailyBonus(true);
                currentUser.streak += 1;
                currentUser.lastLogin = new Date().toISOString();
                // Reset daily narrative on new day
                currentUser.dailyNarrative = ''; 
                localStorage.setItem('sidequest_user', JSON.stringify(currentUser));
                playSound('open');
            }
            setUser(currentUser);
        } else {
            localStorage.setItem('sidequest_user', JSON.stringify(user));
        }

        // Fetch Data
        const [dailyQuests, aiPosts, aiLeaderboard] = await Promise.all([
             generateDailyQuests(currentUser.playerClass),
             generateSocialFeed(),
             generateLeaderboard(currentUser.level)
        ]);

        // Merge user into leaderboard for display
        const userEntry: LeaderboardEntry = {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            level: currentUser.level,
            xp: currentUser.currentXP,
            title: currentUser.title,
            isUser: true
        };
        const fullLeaderboard = [...aiLeaderboard, userEntry].sort((a, b) => b.xp - a.xp);

        setQuests(dailyQuests);
        setSocialPosts(aiPosts);
        setLeaderboard(fullLeaderboard);

        // Generate narrative if missing
        if (!currentUser.dailyNarrative) {
             generateDailyNarrative(currentUser, dailyQuests).then(narrative => {
                 setUser(prev => ({ ...prev, dailyNarrative: narrative }));
             });
        }

      } catch (e) {
        console.error("Failed to init game", e);
      } finally {
        setLoading(false);
      }
    };
    initGame();

    // Start World Event Timer (Chance to spawn every 3 minutes)
    eventTimerRef.current = setInterval(async () => {
        if (Math.random() > 0.5) { // 50% chance when interval hits
            try {
                const newEvent = await generateWorldEvent();
                setQuests(prev => {
                    // Avoid duplicates
                    if(prev.find(q => q.type === 'world-event')) return prev;
                    return [...prev, newEvent];
                });
                playSound('open');
            } catch (e) {
                console.error("Failed to spawn event", e);
            }
        }
    }, 180000); // 3 minutes

    return () => {
        if (eventTimerRef.current) clearInterval(eventTimerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Cleanup expired events
  useEffect(() => {
      const interval = setInterval(() => {
          setQuests(prev => prev.filter(q => {
              if (q.expiresAt && Date.now() > q.expiresAt && !q.completed && q.type === 'world-event') {
                  return false; // Remove expired events
              }
              return true;
          }));
      }, 30000);
      return () => clearInterval(interval);
  }, []);

  // Timer logic for active Timed Quests
  useEffect(() => {
      if (activeQuest && activeQuest.type === 'timed' && activeQuest.expiresAt && view === 'active-quest') {
        questTimerRef.current = setInterval(() => {
            const remaining = activeQuest.expiresAt! - Date.now();
            if (remaining <= 0) {
                // Fail quest
                setVerificationResult({
                    success: false,
                    xpAwarded: 0,
                    aiComment: "Time ran out! You were too slow.",
                    confidenceScore: 0,
                    sentiment: 'Failed'
                });
                setView('result');
                if (questTimerRef.current) clearInterval(questTimerRef.current);
                playSound('fail');
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
      }
      return () => {
          if (questTimerRef.current) clearInterval(questTimerRef.current);
      }
  }, [activeQuest, view]);

  // Persist User State & Check Achievements
  useEffect(() => {
      if (!loading) {
        // Check achievements
        const newUnlocks: string[] = [];
        GAME_ACHIEVEMENTS.forEach(ach => {
            if (!user.achievements.includes(ach.id) && ach.condition(user)) {
                newUnlocks.push(ach.id);
                playSound('success');
            }
        });

        if (newUnlocks.length > 0) {
            setUser(prev => ({...prev, achievements: [...prev.achievements, ...newUnlocks]}));
        } else {
            localStorage.setItem('sidequest_user', JSON.stringify(user));
        }

        // Update Leaderboard entry for user
        setLeaderboard(prev => prev.map(entry => 
            entry.isUser ? { ...entry, xp: user.currentXP, level: user.level, title: user.title } : entry
        ).sort((a, b) => b.xp - a.xp));
      }
  }, [user, loading]);

  // --- Handlers ---
  const handleAcceptQuest = (quest: Quest) => {
    // Clone quest to avoid mutating original list immediately unless necessary
    const startedQuest = { ...quest };
    
    // Logic for Timed Quests: Set expiry now
    if (quest.type === 'timed' && quest.durationMinutes) {
        startedQuest.expiresAt = Date.now() + (quest.durationMinutes * 60 * 1000);
    }

    setActiveQuest(startedQuest);
    setView('active-quest');
    setCapturedImage(null);
    setVerificationResult(null);
    setMissionReport(""); // Reset text
    playSound('click');
  };

  const handleOracleSummon = async () => {
      if(!oraclePrompt.trim()) return;
      setOracleLoading(true);
      playSound('click');
      try {
        const newQuest = await generateOracleQuest(oraclePrompt);
        setQuests(prev => [newQuest, ...prev]);
        setOraclePrompt("");
        setView('dashboard');
        playSound('success');
      } catch(e) {
          alert("The Oracle is confused. Try again.");
          playSound('fail');
      } finally {
          setOracleLoading(false);
      }
  }

  const handleLoreResearch = async (category: LoreCategory) => {
      setLoreLoading(true);
      playSound('click');
      try {
          const newEntry = await generateLoreEntry(category);
          setUser(prev => ({
              ...prev,
              loreUnlocked: [newEntry, ...(prev.loreUnlocked || [])]
          }));
          playSound('success');
      } catch (e) {
          console.error("Lore failed", e);
      } finally {
          setLoreLoading(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        playSound('click');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!activeQuest || !capturedImage) return;
    
    // Clear any timers
    if(questTimerRef.current) clearInterval(questTimerRef.current);

    setVerifying(true);
    playSound('click');
    const base64Data = capturedImage.split(',')[1];
    
    const result = await verifyQuestSubmission(activeQuest, base64Data, missionReport);
    setVerificationResult(result);
    setVerifying(false);
    setView('result');

    if (result.success) {
      playSound('levelUp');
      const newXP = user.currentXP + result.xpAwarded;
      let newLevel = user.level;
      let nextLevelXP = user.nextLevelXP;

      if (newXP >= user.nextLevelXP) {
        newLevel += 1;
        nextLevelXP = Math.floor(nextLevelXP * 1.5);
      }

      const newAttrs = { ...user.attributes };
      if(activeQuest.type === 'solo') newAttrs.strength += 1;
      if(activeQuest.type === 'creative') newAttrs.intellect += 1;
      if(activeQuest.type === 'social') newAttrs.charisma += 1;
      // Bonus attributes for new types
      if(activeQuest.type === 'timed') newAttrs.strength += 2;
      if(activeQuest.type === 'exploration') newAttrs.intellect += 2;
      if(activeQuest.type === 'collection') newAttrs.intellect += 2;

      let newInventory = [...user.inventory];
      if (result.loot) {
          newInventory.unshift({
              id: Date.now().toString(),
              name: result.loot.name,
              description: result.loot.description,
              rarity: (result.loot.rarity || 'Common') as any,
              image: capturedImage,
              dateEarned: new Date().toISOString()
          });
      }

      setUser(prev => ({
        ...prev,
        currentXP: newXP,
        level: newLevel,
        nextLevelXP,
        completedQuests: prev.completedQuests + 1,
        attributes: newAttrs,
        inventory: newInventory
      }));

      const newPost: SocialPost = {
          id: `post-${Date.now()}`,
          authorName: user.name,
          authorAvatar: user.avatar,
          authorTitle: user.title,
          questTitle: activeQuest.title,
          image: capturedImage,
          timestamp: 'Just now',
          likes: 0,
          isUser: true
      };
      setSocialPosts(prev => [newPost, ...prev]);

      setQuests(prev => prev.map(q => q.id === activeQuest.id ? { ...q, completed: true } : q));
    } else {
        playSound('fail');
    }
  };

  const handleClaimBonus = () => {
      setUser(prev => ({
          ...prev,
          currentXP: prev.currentXP + 50
      }));
      setShowDailyBonus(false);
      playSound('success');
  };

  const handleSaveProfile = () => {
      setUser(prev => ({...prev, avatar: tempAvatar, avatarColor: tempColor}));
      setIsCustomizing(false);
      playSound('click');
  };

  const handleClassAbility = () => {
      // Logic: Reroll Quests
      const cooldownTime = 3600 * 1000; // 1 hour
      if (user.abilityCooldown && Date.now() < user.abilityCooldown) {
          alert("Ability still on cooldown!");
          return;
      }

      setLoading(true);
      generateDailyQuests(user.playerClass).then(newQuests => {
          setQuests(newQuests);
          setUser(prev => ({...prev, abilityCooldown: Date.now() + cooldownTime }));
          playSound('success');
          setLoading(false);
          // Regenerate narrative
          generateDailyNarrative(user, newQuests).then(narrative => {
               setUser(prev => ({ ...prev, dailyNarrative: narrative }));
          });
      });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sidequest Complete!',
          text: `I just completed the quest "${activeQuest?.title}" and found a ${verificationResult?.loot?.name}! #SidequestApp`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      alert("Screenshot this screen to share!");
    }
  };

  // --- Render Helpers for Dopamine Menu ---

  const renderDopamineSection = (title: string, category: DopamineCategory, icon: string, description: string) => {
      const sectionQuests = quests.filter(q => (q.dopamineCategory === category) || (!q.dopamineCategory && category === 'Side'));
      if (sectionQuests.length === 0) return null;

      return (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b border-zinc-700 pb-1">
                  <span className="text-2xl">{icon}</span>
                  <div>
                      <h3 className="text-lg font-bold font-serif text-white">{title}</h3>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{description}</p>
                  </div>
              </div>
              <div className="grid gap-4">
                  {sectionQuests.map(quest => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onAccept={handleAcceptQuest} 
                        locked={quest.completed} 
                      />
                  ))}
              </div>
          </div>
      );
  };

  // --- Render ---

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-surface-900 text-zinc-100 font-sans selection:bg-neon-pink selection:text-white pb-24 overflow-x-hidden">
      
      {/* --- OVERLAYS --- */}
      
      <NPCDialog isOpen={isNPChatOpen} onClose={() => setIsNPChatOpen(false)} npcName="Garrick" />

      {/* World Event Notification */}
      {quests.find(q => q.type === 'world-event' && !q.completed) && (
          <div 
            onClick={() => { setView('dashboard'); setViewMode('map'); }}
            className="fixed top-20 left-4 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-lg shadow-xl animate-bounce cursor-pointer border-2 border-white"
          >
              <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                      <h4 className="font-black uppercase text-white text-sm">World Event Detected!</h4>
                      <p className="text-white text-xs font-bold">Check the Map immediately!</p>
                  </div>
              </div>
          </div>
      )}

      {/* Daily Bonus Modal */}
      {showDailyBonus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in zoom-in duration-300">
              <div className="bg-surface-800 border-2 border-neon-blue rounded-2xl p-6 text-center max-w-sm w-full shadow-[0_0_30px_rgba(0,243,255,0.3)]">
                  <div className="text-5xl mb-4 animate-bounce">🎁</div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Daily Login</h2>
                  <p className="text-zinc-400 mb-4">Welcome back, traveler! Your streak is now <span className="text-orange-500 font-bold">{user.streak} days</span>.</p>
                  <div className="bg-surface-900 p-4 rounded-lg mb-6 border border-zinc-700">
                      <p className="text-sm text-zinc-500 uppercase font-bold">Reward</p>
                      <p className="text-3xl font-mono font-bold text-yellow-400">+50 XP</p>
                  </div>
                  <Button onClick={handleClaimBonus} fullWidth>Claim Reward</Button>
              </div>
          </div>
      )}

      {/* Customization Modal */}
      {isCustomizing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="bg-surface-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold mb-4">Customize Profile</h3>
                  <div className="flex justify-center mb-6">
                      <div className={`w-24 h-24 ${tempColor} rounded-full flex items-center justify-center text-5xl border-2 border-white shadow-xl transition-colors`}>
                          {tempAvatar}
                      </div>
                  </div>
                  
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Avatar</p>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                      {['🧙‍♂️','🥷','🧚‍♀️','🧛','🧟','🦸','🦹','🕵️','🧑‍🚀','🤖'].map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => { setTempAvatar(emoji); playSound('click'); }}
                            className={`text-2xl p-2 rounded hover:bg-surface-700 ${tempAvatar === emoji ? 'bg-surface-600 ring-2 ring-white' : ''}`}
                          >
                              {emoji}
                          </button>
                      ))}
                  </div>

                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Background</p>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                      {AVATAR_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => { setTempColor(color); playSound('click'); }}
                            className={`w-8 h-8 rounded-full ${color} border-2 ${tempColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                          />
                      ))}
                  </div>

                  <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setIsCustomizing(false)} fullWidth>Cancel</Button>
                      <Button onClick={handleSaveProfile} fullWidth>Save</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur border-b border-zinc-800 p-4 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3" onClick={() => { setIsCustomizing(true); playSound('click'); }}>
            <div className={`w-10 h-10 ${user.avatarColor || 'bg-indigo-600'} rounded-lg flex items-center justify-center font-bold text-2xl shadow-[0_0_10px_rgba(188,19,254,0.5)] cursor-pointer border border-white/20`}>
              {user.avatar}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">{user.title}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">Lvl {user.level}</span>
                <span className="text-xs text-zinc-500">{user.playerClass}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => { setIsNPChatOpen(true); playSound('click'); }} className="mr-1 bg-surface-800 p-1.5 rounded-full border border-zinc-700 text-lg hover:bg-surface-700">💬</button>
             <span className="text-orange-500 font-bold text-sm border border-orange-500/30 bg-orange-500/10 px-2 py-1 rounded">🔥 {user.streak}</span>
          </div>
        </div>
        <ProgressBar current={user.currentXP} max={user.nextLevelXP} />
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            
            {/* Main Character Energy Intro */}
            {user.dailyNarrative && (
                <div className="mb-6 p-4 bg-gradient-to-br from-zinc-800 to-black rounded-lg border-l-4 border-neon-purple shadow-lg">
                    <h3 className="text-xs text-neon-purple uppercase font-bold tracking-widest mb-1">Chapter: The Current Day</h3>
                    <p className="text-sm text-zinc-300 italic font-serif leading-relaxed">
                        "{user.dailyNarrative}"
                    </p>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                {/* Class Ability Button */}
                <button 
                    onClick={handleClassAbility}
                    className="bg-surface-800 border border-zinc-700 text-xs px-3 py-1 rounded-full text-neon-blue hover:bg-surface-700 flex items-center gap-1"
                >
                    ⚡ Ability: Reroll
                </button>

                {/* View Toggle */}
                <div className="bg-surface-800 p-1 rounded-lg flex gap-1">
                    <button onClick={() => { setViewMode('list'); playSound('click'); }} className={`p-2 rounded ${viewMode === 'list' ? 'bg-surface-700 text-white shadow' : 'text-zinc-500'}`} title="Quest List">📄</button>
                    <button onClick={() => { setViewMode('menu'); playSound('click'); }} className={`p-2 rounded ${viewMode === 'menu' ? 'bg-surface-700 text-white shadow' : 'text-zinc-500'}`} title="Dopamine Menu">🍽️</button>
                    <button onClick={() => { setViewMode('map'); playSound('click'); }} className={`p-2 rounded ${viewMode === 'map' ? 'bg-surface-700 text-white shadow' : 'text-zinc-500'}`} title="Map">🗺️</button>
                </div>
            </div>
            
            {/* Oracle Banner */}
            <div className="mb-6 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-4 border border-indigo-500/50 shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🔮</div>
                <p className="text-sm text-indigo-100 mb-3 relative z-10">Unsure of your path? Ask for guidance.</p>
                <Button variant="ghost" fullWidth className="bg-indigo-950/50 hover:bg-indigo-800 border border-indigo-500/30 text-xs py-2" onClick={() => { setView('oracle'); playSound('click'); }}>
                    Summon Oracle
                </Button>
            </div>

            {viewMode === 'menu' ? (
                 <div className="bg-surface-800/50 p-4 rounded-xl border border-dashed border-zinc-700">
                     <div className="text-center mb-6">
                         <h2 className="font-serif text-3xl italic text-white">Dopamine Menu</h2>
                         <div className="h-0.5 w-16 bg-neon-blue mx-auto mt-2"></div>
                     </div>
                     
                     {renderDopamineSection('Appetizers', 'Appetizer', '🍿', 'Quick Wins & Low Friction')}
                     {renderDopamineSection('Main Course', 'Main', '🍖', 'Deep Focus & Big Gains')}
                     {renderDopamineSection('Side Dishes', 'Side', '🥗', 'Necessary Maintenance')}
                     {renderDopamineSection('Dessert', 'Dessert', '🍰', 'Treats & Rewards')}
                     
                     {quests.length === 0 && <p className="text-center text-zinc-500 italic">The kitchen is closed.</p>}
                 </div>
            ) : viewMode === 'list' ? (
                <div>
                  <h1 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-4">
                      Quest Board
                  </h1>
                  <div className="space-y-4">
                    {quests.map(quest => (
                        <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onAccept={handleAcceptQuest}
                        locked={quest.completed}
                        />
                    ))}
                  </div>
                </div>
            ) : (
                <QuestMap quests={quests} onSelectQuest={handleAcceptQuest} />
            )}
          </div>
        )}

        {/* TAVERN VIEW */}
        {view === 'tavern' && (
            <div className="animate-in fade-in duration-500">
                <h1 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4">
                    The Tavern
                </h1>
                <SocialFeed posts={socialPosts} leaderboard={leaderboard} currentUserId={user.id} />
            </div>
        )}
        
        {/* LORE VIEW */}
        {view === 'lore' && (
            <LoreLibrary 
                entries={user.loreUnlocked || []} 
                onResearch={handleLoreResearch} 
                loading={loreLoading} 
            />
        )}

        {/* ORACLE VIEW */}
        {view === 'oracle' && (
            <div className="animate-in fade-in duration-300 flex flex-col h-[70vh] justify-center relative">
                 <button onClick={() => setView('dashboard')} className="absolute top-0 left-0 text-zinc-400 hover:text-white flex items-center gap-2 text-sm uppercase font-bold">← Back</button>
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-pulse">🔮</div>
                    <h2 className="text-2xl font-bold text-indigo-300">Consult The Oracle</h2>
                    <p className="text-zinc-400 mt-2 px-4">Tell me your context (time, location, mood), and I shall grant a prophecy.</p>
                </div>
                <textarea 
                    className="w-full bg-surface-800 border border-indigo-500/50 rounded-xl p-4 text-white mb-6 h-32 focus:outline-none focus:border-neon-purple"
                    placeholder="e.g. I have 10 minutes, I'm at a coffee shop, and I feel bored."
                    value={oraclePrompt}
                    onChange={(e) => setOraclePrompt(e.target.value)}
                />
                <Button onClick={handleOracleSummon} loading={oracleLoading} disabled={!oraclePrompt.trim()}>
                    Reveal Destiny
                </Button>
            </div>
        )}

        {/* ACTIVE QUEST VIEW */}
        {view === 'active-quest' && activeQuest && (
          <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
            <button onClick={() => setView('dashboard')} className="mb-4 text-zinc-400 hover:text-white flex items-center gap-2 text-sm uppercase font-bold">← Abandon Quest</button>

            <div className="flex-1">
              {/* Header with Countdown for Timed Quests */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-white truncate pr-2">{activeQuest.title}</h2>
                {activeQuest.type === 'timed' && timeLeft !== null && (
                    <div className={`font-mono text-xl font-bold ${timeLeft < 10000 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                        {Math.floor(timeLeft / 60000)}:{(Math.floor(timeLeft % 60000) / 1000).toFixed(0).padStart(2, '0')}
                    </div>
                )}
              </div>
              
              <div className="bg-surface-800 p-4 rounded-lg border border-zinc-700 mb-6 relative overflow-hidden">
                <p className="text-zinc-300 italic relative z-10">"{activeQuest.description}"</p>
                {activeQuest.expiresAt && activeQuest.type === 'world-event' && (
                    <p className="text-red-400 text-xs font-bold mt-2 uppercase animate-pulse">
                        ⚠ Expires in {Math.ceil((activeQuest.expiresAt - Date.now()) / 60000)} mins
                    </p>
                )}
                {/* Visual Hint for Exploration */}
                {activeQuest.type === 'exploration' && activeQuest.locationHint && (
                     <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center gap-2 text-amber-500">
                        <span className="text-lg">🧭</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Target: {activeQuest.locationHint}</span>
                     </div>
                )}
                {/* Background effects based on type */}
                {activeQuest.type === 'timed' && <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>}
              </div>

              {/* CAPTURE AREA */}
              <div className="bg-black rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 aspect-square relative flex flex-col items-center justify-center mb-4">
                {capturedImage ? (
                  <>
                    <img src={capturedImage} alt="Proof" className="absolute inset-0 w-full h-full object-cover" />
                    <button onClick={() => setCapturedImage(null)} className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-full z-10">✕</button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-900 transition-colors group">
                    <div className="bg-surface-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-4xl">📸</span>
                    </div>
                    <span className="text-zinc-400 font-bold uppercase text-sm">Tap to Capture Proof</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* MISSION REPORT TEXT AREA */}
              <div className="mb-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Mission Report (Optional)</label>
                  <textarea
                    value={missionReport}
                    onChange={(e) => setMissionReport(e.target.value)}
                    placeholder="How did it go? Are you feeling heroic?"
                    className="w-full bg-surface-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none resize-none h-20"
                  />
              </div>

            </div>

            <Button fullWidth disabled={!capturedImage} loading={verifying} onClick={handleVerify}>
              {verifying ? 'Scanning & Analyzing...' : 'Complete Quest'}
            </Button>
          </div>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && verificationResult && activeQuest && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in zoom-in duration-500 text-center pb-20">
             {verificationResult.success ? (
               <>
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-neon-green blur-3xl opacity-20 animate-pulse"></div>
                   <div className="text-6xl animate-bounce">🎉</div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic mb-2 drop-shadow-[0_0_10px_rgba(10,255,0,0.8)]">Quest Complete!</h2>
                <div className="text-5xl font-mono font-bold text-yellow-400 mb-2 drop-shadow-lg">+{verificationResult.xpAwarded} XP</div>
                
                {/* Confidence & Sentiment Badges */}
                <div className="flex gap-2 mb-6 justify-center">
                    <span className="bg-surface-800 px-3 py-1 rounded-full text-xs font-bold text-zinc-400 border border-zinc-700">
                        👁️ Match: <span className="text-white">{verificationResult.confidenceScore}%</span>
                    </span>
                    <span className="bg-surface-800 px-3 py-1 rounded-full text-xs font-bold text-zinc-400 border border-zinc-700">
                        🎭 Mood: <span className="text-white">{verificationResult.sentiment}</span>
                    </span>
                </div>

                {verificationResult.loot && (
                    <div className="w-full max-w-xs mb-6 animate-in slide-in-from-bottom-5 duration-700 delay-150">
                        <p className="text-xs uppercase tracking-widest text-purple-400 mb-2 font-bold">Item Dropped!</p>
                        <LootCard item={{...verificationResult.loot, id: 'temp', image: capturedImage || '', dateEarned: ''}} />
                    </div>
                )}
                <div className="bg-surface-800 p-6 rounded-xl border border-neon-green/50 max-w-xs w-full mb-8 transform rotate-1">
                  <p className="text-xs text-zinc-500 uppercase mb-2">Dungeon Master Says:</p>
                  <p className="text-lg text-white font-medium leading-snug">"{verificationResult.aiComment}"</p>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <Button onClick={handleShare} variant="secondary" fullWidth>Share Loot</Button>
                  <Button onClick={() => setView('tavern')} fullWidth>Visit Tavern</Button>
                </div>
               </>
             ) : (
               <>
                 <div className="text-6xl mb-6 animate-pulse">💀</div>
                 <h2 className="text-3xl font-bold text-red-500 uppercase mb-4">Quest Failed</h2>
                 
                 <div className="bg-red-900/20 px-4 py-2 rounded mb-6 border border-red-500/30">
                     <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Confidence Score: {verificationResult.confidenceScore}%</p>
                 </div>

                 <p className="text-zinc-300 mb-8 max-w-xs bg-surface-800 p-4 rounded-lg border border-zinc-700">
                    "{verificationResult.aiComment}"
                 </p>
                 <Button onClick={() => setView('active-quest')} variant="secondary" fullWidth>Try Again</Button>
               </>
             )}
          </div>
        )}

        {/* INVENTORY VIEW */}
        {view === 'inventory' && (
             <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">The Grimoire</h2>
                    <button onClick={() => { setIsCustomizing(true); playSound('click'); }} className="text-xs bg-surface-800 border border-zinc-700 px-2 py-1 rounded text-zinc-300 hover:text-white">Edit Profile</button>
                </div>

                <div className="bg-surface-800 p-4 rounded-xl mb-6 border border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Attributes</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-red-400 font-bold">STR (Physical)</span><span className="text-zinc-500">{user.attributes.strength}</span></div>
                            <ProgressBar current={user.attributes.strength} max={50} color="bg-red-500" height="h-2"/>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-blue-400 font-bold">INT (Creative)</span><span className="text-zinc-500">{user.attributes.intellect}</span></div>
                            <ProgressBar current={user.attributes.intellect} max={50} color="bg-blue-500" height="h-2"/>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-pink-400 font-bold">CHA (Social)</span><span className="text-zinc-500">{user.attributes.charisma}</span></div>
                            <ProgressBar current={user.attributes.charisma} max={50} color="bg-pink-500" height="h-2"/>
                        </div>
                    </div>
                </div>

                <Button variant="secondary" fullWidth className="mb-6" onClick={() => { setView('achievements'); playSound('click'); }}>View Achievements 🏆</Button>

                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Collected Loot ({user.inventory.length})</h3>
                {user.inventory.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-xl">No items found. Complete quests to earn loot.</div>
                ) : (
                    user.inventory.map(item => <LootCard key={item.id} item={item} />)
                )}
             </div>
        )}

        {/* ACHIEVEMENTS VIEW */}
        {view === 'achievements' && (
             <div className="animate-in fade-in duration-300">
                 <button onClick={() => setView('inventory')} className="mb-4 text-zinc-400 hover:text-white flex items-center gap-2 text-sm uppercase font-bold">← Back to Inventory</button>
                 <AchievementsList achievements={GAME_ACHIEVEMENTS} unlockedIds={user.achievements} />
             </div>
        )}

      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-900 border-t border-zinc-800 py-3 flex justify-around z-50 pb-safe shadow-2xl">
        <button onClick={() => { setView('dashboard'); playSound('click'); }} className={`flex flex-col items-center ${view === 'dashboard' || view === 'oracle' ? 'text-neon-blue' : 'text-zinc-500'}`}>
          <span className="text-xl">⚔️</span>
          <span className="text-[10px] uppercase font-bold mt-1">Quests</span>
        </button>
        <button onClick={() => { setView('tavern'); playSound('click'); }} className={`flex flex-col items-center ${view === 'tavern' ? 'text-orange-400' : 'text-zinc-500'}`}>
          <span className="text-xl">🍻</span>
          <span className="text-[10px] uppercase font-bold mt-1">Tavern</span>
        </button>
        <button onClick={() => { setView('lore'); playSound('click'); }} className={`flex flex-col items-center ${view === 'lore' ? 'text-emerald-400' : 'text-zinc-500'}`}>
          <span className="text-xl">📜</span>
          <span className="text-[10px] uppercase font-bold mt-1">Lore</span>
        </button>
        <button onClick={() => { setView('inventory'); playSound('click'); }} className={`flex flex-col items-center ${view === 'inventory' || view === 'achievements' ? 'text-neon-purple' : 'text-zinc-500'}`}>
          <span className="text-xl">🎒</span>
          <span className="text-[10px] uppercase font-bold mt-1">Grimoire</span>
        </button>
      </nav>
    </div>
  );
}
