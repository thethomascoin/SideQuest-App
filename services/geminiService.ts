
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, PlayerClass, Quest, VerificationResult, SocialPost, LeaderboardEntry, LoreCategory, LoreEntry, UserProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview as it is the current standard for Text and Multimodal tasks
const MODEL_NAME = "gemini-3-flash-preview";

const cleanJSON = (text: string): string => {
  let cleaned = text.trim();
  // robustly remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  return cleaned;
};

// --- QUESTS ---

export const generateDailyQuests = async (user: UserProfile): Promise<Quest[]> => {
  const questSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
        xpReward: { type: Type.INTEGER },
        type: { type: Type.STRING, enum: ["solo", "creative", "social", "timed", "exploration", "collection"] },
        durationMinutes: { type: Type.INTEGER, description: "Only for timed quests (e.g., 5, 10)" },
        locationHint: { type: Type.STRING, description: "Only for exploration quests (e.g. 'A red door', 'A park bench')" },
        dopamineCategory: { type: Type.STRING, enum: ["Appetizer", "Main", "Side", "Dessert"], description: "Dopamine Menu category. Appetizer=Quick Win, Main=Big Task, Side=Chore, Dessert=Treat." },
      },
      required: ["title", "description", "difficulty", "xpReward", "type", "dopamineCategory"],
    },
  };

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  const prompt = `
    Generate 4 real-life RPG quests for a player.
    Player Class: ${user.playerClass}
    Context: It is currently ${timeOfDay}.
    User's Reward Preference: ${user.dopaminePreference || 'General'}.

    1. Easy Quest (Solo task, quick, low anxiety).
    2. Medium Quest (Creative task).
    3. Hard Quest (Social task).
    4. Special Quest: Randomly choose between "timed", "exploration", OR "collection".
    
    The quests must be physical real-world actions. Do not require purchases.
    
    Assign a 'dopamineCategory' to each:
    - Appetizer: Quick, low friction.
    - Main: The challenging, meaningful task.
    - Side: Necessary maintenance/chores.
    - Dessert: Fun, social, or creative treat. (Tailor this specifically to the user's reward preference: ${user.dopaminePreference}).
    
    Return JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questSchema,
        temperature: 1.1, 
      },
    });

    const text = response.text || "[]";
    const data = JSON.parse(cleanJSON(text));
    
    return data.map((q: any, index: number) => {
      let loc = 'wilds';
      if (q.type === 'social') loc = 'city';
      if (q.type === 'creative') loc = 'tower';
      if (q.type === 'timed') loc = 'wilds';
      if (q.type === 'exploration') loc = 'city';
      if (q.type === 'collection') loc = 'wilds';

      return {
        ...q,
        id: `quest-${Date.now()}-${index}`,
        completed: false,
        location: loc,
        dopamineCategory: q.dopamineCategory || 'Side'
      };
    });
  } catch (error) {
    console.error("Gemini Quest Gen Error:", error);
    return [
      { id: 'fallback-1', title: 'Touch Grass', description: 'Go outside and touch a natural surface.', difficulty: Difficulty.EASY, xpReward: 50, type: 'solo', completed: false, location: 'wilds', dopamineCategory: 'Appetizer' },
      { id: 'fallback-2', title: 'Sky Gazer', description: 'Take a photo of an interesting cloud formation.', difficulty: Difficulty.MEDIUM, xpReward: 100, type: 'creative', completed: false, location: 'tower', dopamineCategory: 'Dessert' },
      { id: 'fallback-3', title: 'Speed Run: Water', description: 'Drink a glass of water.', difficulty: Difficulty.MEDIUM, xpReward: 150, type: 'timed', durationMinutes: 2, completed: false, location: 'wilds', dopamineCategory: 'Side' },
    ];
  }
};

export const generateDailyNarrative = async (user: UserProfile, quests: Quest[]): Promise<string> => {
    const prompt = `
        The user is a ${user.level} level ${user.playerClass} named ${user.name} in a modern-fantasy RPG.
        They have just received these quests for the day:
        ${quests.map(q => `- ${q.title} (${q.type})`).join('\n')}

        Write a short, cinematic "Main Character" opening narration (max 60 words) setting the scene for their day. 
        Frame the mundane tasks as epic hero's work. Use "You" perspective.
        
        NARRATIVE STYLE: ${user.narrativeMode || 'Cyberpunk'}.
        (e.g., if Cyberpunk, use tech/neon terms. If Fantasy, use magic/prophecy. If Solarpunk, use nature/harmony).
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "The system reboots. A new day of glory awaits.";
    } catch (e) {
        return "The digital wind howls. It is time to begin.";
    }
};

export const generateWorldEvent = async (): Promise<Quest> => {
    const eventSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        xpReward: { type: Type.INTEGER },
        x: { type: Type.INTEGER, description: "Map coordinate X (50-350)" },
        y: { type: Type.INTEGER, description: "Map coordinate Y (50-350)" },
      },
      required: ["title", "description", "xpReward", "x", "y"],
    };
  
    const prompt = `
      Generate a "World Event" quest. This is a limited-time, high-stakes event for the game map.
      Themes: Dimensional Rifts, Boss Monsters, Festivals, Solar Flares, Glitches.
      
      Task: Real-world action that is fun but slightly absurd or challenging.
      Reward: 300-500 XP.
      
      Return JSON.
    `;
  
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: eventSchema,
          temperature: 1.2,
        },
      });
  
      const text = response.text || "{}";
      const data = JSON.parse(cleanJSON(text));
      
      return {
        id: `event-${Date.now()}`,
        title: data.title,
        description: data.description,
        difficulty: Difficulty.EVENT,
        xpReward: data.xpReward,
        type: 'world-event',
        completed: false,
        location: 'event',
        coordinates: { x: data.x, y: data.y },
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        dopamineCategory: 'Main'
      };
    } catch (error) {
      console.error("Event Gen Error:", error);
      return {
          id: `event-fallback`,
          title: "Golden Slime Invasion",
          description: "Find something yellow and shiny. Quick!",
          difficulty: Difficulty.EVENT,
          xpReward: 500,
          type: 'world-event',
          completed: false,
          location: 'event',
          coordinates: { x: 200, y: 200 },
          expiresAt: Date.now() + 600000,
          dopamineCategory: 'Main'
      }
    }
  };

// --- SOCIAL & LEADERBOARD ---

export const generateSocialFeed = async (): Promise<SocialPost[]> => {
    const feedSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            authorName: { type: Type.STRING },
            authorAvatar: { type: Type.STRING, description: "Single emoji" },
            authorTitle: { type: Type.STRING },
            questTitle: { type: Type.STRING },
            likes: { type: Type.INTEGER },
          },
        },
    };

    const prompt = `Generate 5 fictional social media posts for an RPG app. Users are completing quests like "Clean the desk", "Walk 1 mile", "Drink water". Make the user names and titles fantasy-themed.`;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: feedSchema },
        });

        const data = JSON.parse(cleanJSON(response.text || "[]"));
        return data.map((item: any, i: number) => ({
            ...item,
            id: `post-gen-${Date.now()}-${i}`,
            timestamp: `${Math.floor(Math.random() * 50) + 1}m ago`,
            isUser: false
        }));
    } catch (e) {
        return [];
    }
};

export const generateLeaderboard = async (userLevel: number): Promise<LeaderboardEntry[]> => {
    const lbSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            avatar: { type: Type.STRING },
            title: { type: Type.STRING },
            level: { type: Type.INTEGER },
            xp: { type: Type.INTEGER },
          },
        },
    };

    const prompt = `Generate 4 fictional leaderboard rivals. Their levels should be close to ${userLevel} (some slightly higher, some lower). Fantasy names.`;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: lbSchema },
        });

        const data = JSON.parse(cleanJSON(response.text || "[]"));
        return data.map((item: any, i: number) => ({
            ...item,
            id: `rival-${i}`,
            isUser: false
        }));
    } catch (e) {
        return [];
    }
}

// --- ORACLE ---

export const generateOracleQuest = async (userContext: string): Promise<Quest> => {
    const singleQuestSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          xpReward: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["solo", "creative", "social", "collection"] },
          dopamineCategory: { type: Type.STRING, enum: ["Appetizer", "Main", "Side", "Dessert"] },
        },
        required: ["title", "description", "difficulty", "xpReward", "type"],
    };

    const prompt = `
      The user is asking the Oracle for a specific quest.
      User Context: "${userContext}".
      
      Generate 1 engaging, safe, real-world RPG quest that fits this context perfectly.
      It should be doable immediately.
      If it fits a 'collection' type (finding multiple items), use that type.
      Assign a dopamine category (Appetizer, Main, Side, Dessert).
      
      Return JSON.
    `;
  
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: singleQuestSchema,
          temperature: 1.0,
        },
      });
  
      const text = response.text || "{}";
      const data = JSON.parse(cleanJSON(text));
      
      return {
        ...data,
        id: `oracle-${Date.now()}`,
        completed: false,
        location: 'tower',
        dopamineCategory: data.dopamineCategory || 'Dessert'
      };
    } catch (error) {
      console.error("Oracle Error", error);
      throw new Error("The Oracle is silent...");
    }
  };

// --- VERIFICATION ---

export const verifyQuestSubmission = async (
  quest: Quest,
  base64Image: string,
  userCaption: string
): Promise<VerificationResult> => {
  const verificationSchema = {
    type: Type.OBJECT,
    properties: {
      success: { type: Type.BOOLEAN },
      confidence_score: { type: Type.INTEGER, description: "0-100 score. Does the image definitively prove the quest was completed?" },
      creativity_score: { type: Type.INTEGER, description: "0-100 score. How creative or high-effort is the submission?" },
      sentiment: { type: Type.STRING, description: "One word emotion: e.g. Triumphant, Tired, Bored, Excited, Lazy, Heroic" },
      xp_awarded: { type: Type.INTEGER, description: "Base XP + bonuses for creativity/effort." },
      ai_comment: { type: Type.STRING, description: "The DM's response." },
      loot_name: { type: Type.STRING },
      loot_description: { type: Type.STRING },
      loot_rarity: { type: Type.STRING, enum: ["Common", "Rare", "Epic", "Legendary"] },
      detected_objects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key objects identified in the image." }
    },
    required: ["success", "confidence_score", "creativity_score", "sentiment", "xp_awarded", "ai_comment", "detected_objects"],
  };

  let specificInstruction = "";
  if (quest.type === 'exploration' && quest.locationHint) {
      specificInstruction = `CRITICAL: The user MUST be at a location that matches: "${quest.locationHint}". Look for background clues.`;
  }
  if (quest.type === 'timed') {
      specificInstruction = "Note: This was a timed quest. Ensure the image proves the action was done.";
  }
  if (quest.type === 'collection') {
      specificInstruction = "Note: This is a collection quest. The user should show multiple items matching the description in the image.";
  }
  if (quest.difficulty === Difficulty.HARD) {
      specificInstruction += " STRICT MODE: This is a HARD quest. Require high evidence. If the image is vague, FAIL it.";
  }

  const prompt = `
    You are a Dungeon Master verifying a player's real-life quest submission.
    
    QUEST DETAILS:
    - Title: "${quest.title}"
    - Description: "${quest.description}"
    - Type: ${quest.type}
    - Base XP Reward: ${quest.xpReward}
    
    SUBMISSION:
    - Image: Provided.
    - User Caption (Mission Report): "${userCaption || "No report provided."}"
    
    ${specificInstruction}
    
    VERIFICATION TASKS:
    1. **Object Detection**: List 3-5 main objects visible in the image.
    2. **Relevance Check**: Does the image prove the user performed the specific action in the quest? (Confidence Score 0-100).
       - If it's a generic selfie with no context relevant to the quest, score low.
       - If it's a screenshot of a screen, score 0 and Fail (unless the quest asks for digital work).
    3. **Effort & Creativity**: Rate the composition, lighting, or humor (Creativity Score 0-100).
    4. **Sentiment**: Analyze the user's caption and facial expression/vibe.
    5. **XP Calculation**: 
       - If Success: Base XP + (Creativity Score * 0.5).
       - If Fail: 0 XP.
    6. **Loot Generation**: If successful, grant an item related to the *detected objects*.
    7. **DM Commentary**: 
       - If Success: Congratulate them on specific details seen in the photo.
       - If Fail: Mock them gently or give a hint on what was missing.
    
    VERDICT RULES:
    - Confidence < 60 => Success: false.
    - Confidence >= 60 => Success: true.

    Return JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: verificationSchema,
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(cleanJSON(text));
    
    return {
      success: result.success ?? false,
      confidenceScore: result.confidence_score ?? 50,
      creativityScore: result.creativity_score ?? 0,
      sentiment: result.sentiment || "Neutral",
      xpAwarded: result.xp_awarded ?? 0,
      aiComment: result.ai_comment ?? "The mists of uncertainty cloud my vision...",
      detectedObjects: result.detected_objects || [],
      loot: result.success ? {
        name: result.loot_name || "Unknown Artifact",
        description: result.loot_description || "An item shrouded in mystery.",
        rarity: result.loot_rarity || "Common"
      } : undefined
    };
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      success: false,
      confidenceScore: 0,
      sentiment: "Error",
      xpAwarded: 0,
      aiComment: "My vision is clouded. Try submitting again.",
    };
  }
};

export const chatWithNPC = async (npcName: string, userMessage: string, history: {sender: string, text: string}[]): Promise<string> => {
  const prompt = `
    You are playing the role of ${npcName} in a real-life RPG app called "Sidequest".
    
    Character Persona:
    - Name: Garrick
    - Role: Tavern Keeper & Guide
    - Tone: Friendly, rustic, encouraging, occasionally sarcastic. Uses fantasy metaphors for real life (e.g., "That office job sounds like a dungeon crawl").
    
    Current Conversation History:
    ${history.map(h => `${h.sender}: ${h.text}`).join('\n')}
    User: ${userMessage}
    
    Respond as ${npcName}. Keep it under 50 words. Be helpful but immersive.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Hmph. The wind steals my words.";
  } catch (error) {
    return "I'm polishing a glass right now, come back later.";
  }
}

// --- LORE ---

export const generateLoreEntry = async (category: LoreCategory): Promise<LoreEntry> => {
    const loreSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          icon: { type: Type.STRING, description: "A single emoji representing the lore" },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "content", "icon", "tags"],
    };

    let promptContext = "";
    if (category === 'bestiary') {
        promptContext = `Generate a unique RPG monster that exists in a modern-fantasy setting (e.g., Data Ghouls, Asphalt Elementals, Coffee Shop Mimics, Sewer Drakes). Include descriptions of its appearance and behavior. Subtitle should be its Threat Level.`;
    } else if (category === 'history') {
        promptContext = `Generate a historical timeline event for this world where magic mysteriously returned to modern earth 50 years ago. Subtitle should be the Year/Date.`;
    } else {
        promptContext = `Generate a short in-universe lore snippet, found document, or myth from a character in this world. Subtitle should be the Author or Source.`;
    }

    const prompt = `
      ${promptContext}
      Return JSON.
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: loreSchema,
                temperature: 1.2,
            },
        });

        const text = response.text || "{}";
        const data = JSON.parse(cleanJSON(text));

        return {
            id: `lore-${Date.now()}`,
            category,
            title: data.title,
            content: data.content,
            subtitle: data.subtitle,
            icon: data.icon || "📜",
            tags: data.tags || [],
            unlockedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Lore Gen Error:", error);
        return {
            id: `lore-fail-${Date.now()}`,
            category,
            title: "Corrupted Data",
            content: "The archives are fragmented...",
            icon: "🚫",
            unlockedAt: new Date().toISOString()
        };
    }
};
