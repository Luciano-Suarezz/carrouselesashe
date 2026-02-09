
import React from 'react';
import { GenerationStep } from '../types';
import { Download, ZoomIn, Info, ChevronLeft, ChevronRight, ThumbsUp, RefreshCw, Check, Maximize2 } from 'lucide-react';

interface MainPreviewProps {
  step: GenerationStep | undefined;
  isGenerating: boolean;
  totalSteps: number;
  currentStepIndex: number;
  onNavigate: (direction: 'next' | 'prev') => void;
  onToggleApproval: () => void;
  onRegenerate: () => void;
}

export const MainPreview: React.FC<MainPreviewProps> = ({ 
    step, 
    isGenerating,
    totalSteps,
    currentStepIndex,
    onNavigate,
    onToggleApproval,
    onRegenerate
}) => {
  if (!step) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950 text-gray-600 select-none">
        <p>No step selected</p>
      </div>
    );
  }

  const hasImage = step.status === 'completed' && step.imageUrl;

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full w-full relative overflow-hidden">
      
      {/* 1. Main Viewport */}
      {/* Added min-h-0 to allow flex child to shrink properly within h-full container */}
      <div className="flex-1 relative flex items-center justify-center p-6 min-h-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-gray-950">
        
        {/* Navigation Arrows (Floating) */}
        {totalSteps > 1 && (
            <>
                <button 
                    onClick={() => onNavigate('prev')}
                    disabled={currentStepIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-0 z-20"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                    onClick={() => onNavigate('next')}
                    disabled={currentStepIndex === totalSteps - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-0 z-20"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </>
        )}

        {/* The Image Container */}
        {hasImage ? (
             <div className="relative w-full h-full flex items-center justify-center">
                <img
                    src={step.imageUrl}
                    alt="Result"
                    className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-2xl"
                />
                
                {step.isApproved && (
                    <div className="absolute top-0 right-0 m-2">
                        <span className="bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md shadow-lg">
                            <Check className="w-3 h-3" /> APPROVED
                        </span>
                    </div>
                )}
             </div>
        ) : step.status === 'pending' ? (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
                <p className="font-mono text-primary-400 text-sm">RENDERING...</p>
                <p className="text-xs text-gray-500">Gemini 3 Pro is processing visuals</p>
            </div>
          </div>
        ) : step.status === 'failed' ? (
            <div className="text-center max-w-sm">
                <p className="text-red-400 font-bold mb-2">Generation Failed</p>
                <p className="text-gray-500 text-sm mb-4">{step.error}</p>
                <button onClick={onRegenerate} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm text-white">Retry</button>
            </div>
        ) : (
          <div className="text-gray-700 flex flex-col items-center gap-2">
             <ZoomIn className="w-12 h-12 opacity-20" />
             <p className="text-sm font-medium">Ready to Generate</p>
          </div>
        )}
      </div>

      {/* 2. HUD / Controls Bar (Bottom) */}
      <div className="h-14 shrink-0 border-t border-gray-800 bg-gray-900/80 backdrop-blur flex items-center justify-between px-6 z-20 relative">
         
         {/* Left: Info */}
         <div className="flex items-center gap-4 text-xs text-gray-400 overflow-hidden">
            <span className="font-mono font-bold text-gray-200">
                {currentStepIndex + 1} <span className="text-gray-600">/</span> {totalSteps}
            </span>
            <div className="h-4 w-px bg-gray-700" />
            <span className="truncate max-w-[150px] md:max-w-sm">{step.prompt || "Empty Prompt"}</span>
         </div>

         {/* Right: Actions */}
         <div className="flex items-center gap-2">
            {hasImage && (
                <>
                    <button
                        onClick={onRegenerate}
                        disabled={isGenerating}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        title="Regenerate"
                    >
                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <a 
                        href={step.imageUrl} 
                        download={`generated-${step.id}.png`}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </a>

                    <div className="h-4 w-px bg-gray-700 mx-1" />

                    <button
                        onClick={onToggleApproval}
                        className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all
                            ${step.isApproved 
                                ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}
                        `}
                    >
                        <ThumbsUp className="w-3 h-3 mb-0.5" />
                        {step.isApproved ? 'APPROVED' : 'APPROVE'}
                    </button>
                </>
            )}
            
            {!hasImage && step.status !== 'pending' && step.prompt && (
                 <button
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white transition-all"
                >
                    <RefreshCw className="w-3 h-3" /> GENERATE THIS SLIDE
                </button>
            )}
         </div>
      </div>
    </div>
  );
};
