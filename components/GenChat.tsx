import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, PlusCircle, Bot, User as UserIcon, Check, Upload, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { parseImportText } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface GenChatProps {
  initialSystemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => Promise<void>;
  onImportPrompts: (background: string | undefined, slides: string[]) => void;
  apiKey: string;
}

export const GenChat: React.FC<GenChatProps> = ({ initialSystemPrompt, onSaveSystemPrompt, onImportPrompts, apiKey }) => {
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store the chat instance
  const chatRef = useRef<any>(null);

  // Initialize chat when component mounts or system prompt changes
  useEffect(() => {
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview', // Using pro for complex reasoning
        config: {
          systemInstruction: systemPrompt || undefined,
        }
      });
      // Reset messages when system prompt changes
      setMessages([]);
    }
  }, [apiKey, systemPrompt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await onSaveSystemPrompt(systemPrompt);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save system prompt');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleNewChat = () => {
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
      console.error('Chat error:', error);
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

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const result = await parseImportText(importText);
      onImportPrompts(result.background, result.slides);
      setIsImportModalOpen(false);
      setImportText('');
    } catch (error) {
      alert("Failed to process text. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 relative">
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-500" />
                Import to Editor
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-400 mb-4">
                Paste your generated prompts here. We will automatically extract the background and the slides and import them into the Editor.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste raw text here..."
                className="w-full h-64 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none custom-scrollbar"
              />
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim() || isImporting}
                className="px-6 py-2 rounded-lg font-bold bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Process & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Prompt Header */}
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Prompt (AI Persona)</label>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-900/20 px-2 py-1 rounded"
            >
              <Upload className="w-3 h-3" />
              IMPORT TO EDITOR
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g., You are an expert carousel slide generator..."
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none h-20 custom-scrollbar"
            />
            <button
              onClick={handleSavePrompt}
              disabled={isSavingPrompt || saveSuccess}
              className={`flex-none px-4 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                saveSuccess ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              }`}
            >
              {isSavingPrompt ? <Loader2 className="w-5 h-5 animate-spin mb-1" /> : saveSuccess ? <Check className="w-5 h-5 mb-1" /> : <Save className="w-5 h-5 mb-1" />}
              <span className="text-[10px] uppercase tracking-wider">{saveSuccess ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <Bot className="w-16 h-16 mb-4" />
            <p className="text-sm">Start a conversation to generate slide ideas.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-600' : 'bg-purple-600'}`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`flex-1 max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-gray-900 border border-gray-800 text-gray-200' : 'bg-transparent text-gray-300'}`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                ) : (
                  <div className="markdown-body text-sm prose prose-invert max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex gap-4">
            <div className="flex-none w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-[80%] rounded-2xl p-4 bg-transparent text-gray-300 flex items-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <span className="ml-3 text-sm text-gray-500 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 border-t border-gray-800 bg-gray-950">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button
            onClick={handleNewChat}
            title="New Chat"
            className="p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border border-gray-800"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none max-h-32 custom-scrollbar"
              rows={1}
              style={{ minHeight: '46px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
