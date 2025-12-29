
import React from 'react';
import { Achievement } from '../types';

interface AchievementsListProps {
  achievements: Achievement[];
  unlockedIds: string[];
}

export const AchievementsList: React.FC<AchievementsListProps> = ({ achievements, unlockedIds }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">
            Hall of Fame
        </h2>
        <div className="grid grid-cols-2 gap-4">
            {achievements.map(ach => {
                const isUnlocked = unlockedIds.includes(ach.id);
                return (
                    <div 
                        key={ach.id} 
                        className={`p-4 rounded-xl border-2 relative overflow-hidden transition-all ${
                            isUnlocked 
                            ? 'bg-surface-800 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                            : 'bg-surface-900 border-zinc-800 opacity-60 grayscale'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-3xl">{ach.icon}</div>
                            {isUnlocked && <div className="text-xs font-bold text-yellow-500 uppercase">Unlocked</div>}
                        </div>
                        <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>{ach.title}</h3>
                        <p className="text-xs text-zinc-400 leading-tight">{ach.description}</p>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
