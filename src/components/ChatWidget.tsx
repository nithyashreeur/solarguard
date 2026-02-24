import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, MicOff, X, User, Bot, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse, connectLiveAssistant, getFastChatResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface Props {
  context: string;
}

export default function ChatWidget({ context }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hello! I am your SolarGuard Assistant. How can I help you with your battery today?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);

  // Web Speech API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg: Message = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = isLiveMode 
        ? await getFastChatResponse(messageText, context)
        : await getChatResponse(messageText, context);
        
      const botMsg: Message = { role: 'bot', text: response || 'Sorry, I encountered an error.' };
      setMessages(prev => [...prev, botMsg]);
      speak(botMsg.text);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl border border-zinc-200 flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex-shrink-0 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold leading-none">SolarGuard AI</span>
                  <span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`p-1.5 rounded-lg transition-colors ${isLiveMode ? 'bg-white text-emerald-600' : 'hover:bg-white/10'}`}
                  title="Toggle Live Mode"
                >
                  <Radio size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
              {isLiveMode && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Voice Assistant Active</span>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zinc-200 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend('')}
                    placeholder="Ask about your battery..."
                    className="w-full py-3 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-2xl transition-all ${
                    isListening 
                      ? 'bg-emerald-100 text-emerald-600 animate-pulse ring-4 ring-emerald-500/20' 
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                  onClick={() => handleSend('')}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Pulsing Green Animation for Voice Mode */}
      {isListening && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[60]">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-40 h-40 bg-emerald-500 rounded-full blur-3xl"
          />
        </div>
      )}
    </div>
  );
}
