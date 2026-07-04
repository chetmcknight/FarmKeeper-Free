import React, { useState, useEffect, useRef } from 'react';
import { getFarmingAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';
import { backend } from '../services/mockBackend';

// Simple text formatter for better readability (no markdown, clean look)
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  
  // Split by newlines to handle paragraphs
  const paragraphs = text.split('\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Check for bullet points
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        const content = isBullet ? trimmed.substring(2) : trimmed;

        // Parse bolding (**text**)
        const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
               <span className="text-green-400 mt-1.5 text-[8px]">●</span>
               <span className="leading-relaxed">{parts}</span>
            </div>
          );
        }

        return <p key={i} className="leading-relaxed">{parts}</p>;
      })}
    </div>
  );
};

interface ChatWidgetProps {
  isHidden?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isHidden = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: "Hi there! 👋 I'm here to help!", 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [farmContext, setFarmContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Refresh context when opening chat to ensure latest data
      loadContext();
    }
  }, [messages, isOpen]);

  const loadContext = async () => {
    try {
        const [crops, animals, farmhands] = await Promise.all([
            backend.getCrops(),
            backend.getAnimals(),
            backend.getFarmhands()
        ]);
        
        let contextStr = "";
        if (crops.length > 0) {
            contextStr += "CROPS:\n";
            crops.forEach(c => {
                contextStr += `- ${c.name} (${c.variety || 'Unknown Variety'}): Planted ${c.plantedDate}, Status: ${c.status}. ${c.history.length > 0 ? `Latest Activity: ${c.history[c.history.length-1].type}` : ''}\n`;
            });
        } else {
            contextStr += "CROPS: None registered.\n";
        }

        if (animals.length > 0) {
            contextStr += "\nLIVESTOCK:\n";
            animals.forEach(a => {
                contextStr += `- ${a.name} (${a.type} - ${a.breed}): Status: ${a.status}, Gender: ${a.gender}, Weight: ${a.weight || 'N/A'}.\n`;
            });
        } else {
            contextStr += "\nLIVESTOCK: None registered.\n";
        }

        if (farmhands.length > 0) {
            contextStr += "\nFARMHANDS:\n";
            farmhands.forEach(f => {
                contextStr += `- ${f.name} (${f.role}): Status: ${f.status}.\n`;
            });
        }

        setFarmContext(contextStr);
    } catch (e) {
        console.error("Failed to load farm context", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for context
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await getFarmingAdvice(userMsg.text, history, farmContext);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (isHidden) return null;
  return (
    <div className="flex fixed bottom-20 md:bottom-10 right-6 z-50 flex-col items-end pointer-events-none font-sans">
      {/* Chat Window */}
      <div 
        className={`pointer-events-auto bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-green-100 flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right mb-10 mr-2 overflow-hidden
        ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none h-0'}`}
        style={{ maxHeight: '600px', height: '70vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-green-100">
              🧑‍🌾
            </div>
            <div>
              <h3 className="text-white font-bold text-base">FarmKeeper Free</h3>
              <div className="flex items-center gap-1.5">
                 <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                 <span className="text-green-50 text-xs font-medium">Advisor Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-green-100 hover:text-white transition-colors bg-white/10 p-1 rounded-full hover:bg-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}
              >
                <FormattedText text={msg.text} />
                 {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs opacity-70 mb-1 font-semibold uppercase">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((source, idx) => (
                          <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-700 underline bg-blue-50 px-2 py-0.5 rounded">
                            {source.title || 'Source'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about crops, pests, or weather..."
              className="flex-1 border border-gray-200 bg-gray-50 text-gray-900 rounded-full px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-inner placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5 transform rotate-90 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button Container */}
      <div className="relative pointer-events-auto flex items-center justify-end">
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 border-4 border-white
            ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-gradient-to-br from-green-500 to-green-700 text-white'}`}
            style={{ willChange: 'transform' }} 
        >
            {isOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                // Use a fixed flex container to prevent jitter
                <div className="flex items-center justify-center w-full h-full">
                     <span className="text-4xl md:text-5xl leading-none filter drop-shadow-sm pb-1 pl-1">🧑‍🌾</span>
                </div>
            )}
        </button>
      </div>
    </div>
  );
};