import React, { useState, useRef, useEffect } from 'react';
import { NPCMessage } from '../types';
import { chatWithNPC } from '../services/geminiService';
import { Button } from './Button';

interface NPCDialogProps {
  isOpen: boolean;
  onClose: () => void;
  npcName: string;
}

export const NPCDialog: React.FC<NPCDialogProps> = ({ isOpen, onClose, npcName }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<NPCMessage[]>([
      { id: 'init', sender: 'npc', text: "Greetings, Traveler! Pull up a chair. What tales do you bring from the outside world?" }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: NPCMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Prepare history for context
    const history = messages.map(m => ({ sender: m.sender, text: m.text })).slice(-5);
    
    const responseText = await chatWithNPC(npcName, userMsg.text, history);
    
    const npcMsg: NPCMessage = { id: (Date.now() + 1).toString(), sender: 'npc', text: responseText };
    setMessages(prev => [...prev, npcMsg]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-900 w-full max-w-md rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col h-[60vh]">
        
        {/* Header */}
        <div className="bg-surface-800 p-4 border-b border-zinc-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center text-xl">
                🧙‍♂️
            </div>
            <div>
              <h3 className="font-bold text-white">{npcName}</h3>
              <p className="text-xs text-indigo-300">Tavern Keeper</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-neon-blue text-black rounded-br-none font-medium' 
                  : 'bg-surface-700 text-zinc-100 rounded-bl-none border border-zinc-600'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
                 <div className="bg-surface-700 px-4 py-2 rounded-xl rounded-bl-none border border-zinc-600">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
             </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-surface-800 border-t border-zinc-700 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Say something..."
            className="flex-1 bg-surface-900 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading} className="px-4">
             ➤
          </Button>
        </div>
      </div>
    </div>
  );
};