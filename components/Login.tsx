
import React, { useState, useEffect } from 'react';
import { AirtableConfig, CloudinaryConfig } from '../types';
import { validateGeminiKey } from '../services/geminiService';
import { CONFIG } from '../config';
import { Database, User, ArrowRight, Loader2, AlertCircle, Key, Settings } from 'lucide-react';

interface LoginProps {
  onLogin: (airtableConfig: AirtableConfig, cloudinaryConfig: CloudinaryConfig, username: string, apiKey: string) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load username from cache for convenience
    const cachedUser = localStorage.getItem('sia_username');
    if (cachedUser) setUsername(cachedUser);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !apiKey) return;

    // Check if config is set up
    if (!CONFIG.AIRTABLE.API_KEY || !CONFIG.AIRTABLE.BASE_ID || !CONFIG.CLOUDINARY.CLOUD_NAME) {
        setError("Missing System Configuration. Please fill in your keys in the 'config.ts' file.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        // 1. Validate the Gemini API Key first
        const isGeminiValid = await validateGeminiKey(apiKey);
        if (!isGeminiValid) {
            throw new Error("Invalid or inactive Gemini API Key. Please check your key.");
        }

        // 2. Proceed with Airtable Login if Gemini key is valid
        await onLogin(
            { apiKey: CONFIG.AIRTABLE.API_KEY, baseId: CONFIG.AIRTABLE.BASE_ID },
            { cloudName: CONFIG.CLOUDINARY.CLOUD_NAME, uploadPreset: CONFIG.CLOUDINARY.UPLOAD_PRESET },
            username,
            apiKey
        );
    } catch (err: any) {
        console.error("Login caught error:", err);
        setError(err.message || "Failed to connect. Open console (F12) for details.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="p-3 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl shadow-lg shadow-primary-500/20">
                    <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter">S.I.A. <span className="not-italic text-gray-500 text-lg font-medium">Cloud Hub</span></h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> User Profile
                    </label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4" /> Gemini API Key
                    </label>
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-600">
                        This key will be validated and used for this session only.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-xs break-all">
                        {error.includes('config.ts') ? <Settings className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading || !username || !apiKey}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Connect & Initialize <ArrowRight className="w-5 h-5" /></>}
                </button>
            </form>
            
            <p className="text-center text-[10px] text-gray-600 mt-6">
                Keys loaded securely from config.ts
            </p>
        </div>
    </div>
  );
};
