import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, PlusCircle, Bot, User as UserIcon, Check, Copy, MessageSquare, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface IdeasChatProps {
  initialSystemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => Promise<void>;
  apiKey: string;
}

export const IdeasChat: React.FC<IdeasChatProps> = ({ initialSystemPrompt, onSaveSystemPrompt, apiKey }) => {
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'chat'>('form');

  // Form state
  const [pilar, setPilar] = useState('');
  const [angulo, setAngulo] = useState('');
  const [finalidad, setFinalidad] = useState('');
  const [cta, setCta] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [nicho, setNicho] = useState('');
  const [formato, setFormato] = useState('Carrusel');

  useEffect(() => {
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: systemPrompt || undefined,
        }
      });
      setMessages([]);
    }
  }, [apiKey, systemPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await onSaveSystemPrompt(systemPrompt);
    } catch (e) {
      alert('Failed to save system prompt');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setViewMode('form');
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: systemPrompt || undefined,
        }
      });
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const handleStartIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    // Reset chat
    setMessages([]);
    setInput('');
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: systemPrompt || undefined,
        }
      });
    }

    const userMessage = `Hola, el pilar que quiero es ${pilar} -> ${angulo}, mi fin es ${finalidad}, por favor que tengan el cta de ${cta} y que sean de ${cantidad} slides en lo posible. Mi nicho es ${nicho} y quiero un ${formato}.`;
    
    setMessages([{ role: 'user', text: userMessage }]);
    setViewMode('chat');
    setIsGenerating(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const modelReply = response.text || 'No response generated.';
      setMessages(prev => [...prev, { role: 'model', text: modelReply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsGenerating(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const modelReply = response.text || 'No response generated.';
      setMessages(prev => [...prev, { role: 'model', text: modelReply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 relative">
      {/* System Prompt Header */}
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Prompt (Ideas Persona)</label>
            {messages.length > 0 && (
              <button
                onClick={() => setViewMode(viewMode === 'form' ? 'chat' : 'form')}
                className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-900/20 px-2 py-1 rounded"
              >
                {viewMode === 'form' ? (
                  <><MessageSquare className="w-3 h-3" /> VER CHAT</>
                ) : (
                  <><FileText className="w-3 h-3" /> VER GENERADOR</>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are an expert content strategist..."
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none h-10 custom-scrollbar"
            />
            <button
              onClick={handleSavePrompt}
              disabled={isSavingPrompt}
              className="px-4 py-2 rounded-lg font-bold bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 flex items-center gap-2 transition-colors border border-gray-700"
            >
              {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary-500" />
              Generador de Ideas
            </h2>
            <form onSubmit={handleStartIdeas} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pilar</label>
                  <input type="text" required value={pilar} onChange={e => setPilar(e.target.value)} placeholder="Ej: Negocios" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ángulo</label>
                  <input type="text" required value={angulo} onChange={e => setAngulo(e.target.value)} placeholder="Ej: Innovación" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Finalidad del contenido</label>
                <input type="text" required value={finalidad} onChange={e => setFinalidad(e.target.value)} placeholder="Ej: Tener alcance, ganar seguidores..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de CTA</label>
                  <input type="text" required value={cta} onChange={e => setCta(e.target.value)} placeholder="Ej: Seguimiento" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cantidad de slides</label>
                  <input type="text" required value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Ej: 5" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nicho</label>
                <input type="text" required value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ej: Emprendedores que venden con contenido" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Formato</label>
                <select value={formato} onChange={e => setFormato(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 outline-none">
                  <option value="Carrusel">Carrusel</option>
                  <option value="Reel">Reel</option>
                </select>
              </div>

              <button type="submit" disabled={isGenerating} className="w-full mt-6 px-6 py-3 rounded-xl font-bold bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Generar Ideas
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-600' : 'bg-purple-600'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`flex-1 max-w-[80%] rounded-2xl p-4 relative group ${msg.role === 'user' ? 'bg-gray-900 border border-gray-800 text-gray-200' : 'bg-transparent text-gray-300'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                  ) : (
                    <>
                      <div className="markdown-body text-sm prose prose-invert max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                      <button
                        onClick={() => handleCopyMessage(msg.text, idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        title="Copy message"
                      >
                        {copiedMessageIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 max-w-[80%] rounded-2xl p-4 bg-transparent text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-none p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="flex gap-2 max-w-4xl mx-auto relative">
              <button
                onClick={handleNewChat}
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700"
                title="New Chat"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none max-h-32 custom-scrollbar"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className="p-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
