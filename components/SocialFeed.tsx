
import React, { useState } from 'react';
import { SocialPost, LeaderboardEntry } from '../types';

interface SocialFeedProps {
  posts: SocialPost[];
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ posts, leaderboard, currentUserId }) => {
  const [tab, setTab] = useState<'feed' | 'leaderboard'>('feed');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
        newLiked.delete(postId);
    } else {
        newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-2 p-1 bg-surface-800 rounded-lg mb-6 shadow-inner">
        <button 
            onClick={() => setTab('feed')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 ${tab === 'feed' ? 'bg-surface-600 text-white shadow-lg scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
            Activity Feed
        </button>
        <button 
            onClick={() => setTab('leaderboard')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 ${tab === 'leaderboard' ? 'bg-surface-600 text-white shadow-lg scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
            Global Rank
        </button>
      </div>

      {tab === 'feed' ? (
        <>
            <div className="bg-surface-800/50 p-4 rounded-lg border border-zinc-700 text-center mb-4 backdrop-blur-sm">
                <h3 className="text-neon-blue font-bold uppercase tracking-widest text-xs mb-1">Global Activity</h3>
                <p className="text-[10px] text-zinc-400">Live feed from explorers worldwide.</p>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 italic">Silence in the tavern...</div>
            ) : (
                posts.map((post, index) => (
                    <div 
                        key={post.id} 
                        className="bg-surface-800 rounded-xl overflow-hidden shadow-lg border border-zinc-800 mb-4 hover:border-zinc-600 transition-colors animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Header */}
                        <div className="p-3 flex items-center gap-3 border-b border-zinc-800 bg-surface-900/50">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xl border border-zinc-600 shadow-md">
                                {post.authorAvatar}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <h4 className={`font-bold text-sm ${post.isUser ? 'text-neon-blue' : 'text-white'}`}>
                                        {post.authorName}
                                    </h4>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${post.isUser ? 'border-neon-blue/30 text-neon-blue bg-neon-blue/10' : 'border-zinc-700 text-zinc-500 bg-zinc-900'}`}>
                                        {post.authorTitle}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-500">{post.timestamp}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
                                Completed quest: <span className="text-white font-bold decoration-neon-blue/50 underline decoration-2 underline-offset-2">"{post.questTitle}"</span>
                            </p>
                            
                            {post.image && (
                                <div className="rounded-lg overflow-hidden border border-zinc-700 aspect-video bg-black relative group cursor-pointer">
                                    <img src={post.image} alt="Quest Proof" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-neon-green border border-neon-green/30">
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Verified Proof</span>
                                        <span className="text-xs">✅</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-zinc-900/50 flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-800">
                            <button 
                                onClick={() => toggleLike(post.id)}
                                className={`flex items-center gap-1.5 transition-all active:scale-90 ${likedPosts.has(post.id) ? 'text-pink-500' : 'hover:text-pink-400'}`}
                            >
                                <span className={likedPosts.has(post.id) ? 'animate-bounce' : ''}>
                                    {likedPosts.has(post.id) ? '❤️' : '🤍'}
                                </span> 
                                <span className="font-mono">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                            </button>
                        </div>
                    </div>
                ))
            )}
            
            <div className="text-center py-8 opacity-50">
                <div className="w-2 h-2 bg-zinc-600 rounded-full mx-auto mb-1"></div>
                <div className="w-2 h-2 bg-zinc-600 rounded-full mx-auto mb-1 opacity-50"></div>
                <div className="w-2 h-2 bg-zinc-600 rounded-full mx-auto opacity-25"></div>
            </div>
        </>
      ) : (
        <div className="space-y-3">
            {leaderboard.map((entry, index) => {
                let rankStyle = "bg-surface-800 border-zinc-700 text-zinc-500";
                let rankIcon = `#${index + 1}`;
                
                if (index === 0) {
                    rankStyle = "bg-yellow-900/20 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
                    rankIcon = "👑";
                } else if (index === 1) {
                    rankStyle = "bg-zinc-800 border-zinc-400/50 text-zinc-300";
                    rankIcon = "🥈";
                } else if (index === 2) {
                    rankStyle = "bg-orange-900/20 border-orange-600/50 text-orange-400";
                    rankIcon = "🥉";
                }

                if (entry.isUser) {
                    rankStyle = "bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.1)]";
                }

                return (
                    <div 
                        key={entry.id} 
                        className={`flex items-center p-3 rounded-xl border-2 transition-transform hover:scale-[1.02] ${rankStyle}`}
                    >
                        <div className="font-bold text-xl w-10 text-center shrink-0">
                            {rankIcon}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-surface-900 flex items-center justify-center text-xl mx-3 border border-white/10 shadow-inner">
                            {entry.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm truncate ${entry.isUser ? 'text-neon-blue' : 'text-white'}`}>
                                {entry.name} {entry.isUser && '(You)'}
                            </h4>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider truncate">{entry.title}</p>
                        </div>
                        <div className="text-right pl-2">
                            <div className="font-mono font-bold text-white text-sm">{entry.xp.toLocaleString()} <span className="text-[10px] text-zinc-500">XP</span></div>
                            <div className="text-[9px] text-zinc-500 font-bold bg-black/30 px-1.5 py-0.5 rounded inline-block">Lvl {entry.level}</div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};
