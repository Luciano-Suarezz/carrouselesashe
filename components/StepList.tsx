
import React, { useState } from 'react';
import { GenerationStep, GenerationMode } from '../types';
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Check, User, Wand2, Sparkles, GripVertical } from 'lucide-react';
import { refinePrompt } from '../services/geminiService';

interface StepListProps {
  steps: GenerationStep[];
  isGenerating: boolean;
  currentStepIndex: number;
  generationMode: GenerationMode;
  onAddStep: () => void;
  onUpdateStep: (id: string, prompt: string) => void;
  onRemoveStep: (id: string) => void;
  onSelectStep: (index: number) => void;
  onToggleSubject: (id: string) => void;
  selectedIndex: number;
  subjectAvailable: boolean;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  isGenerating,
  currentStepIndex,
  generationMode,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onSelectStep,
  onToggleSubject,
  selectedIndex,
  subjectAvailable
}) => {
  const [refiningId, setRefiningId] = useState<string | null>(null);

  const handleRefine = async (e: React.MouseEvent, id: string, currentPrompt: string) => {
    e.stopPropagation();
    if (!currentPrompt.trim()) return;
    setRefiningId(id);
    try {
      const refined = await refinePrompt(currentPrompt);
      onUpdateStep(id, refined);
    } finally {
      setRefiningId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 w-full">
      {/* Mini Header / Timeline Status */}
      <div className="px-3 py-2 border-b border-gray-800 bg-gray-950 flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
          <span>Sequencer</span>
          <span>{steps.filter(s => s.isApproved).length} / {steps.length} Approved</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {steps.map((step, index) => {
            const isSwitchOn = !!step.useSubject;
            const isActive = index === selectedIndex;
            const hasImage = step.status === 'completed' && step.imageUrl;

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(index)}
                className={`
                  group relative flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-gray-800 border-primary-500/50 shadow-md z-10' 
                    : 'bg-transparent border-transparent hover:bg-gray-900 hover:border-gray-800'}
                `}
              >
                {/* 1. Status / Index / Thumb Column */}
                <div className="shrink-0 flex flex-col items-center gap-1 mt-1">
                   {/* Status Indicator / Number */}
                   <div className={`
                     w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors
                     ${step.isApproved 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : isActive 
                            ? 'bg-primary-500 text-white border-primary-400' 
                            : 'bg-gray-800 text-gray-500 border-gray-700'}
                   `}>
                     {step.isApproved ? <Check className="w-3 h-3" /> : index === 0 ? "B" : index}
                   </div>
                   
                   {/* Connection Line */}
                   {index < steps.length - 1 && (
                      <div className="w-px h-full min-h-[40px] bg-gray-800 my-1" />
                   )}
                </div>

                {/* 2. Content Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Header Row: Type & Tools */}
                    <div className="flex justify-between items-center h-5">
                         <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                            {index === 0 ? "Background / Base" : `Slide ${index}`}
                         </span>
                         
                         {/* Hover Tools - MODIFIED: Visible if isActive OR isSwitchOn (subject enabled) */}
                         <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive || isSwitchOn ? 'opacity-100' : ''}`}>
                             <button
                                onClick={(e) => handleRefine(e, step.id, step.prompt)}
                                disabled={!step.prompt.trim() || refiningId === step.id}
                                className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-primary-400"
                                title="AI Refine"
                             >
                                {refiningId === step.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                             </button>

                             {subjectAvailable && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleSubject(step.id); }}
                                    className={`p-1 rounded transition-colors ${isSwitchOn ? 'text-primary-400 bg-primary-500/10' : 'text-gray-600 hover:bg-gray-700'}`}
                                    title="Toggle Subject Consistency"
                                >
                                    <User className="w-3 h-3" />
                                </button>
                             )}

                             {!isGenerating && steps.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveStep(step.id); }}
                                    className="p-1 hover:bg-red-900/30 rounded text-gray-600 hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                             )}
                         </div>
                    </div>

                    <div className="flex gap-3">
                        {/* Thumbnail (Left of text) */}
                        <div className={`
                            shrink-0 w-12 h-12 rounded bg-black border border-gray-800 overflow-hidden relative
                            ${hasImage ? '' : 'flex items-center justify-center'}
                        `}>
                            {hasImage ? (
                                <img src={step.imageUrl} className="w-full h-full object-cover" alt="Thumb" />
                            ) : step.status === 'pending' ? (
                                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                            ) : step.status === 'failed' ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                                <div className="w-full h-full bg-gray-900" />
                            )}
                        </div>

                        {/* Text Input */}
                        <textarea
                            disabled={isGenerating && step.status !== 'idle'}
                            value={step.prompt}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateStep(step.id, e.target.value)}
                            placeholder={index === 0 ? "Describe the background scene..." : "Describe this slide..."}
                            className={`
                                flex-1 bg-transparent border-none p-0 text-xs text-gray-300 placeholder-gray-600 focus:ring-0 resize-none leading-relaxed
                                ${isActive ? 'h-20' : 'h-12 text-gray-500'}
                                transition-all
                            `}
                        />
                    </div>
                </div>
              </div>
            );
        })}

        <button
          onClick={onAddStep}
          disabled={isGenerating}
          className="w-full py-2 mt-2 border border-dashed border-gray-800 rounded-lg text-gray-600 hover:text-gray-400 hover:border-gray-700 hover:bg-gray-900 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus className="w-3 h-3" /> Add Step
        </button>
      </div>
    </div>
  );
};
