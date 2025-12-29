
import React, { useState } from 'react';
import { Button } from './Button';
import { PlayerClass, UserProfile, NarrativeMode } from '../types';
import { authService } from '../services/authService';
import { playSound } from '../services/audioService';

interface OnboardingProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedClass, setSelectedClass] = useState<PlayerClass>(PlayerClass.ROGUE);
  const [selectedVibe, setSelectedVibe] = useState<NarrativeMode>('Cyberpunk');
  const [selectedReward, setSelectedReward] = useState<string>('Gaming');

  const steps = [
    {
      title: "Main Character Energy",
      content: "You are the protagonist. Define the genre of your life's story. This changes how the AI narrates your daily quests.",
      icon: "✨",
      color: "text-yellow-400"
    },
    {
      title: "The Dopamine Menu",
      content: "What fuels you? We'll curate 'Dessert' quests based on your favorite rewards to help you recharge guilt-free.",
      icon: "🍽️",
      color: "text-neon-blue"
    },
    {
      title: "Proof of Work",
      content: "The system demands proof. Snap photos of your completed quests. Our AI vision verifies your deeds and grants you loot and experience.",
      icon: "📸",
      color: "text-neon-pink"
    },
    {
      title: "Choose Your Class",
      content: "How do you approach life? This determines your starting stats and daily quests.",
      icon: "🛡️",
      color: "text-neon-green"
    }
  ];

  const handleNext = () => {
    playSound('click');
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      playSound('levelUp');
      // Finalize
      const updatedUser: UserProfile = {
        ...user,
        playerClass: selectedClass,
        narrativeMode: selectedVibe,
        dopaminePreference: selectedReward,
        hasOnboarded: true,
        // Update attributes based on class
        attributes: {
            strength: selectedClass === PlayerClass.PALADIN ? 15 : 10,
            intellect: selectedClass === PlayerClass.BARD ? 15 : 10,
            charisma: selectedClass === PlayerClass.ROGUE ? 15 : 10
        }
      };
      
      // Save to secure local DB
      authService.updateUser(updatedUser);
      onComplete(updatedUser);
    }
  };

  const renderClassSelection = () => (
    <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 w-full">
      {Object.values(PlayerClass).map((pClass) => (
        <button
          key={pClass}
          onClick={() => { setSelectedClass(pClass); playSound('click'); }}
          className={`p-3 rounded-xl border-2 transition-all ${
            selectedClass === pClass 
              ? 'bg-surface-700 border-neon-green text-white shadow-[0_0_15px_rgba(10,255,0,0.3)] scale-105' 
              : 'bg-surface-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'
          }`}
        >
          <div className="text-2xl mb-1">
            {pClass === PlayerClass.BARD && '🎭'}
            {pClass === PlayerClass.RANGER && '🏹'}
            {pClass === PlayerClass.ROGUE && '🗡️'}
            {pClass === PlayerClass.PALADIN && '🛡️'}
          </div>
          <div className="font-bold text-sm uppercase">{pClass}</div>
        </button>
      ))}
    </div>
  );

  const renderVibeSelection = () => (
      <div className="grid grid-cols-1 gap-2 mt-4 w-full animate-in fade-in slide-in-from-bottom-2">
          {(['Cyberpunk', 'High Fantasy', 'Modern Thriller', 'Cozy Solarpunk'] as NarrativeMode[]).map(vibe => (
              <button
                key={vibe}
                onClick={() => { setSelectedVibe(vibe); playSound('click'); }}
                className={`px-4 py-3 rounded-lg border text-left flex justify-between items-center transition-all ${
                    selectedVibe === vibe
                    ? 'bg-surface-700 border-yellow-400 text-white shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                    : 'bg-surface-900 border-zinc-700 text-zinc-400 hover:bg-surface-800'
                }`}
              >
                  <span className="font-bold uppercase text-sm">{vibe}</span>
                  {selectedVibe === vibe && <span>✓</span>}
              </button>
          ))}
      </div>
  );

  const renderRewardSelection = () => (
      <div className="grid grid-cols-2 gap-2 mt-4 w-full animate-in fade-in slide-in-from-bottom-2">
          {['Gaming', 'Reading', 'Nature', 'Food', 'Socializing', 'Movies'].map(reward => (
              <button
                key={reward}
                onClick={() => { setSelectedReward(reward); playSound('click'); }}
                className={`p-3 rounded-lg border text-center transition-all ${
                    selectedReward === reward
                    ? 'bg-surface-700 border-neon-blue text-white shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                    : 'bg-surface-900 border-zinc-700 text-zinc-400 hover:bg-surface-800'
                }`}
              >
                  <span className="font-bold text-sm">{reward}</span>
              </button>
          ))}
      </div>
  );

  const currentStepData = steps[step];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </div>

        <div className="bg-surface-800 border border-zinc-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col transition-all duration-500">
          {/* Background Glow */}
          <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-transparent to-${currentStepData.color.split('-')[1] || 'white'}/10 pointer-events-none`}></div>

          <div key={step} className="flex-1 flex flex-col items-center justify-start pt-4 relative z-10 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
            <div className="text-6xl mb-6 animate-bounce">{currentStepData.icon}</div>
            
            <h2 className={`text-2xl font-black uppercase italic mb-4 ${currentStepData.color}`}>
              {currentStepData.title}
            </h2>
            
            <p className="text-zinc-300 text-sm leading-relaxed font-serif mb-4">
              {currentStepData.content}
            </p>

            {step === 0 && renderVibeSelection()}
            {step === 1 && renderRewardSelection()}
            {step === 3 && renderClassSelection()}
          </div>

          <div className="mt-8 relative z-10">
            <Button onClick={handleNext} fullWidth>
              {step === steps.length - 1 ? 'Begin Your Journey' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
