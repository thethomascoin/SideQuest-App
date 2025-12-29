
import React, { useState } from 'react';
import { Button } from './Button';
import { UserProfile } from '../types';
import { authService } from '../services/authService';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all required fields.');
      }

      let user: UserProfile;

      if (isRegistering) {
        if (!name) throw new Error('Please enter your Hero Name.');
        user = await authService.register(email, password, name);
      } else {
        user = await authService.login(email, password);
      }

      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-surface-900 opacity-90 z-0"></div>
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
            Sidequest
          </h1>
          <p className="text-zinc-400 font-mono text-sm tracking-widest">REALITY IS THE GAME</p>
        </div>

        <div className="bg-surface-800/80 backdrop-blur-md border border-zinc-700 p-8 rounded-2xl shadow-2xl">
          <div className="flex gap-4 mb-8 border-b border-zinc-700 pb-2">
            <button 
              onClick={() => { setIsRegistering(false); setError(''); }}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${!isRegistering ? 'text-neon-blue border-b-2 border-neon-blue' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsRegistering(true); setError(''); }}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${isRegistering ? 'text-neon-blue border-b-2 border-neon-blue' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                <label className="text-xs font-bold text-zinc-500 uppercase">Hero Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all"
                  placeholder="e.g. Neo"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-900 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-2 rounded border border-red-500/30 animate-pulse">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth className="mt-4" loading={loading}>
              {isRegistering ? 'Initialize Profile' : 'Jack In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
