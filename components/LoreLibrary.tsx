
import React, { useState } from 'react';
import { LoreEntry, LoreCategory } from '../types';
import { Button } from './Button';

interface LoreLibraryProps {
  entries: LoreEntry[];
  onResearch: (category: LoreCategory) => void;
  loading: boolean;
}

export const LoreLibrary: React.FC<LoreLibraryProps> = ({ entries, onResearch, loading }) => {
  const [activeTab, setActiveTab] = useState<LoreCategory>('bestiary');

  const filteredEntries = entries.filter(e => e.category === activeTab);

  const getTabLabel = (cat: LoreCategory) => {
    switch (cat) {
      case 'bestiary': return '🧬 Bestiary';
      case 'history': return '⏳ History';
      case 'library': return '📜 Library';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="text-center mb-6">
          <h2 className="text-3xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            The Archives
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">WORLD_DATABASE // DECRYPTING...</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-800 p-1 rounded-xl mb-6 shadow-inner border border-zinc-700">
        {(['bestiary', 'history', 'library'] as LoreCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
              activeTab === cat 
                ? 'bg-surface-600 text-white shadow-lg' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-700/50'
            }`}
          >
            {getTabLabel(cat)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4 min-h-[50vh]">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
             <span className="text-4xl mb-4 opacity-30">
               {activeTab === 'bestiary' ? '🦕' : activeTab === 'history' ? '⌛' : '📚'}
             </span>
             <p className="text-sm mb-4">No records found in this sector.</p>
             <Button 
                variant="secondary" 
                onClick={() => onResearch(activeTab)} 
                loading={loading}
                className="text-xs"
             >
                Research Data
             </Button>
          </div>
        ) : (
          <>
             {/* List of Entries */}
             <div className="grid grid-cols-1 gap-4">
               {filteredEntries.map((entry) => (
                 <div key={entry.id} className="bg-surface-800 border border-zinc-700 rounded-xl p-4 shadow-lg hover:border-emerald-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-surface-900 border border-zinc-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                           {entry.icon}
                         </div>
                         <div>
                            <h3 className="font-bold text-white leading-tight">{entry.title}</h3>
                            <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">{entry.subtitle}</p>
                         </div>
                      </div>
                      <div className="text-[9px] text-zinc-500 bg-black/40 px-2 py-1 rounded">
                        {new Date(entry.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="bg-surface-900/50 p-3 rounded-lg text-sm text-zinc-300 leading-relaxed font-serif italic mb-3 border-l-2 border-zinc-700">
                       "{entry.content}"
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {entry.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-600 text-zinc-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                 </div>
               ))}
             </div>
             
             {/* Add More Button */}
             <div className="pt-4 flex justify-center">
                 <Button 
                    variant="ghost" 
                    onClick={() => onResearch(activeTab)} 
                    loading={loading}
                    className="text-xs border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400"
                 >
                    + Discover More {getTabLabel(activeTab)}
                 </Button>
             </div>
          </>
        )}
      </div>
    </div>
  );
};
