
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { playSound } from '../services/audioService';

interface SettingsViewProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
}

const AVATAR_COLORS = ['bg-indigo-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-pink-600', 'bg-zinc-600', 'bg-cyan-600'];
const AVATARS = ['🧙‍♂️','🥷','🧚‍♀️','🧛','🧟','🦸','🦹','🕵️','🧑‍🚀','🤖', '🦁', '🦉', '🦊', '🦄', '🐲'];

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onSave, onBack, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [color, setColor] = useState(user.avatarColor);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    playSound('click');
    // Simulate network delay or just immediate
    setTimeout(() => {
        const updated = { ...user, name, avatar, avatarColor: color };
        onSave(updated);
        setLoading(false);
    }, 500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm font-bold uppercase flex items-center gap-1">
            <span>←</span> Back
        </button>
        <h2 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500 ml-auto">
          Settings
        </h2>
      </div>

      <div className="bg-surface-800 border border-zinc-700 rounded-2xl p-6 shadow-xl">
        
        {/* Preview */}
        <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 ${color} rounded-2xl flex items-center justify-center text-5xl border-4 border-surface-900 shadow-2xl transition-colors relative`}>
                {avatar}
                <div className="absolute -bottom-3 bg-surface-900 text-xs px-3 py-1 rounded-full border border-zinc-700 font-bold text-zinc-300">
                    Lvl {user.level}
                </div>
            </div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Hero Name</label>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all"
            />
        </div>

        {/* Avatars */}
        <div className="mb-6">
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Identity</label>
            <div className="grid grid-cols-5 gap-3">
                {AVATARS.map(emoji => (
                    <button 
                    key={emoji} 
                    onClick={() => { setAvatar(emoji); playSound('click'); }}
                    className={`text-2xl p-2 rounded-lg hover:bg-surface-700 transition-all ${avatar === emoji ? 'bg-surface-600 ring-2 ring-white scale-110' : 'bg-surface-900'}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>

        {/* Colors */}
        <div className="mb-8">
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Aura Color</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {AVATAR_COLORS.map(c => (
                    <button
                    key={c}
                    onClick={() => { setColor(c); playSound('click'); }}
                    className={`w-10 h-10 rounded-full ${c} border-2 shrink-0 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    />
                ))}
            </div>
        </div>

        <div className="space-y-4">
            <Button onClick={handleSave} fullWidth loading={loading}>Save Changes</Button>
            
            <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="mb-4">
                     <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Account</p>
                     <p className="text-sm text-zinc-300 font-mono">{user.email || 'Guest'}</p>
                </div>
                <Button variant="danger" onClick={onLogout} fullWidth className="text-xs">
                    System Logout
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
};
