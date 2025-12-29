
import React from 'react';
import { Quest, Difficulty } from '../types';

interface QuestMapProps {
  quests: Quest[];
  onSelectQuest: (quest: Quest) => void;
}

export const QuestMap: React.FC<QuestMapProps> = ({ quests, onSelectQuest }) => {
  // Group quests by location
  const wildsQuest = quests.find(q => q.location === 'wilds' && q.type !== 'timed' && q.type !== 'collection'); 
  const cityQuest = quests.find(q => q.location === 'city' && q.type !== 'exploration');
  const towerQuest = quests.find(q => q.location === 'tower');
  const worldEvent = quests.find(q => q.type === 'world-event');
  
  // Specific markers for new types
  const timedQuest = quests.find(q => q.type === 'timed');
  const explorationQuest = quests.find(q => q.type === 'exploration');
  const collectionQuest = quests.find(q => q.type === 'collection');

  const difficultyColors: Record<string, string> = {
    [Difficulty.EASY]: '#4ade80',    // Green
    [Difficulty.MEDIUM]: '#00f3ff',  // Neon Blue
    [Difficulty.HARD]: '#ff00ff',    // Neon Pink
    [Difficulty.EVENT]: '#facc15',   // Yellow/Gold
  };

  const typeIcons: Record<string, string> = {
    solo: '🧘',
    creative: '🎨',
    social: '🗣️',
    'world-event': '⚡',
    timed: '⏱️',
    exploration: '🧭',
    collection: '🎒'
  };

  const MapNode = ({ x, y, label, quest, defaultColor, defaultIcon, isEvent = false }: any) => {
    // Determine visual properties based on quest or defaults
    let color = quest ? difficultyColors[quest.difficulty] : defaultColor;
    // Override color for special types
    if (quest?.type === 'timed') color = '#ef4444'; // Red
    if (quest?.type === 'exploration') color = '#f59e0b'; // Amber
    if (quest?.type === 'collection') color = '#8b5cf6'; // Violet

    const icon = quest ? typeIcons[quest.type] : defaultIcon;
    const isAvailable = quest && !quest.completed;

    // If it's an event node but no event is active, don't render it
    if (!quest && isEvent) return null;

    return (
      <g 
        transform={`translate(${x},${y})`} 
        className={`${isAvailable ? 'cursor-pointer hover:scale-110' : 'opacity-40 grayscale'} transition-all duration-300 group`}
        onClick={() => isAvailable && onSelectQuest(quest)}
      >
        {/* Active Quest Effects */}
        {isAvailable && (
          <>
            {/* Outer expanding ripple (ping) */}
            <circle cx="0" cy="0" r={isEvent ? 55 : 40} fill="none" stroke={color} strokeWidth="2" className="animate-ping opacity-75" style={{ animationDuration: isEvent ? '1.5s' : '3s' }} />
            
            {/* Inner pulsating glow area */}
            <circle cx="0" cy="0" r={isEvent ? 45 : 35} fill={color} fillOpacity="0.15" className="animate-pulse" />
          </>
        )}
        
        {/* Main Node Circle */}
        <circle 
            cx="0" 
            cy="0" 
            r={isEvent ? 35 : 28} 
            fill="#18181b" 
            stroke={color} 
            strokeWidth={isAvailable ? 3 : 2} 
            className={`shadow-lg transition-all ${isAvailable ? 'animate-glow' : ''}`}
            style={isAvailable ? { filter: `drop-shadow(0 0 10px ${color})` } : {}}
        />
        
        {/* Quest Icon */}
        <text x="0" y={isEvent ? 11 : 9} textAnchor="middle" fill={color} fontSize={isEvent ? 32 : 24} className="pointer-events-none select-none">
            {icon}
        </text>
        
        {/* Label Container */}
        <g transform={`translate(0, ${isEvent ? 50 : 42})`}>
            <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#09090b" stroke={color} strokeWidth="1" className="opacity-90" />
            <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" letterSpacing="1">
                {label}
            </text>
        </g>
        
        {/* Difficulty Badge (Top) */}
        {isAvailable && (
           <g transform={`translate(0, ${isEvent ? -48 : -40})`}>
             <rect x="-25" y="-10" width="50" height="18" rx="4" fill={color} className="shadow-sm" />
             <text x="0" y="2" textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold" className="uppercase">
               {quest.difficulty}
             </text>
           </g>
        )}

        {/* Completed Checkmark Overlay */}
        {quest?.completed && (
          <g transform="translate(20, -20)">
              <circle cx="0" cy="0" r="14" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">✓</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full aspect-square bg-surface-900 rounded-xl overflow-hidden relative border-2 border-zinc-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        {/* Background Texture/Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{
                 backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                 backgroundSize: '40px 40px'
             }}>
        </div>
        
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full animate-glow"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-500/10 blur-3xl rounded-full animate-glow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full animate-glow" style={{ animationDelay: '2s' }}></div>

        {/* Red Alert Glow for Events */}
        {worldEvent && !worldEvent.completed && (
             <div className="absolute inset-0 bg-red-500/10 blur-xl animate-pulse pointer-events-none"></div>
        )}

      <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
        {/* Paths connecting nodes */}
        <g stroke="#27272a" strokeWidth="3" fill="none" strokeDasharray="6,6">
            <path d="M100,300 Q200,200 300,100" />
            <path d="M100,300 Q150,150 200,80" />
            <path d="M300,100 Q250,250 200,320" />
            <path d="M200,200 L120,150" />
            <path d="M200,200 L280,280" />
            <path d="M100,300 L60,240" />
        </g>

        {/* The Wilds (Bottom Left) */}
        <MapNode 
          x="100" y="300" 
          label="THE WILDS" 
          quest={wildsQuest} 
          defaultColor="#4ade80" 
          defaultIcon="🌲"
        />

        {/* The City (Top Right) */}
        <MapNode 
          x="300" y="100" 
          label="THE CITY" 
          quest={cityQuest} 
          defaultColor="#f472b6" 
          defaultIcon="🏙️"
        />

        {/* Mage Tower (Top Center) */}
        <MapNode 
          x="200" y="80" 
          label="TOWER" 
          quest={towerQuest} 
          defaultColor="#60a5fa" 
          defaultIcon="🔮"
        />
        
        {/* Timed Quest Node (Variable) */}
        {timedQuest && (
            <MapNode 
              x="120" y="150" 
              label="DANGER" 
              quest={timedQuest} 
              defaultColor="#ef4444" 
              defaultIcon="⏱️"
            />
        )}
        
        {/* Exploration Quest Node (Variable) */}
        {explorationQuest && (
            <MapNode 
              x="280" y="280" 
              label="RUINS" 
              quest={explorationQuest} 
              defaultColor="#f59e0b" 
              defaultIcon="🧭"
            />
        )}

        {/* Collection Quest Node (Variable) */}
        {collectionQuest && (
            <MapNode 
              x="60" y="240" 
              label="GATHER" 
              quest={collectionQuest} 
              defaultColor="#8b5cf6" 
              defaultIcon="🎒"
            />
        )}

        {/* Dynamic World Event Node */}
        {worldEvent && (
            <MapNode
                x={worldEvent.coordinates?.x || 200}
                y={worldEvent.coordinates?.y || 200}
                label="EVENT"
                quest={worldEvent}
                isEvent={true}
            />
        )}

        {/* Player Current Location Marker (Home Base) */}
        <g transform="translate(200, 200)">
             <circle cx="0" cy="0" r="10" fill="#fff" className="animate-pulse opacity-30" />
             <circle cx="0" cy="0" r="5" fill="#fff" className="shadow-[0_0_10px_white]" />
             <text x="0" y="20" textAnchor="middle" fill="#999" fontSize="10" fontWeight="bold" letterSpacing="1">HOME</text>
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 text-[10px] text-zinc-500 font-mono border border-zinc-800 px-2 py-1 rounded bg-black/80">
        MAP_V1.3 :: ONLINE
      </div>
    </div>
  );
};
