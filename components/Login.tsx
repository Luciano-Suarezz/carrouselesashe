
import React, { useState, useEffect } from 'react';
import { AirtableConfig, CloudinaryConfig } from '../types';
import { validateGeminiKey } from '../services/geminiService';
import { Database, User, ArrowRight, Loader2, AlertCircle, Key, Settings } from 'lucide-react';

interface LoginProps {
  onLogin: (airtableConfig: AirtableConfig, cloudinaryConfig: CloudinaryConfig, username: string, apiKey: string) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Determine if config is missing from environment
  const envAirtableKey = import.meta.env.VITE_AIRTABLE_API_KEY || '';
  const envAirtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
  const envCloudinaryName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const envCloudinaryPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

  const isConfigMissing = !envAirtableKey || !envAirtableBaseId || !envCloudinaryName;

  // Dynamic Config State (only used if missing)
  const [atApiKey, setAtApiKey] = useState('');
  const [atBaseId, setAtBaseId] = useState('');
  const [clCloudName, setClCloudName] = useState('');
  const [clUploadPreset, setClUploadPreset] = useState('');
  
  const [showConfig, setShowConfig] = useState(isConfigMissing);
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

    // Use environment config if available, otherwise use manual inputs
    const finalAtApiKey = envAirtableKey || atApiKey;
    const finalAtBaseId = envAirtableBaseId || atBaseId;
    const finalClCloudName = envCloudinaryName || clCloudName;
    const finalClUploadPreset = envCloudinaryPreset || clUploadPreset;

    if (!finalAtApiKey || !finalAtBaseId || !finalClCloudName || !finalClUploadPreset) {
        setError("Missing System Configuration. Please fill in all Airtable and Cloudinary keys.");
        setShowConfig(true);
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
            { apiKey: finalAtApiKey, baseId: finalAtBaseId },
            { cloudName: finalClCloudName, uploadPreset: finalClUploadPreset },
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
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="p-3 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl shadow-lg shadow-primary-500/20">
                    <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter">Carru <span className="not-italic text-gray-500 text-lg font-medium">Cloud Hub</span></h1>
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

                {/* Advanced / Missing Config Section */}
                {isConfigMissing && (
                    <div className="pt-4 border-t border-gray-800">
                        <button 
                            type="button"
                            onClick={() => setShowConfig(!showConfig)}
                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4 w-full justify-center"
                        >
                            <Settings className="w-3 h-3" />
                            {showConfig ? 'Hide Configuration' : 'Manual Configuration'}
                        </button>

                        {showConfig && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Airtable API Key</label>
                                        <input 
                                            type="password" 
                                            value={atApiKey}
                                            onChange={e => setAtApiKey(e.target.value)}
                                            placeholder="pat..."
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Airtable Base ID</label>
                                        <input 
                                            type="text" 
                                            value={atBaseId}
                                            onChange={e => setAtBaseId(e.target.value)}
                                            placeholder="app..."
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Cloudinary Cloud Name</label>
                                        <input 
                                            type="text" 
                                            value={clCloudName}
                                            onChange={e => setClCloudName(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Cloudinary Upload Preset</label>
                                        <input 
                                            type="text" 
                                            value={clUploadPreset}
                                            onChange={e => setClUploadPreset(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-yellow-600/80 italic text-center">
                                    Configuration keys are required if not set in environment
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-xs break-all">
                        {error.includes('config.ts') || error.includes('Configuration') ? <Settings className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
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
                {isConfigMissing ? 'Manual Configuration Mode' : 'System Configuration is securely loaded'}
            </p>
        </div>
    </div>
  );
};
