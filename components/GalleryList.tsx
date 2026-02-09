
import React from 'react';
import { SavedProject } from '../types';
import { Layers, Calendar, ChevronRight, ImageIcon } from 'lucide-react';

interface GalleryListProps {
  projects: SavedProject[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export const GalleryList: React.FC<GalleryListProps> = ({ projects, selectedProjectId, onSelectProject }) => {
  if (projects.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <Layers className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm font-medium">No saved projects yet</p>
        <p className="text-xs mt-2 max-w-[200px]">Create a sequence and save it to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 w-full overflow-y-auto p-3 space-y-2 custom-scrollbar">
      {projects.map((project) => {
        const firstImage = project.steps.find(s => s.imageUrl)?.imageUrl;
        const approvedCount = project.steps.filter(s => s.isApproved).length;

        return (
            <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`
                group relative w-full text-left p-2 rounded-lg border transition-all duration-200
                flex items-start gap-3
                ${selectedProjectId === project.id 
                    ? 'bg-gray-800 border-primary-500/50 ring-1 ring-primary-500/20 shadow-lg' 
                    : 'bg-gray-800/40 border-gray-800 hover:bg-gray-800 hover:border-gray-700'}
            `}
            >
                {/* Thumbnail Container */}
                <div className="shrink-0 w-16 h-16 rounded bg-black border border-gray-700 overflow-hidden relative">
                    {firstImage ? (
                        <img src={firstImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <ImageIcon className="w-6 h-6 text-gray-700" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-0.5">
                    <div>
                        <h3 className={`font-bold text-xs truncate mb-0.5 leading-tight ${selectedProjectId === project.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {project.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
                             <Calendar className="w-2.5 h-2.5" />
                             {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-700">
                            {project.generationMode === 'carousel' ? 'Carousel' : 'Chain'}
                        </span>
                        <span className={`text-[9px] font-bold ${approvedCount > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                            {approvedCount} Approved
                        </span>
                    </div>
                </div>

                {/* Selection Arrow */}
                {selectedProjectId === project.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                )}
            </button>
        );
      })}
    </div>
  );
};
