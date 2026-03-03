import React, { useState, useEffect, useRef } from 'react';
import { getFarmingAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';
import { backend } from '../services/mockBackend';

// Shared formatter (ideally moved to a util file, but kept here for stability)
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const paragraphs = text.split('\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        const content = isBullet ? trimmed.substring(2) : trimmed;

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

export const AIGuide: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: "Hello, I'm your farm keeper. How can I help you today?", timestamp: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const [farmContext, setFarmContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load farm data for context
  useEffect(() => {
    const loadContext = async () => {
        try {
            const [crops, animals] = await Promise.all([
                backend.getCrops(),
                backend.getAnimals()
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
            setFarmContext(contextStr);
        } catch (e) {
            console.error("Failed to load farm context", e);
        }
    };
    loadContext();
  }, []);

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
      // Prepare history for Gemini
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
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to the server. Please check your internet connection or API Key.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Height calculation: 100vh - (Mobile Nav Height ~80px) on mobile, Full height on Desktop
    // Mobile Nav is typically 5rem (20 * 0.25rem = 5rem). 
    // We use calc(100dvh - 5rem) to ensure it fits exactly in the viewport above the nav.
    <div className="flex flex-col bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-200 overflow-hidden h-[calc(100dvh-5rem)] md:h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-green-50 shrink-0">
        <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          FarmKeeper Pro
        </h2>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-green-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <FormattedText text={msg.text} />
              
              {/* Sources if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                      >
                        {source.title || 'Link'}
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
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about weather, pests, or planting..."
            className="flex-1 border border-gray-200 bg-gray-50 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};