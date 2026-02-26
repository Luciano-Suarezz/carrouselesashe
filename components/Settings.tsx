
import React, { useRef, useState } from 'react';
import { ImageSize, AspectRatio, GenerationMode, ImageModel } from '../types';
import { Settings as SettingsIcon, Monitor, Maximize, Layers, Route, User, Upload, X, Save, Check, Loader2, Sparkles, Cpu } from 'lucide-react';

interface SettingsProps {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  generationMode: GenerationMode;
  imageModel: ImageModel;
  subjectImage: string | null;
  onSizeChange: (size: ImageSize) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onModeChange: (mode: GenerationMode) => void;
  onModelChange: (model: ImageModel) => void;
  onSubjectImageChange: (base64: string | null) => void;
  onSaveSubjectToProfile?: (base64: string) => Promise<void>;
  disabled: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  imageSize,
  aspectRatio,
  generationMode,
  imageModel,
  subjectImage,
  onSizeChange,
  onAspectRatioChange,
  onModeChange,
  onModelChange,
  onSubjectImageChange,
  onSaveSubjectToProfile,
  disabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onSubjectImageChange(base64String);
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToProfile = async () => {
      if (!subjectImage || !onSaveSubjectToProfile) return;
      setIsSavingSubject(true);
      try {
          await onSaveSubjectToProfile(subjectImage);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
      } catch (e) {
          alert("Failed to save subject to Airtable.");
          console.error(e);
      } finally {
          setIsSavingSubject(false);
      }
  };

  return (
    <div className="bg-gray-950 border-b border-gray-800 p-3 flex flex-col gap-3 text-xs select-none">
      
      {/* Top Row: Mode & Global Settings Label */}
      <div className="flex items-center justify-between">
         <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-800">
              <button
                onClick={() => onModeChange('carousel')}
                disabled={disabled}
                className={`px-3 py-1 rounded-[4px] font-medium transition-all flex items-center gap-1.5
                  ${generationMode === 'carousel' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
                `}
                title="Carousel Mode: Step 1 is background"
              >
                <Layers className="w-3 h-3" /> Carousel
              </button>
              <button
                onClick={() => onModeChange('sequential')}
                disabled={disabled}
                className={`px-3 py-1 rounded-[4px] font-medium transition-all flex items-center gap-1.5
                  ${generationMode === 'sequential' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}
                `}
                title="Sequential Mode: Chain reaction"
              >
                <Route className="w-3 h-3" /> Chain
              </button>
         </div>

         {/* Compact Tech Specs */}
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded px-1">
                <Maximize className="w-3 h-3 text-gray-500 mr-1" />
                <select 
                    value={imageSize}
                    onChange={(e) => onSizeChange(e.target.value as ImageSize)}
                    disabled={disabled}
                    className="bg-transparent border-none text-gray-300 focus:ring-0 py-1 pl-0 pr-4 text-[10px] font-mono cursor-pointer"
                >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                </select>
            </div>
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded px-1">
                <Monitor className="w-3 h-3 text-gray-500 mr-1" />
                <select 
                    value={aspectRatio}
                    onChange={(e) => onAspectRatioChange(e.target.value as AspectRatio)}
                    disabled={disabled}
                    className="bg-transparent border-none text-gray-300 focus:ring-0 py-1 pl-0 pr-4 text-[10px] font-mono cursor-pointer"
                >
                    <option value="1:1">1:1</option>
                    <option value="4:5">4:5</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                </select>
            </div>
         </div>
      </div>

      {/* Model Selection Row */}
      <div className="flex items-center bg-gray-900 border border-gray-800 rounded px-2 py-1.5">
          <Cpu className="w-3 h-3 text-gray-500 mr-2" />
          <select 
              value={imageModel}
              onChange={(e) => onModelChange(e.target.value as ImageModel)}
              disabled={disabled}
              className="bg-transparent border-none text-gray-300 focus:ring-0 py-0 pl-0 pr-4 text-[10px] font-bold cursor-pointer flex-1"
          >
              <option value="gemini-3.1-flash-image-preview">Nano Banana 2 (Flash)</option>
              <option value="gemini-3-pro-image-preview">Nano Banana Pro (High Quality)</option>
          </select>
      </div>

      {/* Subject Reference - Compact Row */}
      <div className={`
        relative flex items-center gap-3 p-2 rounded-lg border transition-all
        ${subjectImage ? 'bg-primary-900/10 border-primary-500/30' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}
      `}>
         
         {/* Thumbnail / Upload Icon */}
         <div className="shrink-0">
             {subjectImage ? (
                 <div className="w-8 h-8 rounded bg-black border border-gray-700 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     <img src={subjectImage} alt="Ref" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                        <Upload className="w-3 h-3 text-white" />
                     </div>
                 </div>
             ) : (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
                 >
                    <User className="w-4 h-4 text-gray-500" />
                 </button>
             )}
         </div>

         {/* Info & Actions */}
         <div className="flex-1 min-w-0 flex justify-between items-center">
            <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${subjectImage ? 'text-primary-400' : 'text-gray-500'}`}>
                    {subjectImage ? 'Consistent Character Active' : 'No Subject Reference'}
                </span>
                <span className="text-[9px] text-gray-500 truncate">
                    {subjectImage ? 'Applied to enabled steps' : 'Upload to maintain face/style'}
                </span>
            </div>

            {subjectImage && (
                <div className="flex items-center gap-1">
                    {onSaveSubjectToProfile && (
                        <button 
                            onClick={handleSaveToProfile}
                            disabled={isSavingSubject || saveSuccess}
                            title="Save to Cloud Profile"
                            className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${saveSuccess ? 'text-green-400' : 'text-gray-400'}`}
                        >
                            {isSavingSubject ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                        </button>
                    )}
                    <button
                        onClick={() => onSubjectImageChange(null)}
                        disabled={disabled}
                        title="Remove Subject"
                        className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
         </div>

         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
        />
      </div>
    </div>
  );
};
