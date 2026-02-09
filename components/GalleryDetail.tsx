import React, { useState, useEffect } from 'react';
import { SavedProject } from '../types';
import { createZipFromSteps, downloadBlob } from '../utils/zipUtils';
import { Download, Trash2, Edit, Package, Check, AlertTriangle } from 'lucide-react';

interface GalleryDetailProps {
  project: SavedProject | null;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
}

export const GalleryDetail: React.FC<GalleryDetailProps> = ({ project, onLoadProject, onDeleteProject }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'load' | null>(null);

  // Reset confirmation state when project changes
  useEffect(() => {
    setConfirmAction(null);
  }, [project?.id]);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-gray-600 p-8">
        <Package className="w-16 h-16 opacity-20 mb-4" />
        <p>Select a project from the gallery to view details.</p>
      </div>
    );
  }

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
        const blob = await createZipFromSteps(project.steps, project.generationMode);
        if (!blob) {
            alert("No approved images found in this project.");
            return;
        }
        downloadBlob(blob, `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`);
    } catch (e) {
        console.error(e);
        alert("Failed to create ZIP");
    } finally {
        setIsZipping(false);
    }
  };

  const handleActionClick = (action: 'delete' | 'load') => {
      if (confirmAction === action) {
          // Confirmed
          if (action === 'delete') onDeleteProject(project.id);
          if (action === 'load') onLoadProject(project);
          setConfirmAction(null);
      } else {
          // First click - Arm the button
          setConfirmAction(action);
          // Auto-reset after 3 seconds
          setTimeout(() => setConfirmAction((prev) => prev === action ? null : prev), 3000);
      }
  };

  const approvedSteps = project.steps.filter(s => s.isApproved);

  return (
    <div className="flex-1 flex flex-col bg-gray-950 h-full w-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white">{project.name}</h2>
           <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <span>{new Date(project.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="capitalize">{project.generationMode} Mode</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="text-primary-400">{project.imageSize} / {project.aspectRatio}</span>
           </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick('delete');
                }}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all min-w-[100px] justify-center
                    ${confirmAction === 'delete' 
                        ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                        : 'text-red-400 hover:text-red-300 hover:bg-red-900/20 border-transparent hover:border-red-900/50'}
                `}
            >
                {confirmAction === 'delete' ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                <span>{confirmAction === 'delete' ? 'Confirm?' : 'Delete'}</span>
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick('load');
                }}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all min-w-[140px] justify-center
                    ${confirmAction === 'load'
                        ? 'bg-green-600 text-white border-green-500'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800 border-gray-700'}
                `}
            >
                {confirmAction === 'load' ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{confirmAction === 'load' ? 'Click to Load' : 'Load to Editor'}</span>
            </button>

            <button
                type="button"
                onClick={(e) => {
                   e.stopPropagation();
                   handleDownloadZip();
                }}
                disabled={isZipping || approvedSteps.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
            >
                {isZipping ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download ZIP ({approvedSteps.length})</span>
            </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Approved Slides</h3>
        
        {approvedSteps.length === 0 ? (
            <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center text-gray-600">
                No approved images in this project. Load it to editor to generate or approve slides.
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.steps.map((step, idx) => {
                    if (!step.imageUrl || !step.isApproved) return null;
                    return (
                        <div key={step.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                            <img src={step.imageUrl} alt={`Slide ${idx+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a 
                                    href={step.imageUrl} 
                                    download={`project-${project.name}-slide-${idx}.png`}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
                                    title="Download Single"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                            <div className="absolute top-2 left-2">
                                <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Slide {idx + 1}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        <div className="mt-8 border-t border-gray-800 pt-6">
             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">All Generation Steps</h3>
             <div className="space-y-2">
                {project.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-800 text-sm">
                        <span className="font-mono text-gray-500 w-6">{idx + 1}</span>
                        <div className="w-10 h-10 bg-black rounded overflow-hidden shrink-0 border border-gray-700">
                            {step.imageUrl ? (
                                <img src={step.imageUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">?</div>
                            )}
                        </div>
                        <p className="flex-1 truncate text-gray-300">{step.prompt || "No prompt"}</p>
                        {step.isApproved && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};