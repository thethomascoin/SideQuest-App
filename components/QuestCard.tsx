
import React, { useState, useEffect } from 'react';
import { Quest, Difficulty } from '../types';
import { Button } from './Button';

interface QuestCardProps {
  quest: Quest;
  onAccept: (quest: Quest) => void;
  locked?: boolean;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onAccept, locked = false }) => {
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
      if (quest.completed) {
          setCelebrating(true);
          const timer = setTimeout(() => setCelebrating(false), 2000);
          return () => clearTimeout(timer);
      }
  }, [quest.completed]);

  const difficultyColors: Record<string, string> = {
    [Difficulty.EASY]: 'border-green-500 text-green-400',
    [Difficulty.MEDIUM]: 'border-neon-blue text-neon-blue',
    [Difficulty.HARD]: 'border-neon-pink text-neon-pink',
    [Difficulty.EVENT]: 'border-yellow-400 text-yellow-400',
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

  // Dopamine Category Icons
  const categoryIcons: Record<string, string> = {
      'Appetizer': '🍿',
      'Main': '🍖',
      'Side': '🥗',
      'Dessert': '🍰'
  };

  // Special styling for timed/exploration/collection if they aren't strictly mapping to standard difficulty colors
  let colorClasses = difficultyColors[quest.difficulty] || 'border-zinc-500 text-zinc-400';
  if (quest.type === 'timed') colorClasses = 'border-red-500 text-red-500';
  if (quest.type === 'exploration') colorClasses = 'border-amber-500 text-amber-500';
  if (quest.type === 'collection') colorClasses = 'border-violet-500 text-violet-400';

  const icon = typeIcons[quest.type] || '❓';
  const categoryIcon = quest.dopamineCategory ? categoryIcons[quest.dopamineCategory] : null;

  const speakQuest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`${quest.title}. ${quest.description}`);
      utterance.pitch = 0.8; // Deeper voice
      utterance.rate = 0.9; // Slightly slower
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dynamic classes for celebration
  let cardClasses = `relative bg-surface-800 border-l-4 ${colorClasses} p-4 mb-4 rounded-r-lg shadow-lg transform transition-all duration-500`;
  
  if (celebrating) {
      cardClasses += " scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-1 ring-white/20 z-10";
  } else if (!locked) {
      cardClasses += " hover:translate-x-1";
  }

  if (quest.completed && !celebrating) {
      cardClasses += " opacity-80";
  }

  return (
    <div className={cardClasses}>
      {/* Celebration Effects */}
      {celebrating && (
          <div className="absolute inset-0 overflow-hidden rounded-r-lg pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              <div className="absolute top-2 right-2 text-xl animate-bounce">✨</div>
              <div className="absolute bottom-2 left-10 text-xl animate-bounce delay-75">✨</div>
          </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${colorClasses.split(' ')[1]}`}>
                {quest.difficulty} • {quest.type}
            </span>
            
            {/* Unique visual element for Exploration quests */}
            {quest.type === 'exploration' && (
               <span className="text-amber-400 text-xs animate-pulse" title="Discovery Potential">
                  🔭
               </span>
            )}

            {quest.dopamineCategory && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                    {categoryIcon} {quest.dopamineCategory}
                </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mt-1">{quest.title}</h3>
        </div>
        <div className="bg-surface-900 px-3 py-1 rounded border border-zinc-700">
          <span className="text-yellow-400 font-mono font-bold">+{quest.xpReward} XP</span>
        </div>
      </div>
      
      <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
        {quest.description}
      </p>

      {/* Special Requirements */}
      {quest.type === 'timed' && quest.durationMinutes && (
          <div className="mb-4 flex items-center gap-2 bg-red-900/20 px-3 py-2 rounded border border-red-500/30">
              <span className="animate-pulse">⏱️</span>
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Time Limit: {quest.durationMinutes} Minutes</span>
          </div>
      )}
      
      {quest.type === 'exploration' && quest.locationHint && (
          <div className="mb-4 flex items-center gap-2 bg-amber-900/20 px-3 py-2 rounded border border-amber-500/30">
              <span>🧭</span>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Locate: {quest.locationHint}</span>
          </div>
      )}

      {/* Collection specific styling could go here, but generic description usually suffices */}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={quest.type}>
            {icon}
            </span>
            <button 
                onClick={speakQuest}
                className="text-zinc-500 hover:text-neon-blue transition-colors"
                title="Narrate Quest"
            >
                🔊
            </button>
        </div>

        {quest.completed ? (
           <div className={`px-4 py-2 bg-green-900/30 text-green-400 border border-green-500 rounded font-bold uppercase text-sm tracking-wider flex items-center gap-2 ${celebrating ? 'animate-pulse' : ''}`}>
             <span>Completed</span>
             {celebrating && <span>🎉</span>}
           </div>
        ) : (
          <Button 
            variant="secondary" 
            onClick={() => onAccept(quest)}
            className="text-sm py-2"
            disabled={locked}
          >
            {locked ? 'Locked' : 'Start Quest'}
          </Button>
        )}
      </div>
    </div>
  );
};
