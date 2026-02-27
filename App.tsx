
import React, { useState, useCallback, useEffect } from 'react';
import { StepList } from './components/StepList';
import { MainPreview } from './components/MainPreview';
import { Settings } from './components/Settings';
import { GalleryList } from './components/GalleryList';
import { GalleryDetail } from './components/GalleryDetail';
import { Login } from './components/Login';
import { GenChat } from './components/GenChat';
import { IdeasChat } from './components/IdeasChat';
import { generateImage, setGeminiApiKey, getGeminiApiKey } from './services/geminiService';
import { GenerationStep, ImageSize, AspectRatio, GenerationMode, ImageModel, SavedProject, AirtableConfig, UserProfile, CloudinaryConfig } from './types';
import { loginOrRegisterUser, getUserProjects, saveProjectToAirtable, deleteProjectFromAirtable, updateUserSubject, updateUserSystemPrompt, updateUserIdeasSystemPrompt, updateUserSystemPrompts } from './services/airtableService';
import { uploadImageToCloudinary } from './services/cloudinaryService';
import { createZipFromSteps, downloadBlob } from './utils/zipUtils';
import { Play, RotateCcw, Sparkles, Key, Package, Save, LayoutGrid, Zap, Terminal, Loader2, LogOut, Cloud, X } from 'lucide-react';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const INITIAL_STEP: GenerationStep = {
  id: generateId(),
  prompt: '',
  status: 'idle',
  isApproved: false,
  useSubject: true,
};

const App: React.FC = () => {
  // Auth & Cloud State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [airtableConfig, setAirtableConfig] = useState<AirtableConfig | null>(null);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig | null>(null);

  // App State
  const [steps, setSteps] = useState<GenerationStep[]>([{...INITIAL_STEP, id: generateId()}]);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('carousel');
  const [imageModel, setImageModel] = useState<ImageModel>('gemini-3.1-flash-image-preview');
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'generation' | 'gallery' | 'gen'>('generation');
  const [genSubTab, setGenSubTab] = useState<'slides' | 'ideas'>('slides');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aiStudio = (window as any).aistudio;
      if (aiStudio && aiStudio.hasSelectedApiKey) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  // Load Projects when user changes
  useEffect(() => {
      if (user && airtableConfig) {
          loadProjectsFromCloud();
          if (user.subjectImageBase64) {
              setSubjectImage(user.subjectImageBase64);
          }
      }
  }, [user]);

  const handleLogin = async (atConfig: AirtableConfig, clConfig: CloudinaryConfig, username: string, apiKey: string) => {
      // Set the API Key for the session
      setGeminiApiKey(apiKey);
      
      const userProfile = await loginOrRegisterUser(atConfig, username);
      setAirtableConfig(atConfig);
      setCloudinaryConfig(clConfig);
      setUser(userProfile);
      
      // Cache username only (don't cache API key for security/per-session requirement)
      localStorage.setItem('sia_username', username);
      
      // Ensure the app knows we have a key now
      setHasApiKey(true);
  };

  const handleLogout = () => {
      setUser(null);
      setSavedProjects([]);
      setSubjectImage(null);
      setSteps([{...INITIAL_STEP, id: generateId()}]);
      setGeminiApiKey(''); // Clear key on logout
  };

  const loadProjectsFromCloud = async () => {
      if (!user || !airtableConfig) return;
      try {
          const projects = await getUserProjects(airtableConfig, user.username);
          setSavedProjects(projects);
      } catch (error) {
          console.error("Load projects error", error);
          alert("Failed to load projects from Cloud.");
      }
  };

  const handleSaveProject = async () => {
    if (!user || !airtableConfig || !cloudinaryConfig) return;
    if (!projectName.trim()) {
        alert("Please name your project first.");
        return;
    }
    
    setIsSaving(true);

    try {
        // 1. Upload Images to Cloudinary first
        const stepsWithUrls = await Promise.all(steps.map(async (step) => {
            if (step.imageUrl && step.imageUrl.startsWith('data:')) {
                // It's a base64, needs upload
                try {
                    const url = await uploadImageToCloudinary(step.imageUrl, cloudinaryConfig);
                    return { ...step, imageUrl: url };
                } catch (e) {
                    console.error(`Failed to upload image for step ${step.id}`, e);
                    return step; // Keep original if fail (but it might fail Airtable save)
                }
            }
            return step;
        }));
        
        // Update local steps to use URLs immediately
        setSteps(stepsWithUrls);

        const projectToSave: SavedProject = {
            id: selectedProjectId || generateId(),
            name: projectName,
            createdAt: Date.now(),
            steps: stepsWithUrls, 
            imageSize,
            aspectRatio,
            generationMode,
            imageModel,
            subjectImageBase64: null 
        };

        await saveProjectToAirtable(airtableConfig, user.username, projectToSave);
        await loadProjectsFromCloud();
        alert("Project saved to Cloud successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to save project.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!airtableConfig) return;
    // Removed window.confirm() because GalleryDetail already handles the UI confirmation (Click to confirm)
    try {
        await deleteProjectFromAirtable(airtableConfig, id);
        setSavedProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProjectId === id) {
            setSelectedProjectId(null);
        }
    } catch (error) {
        console.error("Failed to delete project", error);
        alert("Delete failed.");
    }
  }, [selectedProjectId, airtableConfig]);

  const handleSaveSubjectToProfile = async (base64: string) => {
      if (!user || !airtableConfig || !cloudinaryConfig) return;
      try {
          const url = await uploadImageToCloudinary(base64, cloudinaryConfig);
          await updateUserSubject(airtableConfig, user, url);
          setUser({ ...user, subjectImageBase64: url });
          setSubjectImage(url);
      } catch (e) {
          console.error("Failed to save subject", e);
          alert("Failed to upload subject image.");
          throw e;
      }
  };

  const handleSaveSystemPrompt = async (prompt: string) => {
      if (!user || !airtableConfig) return;
      try {
          await updateUserSystemPrompt(airtableConfig, user, prompt);
          setUser({ ...user, systemPrompt: prompt });
      } catch (e) {
          console.error("Failed to save system prompt", e);
          throw e;
      }
  };

  const handleSaveIdeasSystemPrompt = async (prompt: string) => {
      if (!user || !airtableConfig) return;
      try {
          await updateUserIdeasSystemPrompt(airtableConfig, user, prompt);
          setUser({ ...user, ideasSystemPrompt: prompt });
      } catch (e) {
          console.error("Failed to save ideas system prompt", e);
          throw e;
      }
  };

  const handleSavePromptToLibrary = async (name: string, prompt: string) => {
      if (!user || !airtableConfig) return;
      try {
          const newPrompt = { id: Date.now().toString(), name, prompt };
          const updatedPrompts = [...(user.savedSystemPrompts || []), newPrompt];
          await updateUserSystemPrompts(airtableConfig, user, updatedPrompts);
          setUser({ ...user, savedSystemPrompts: updatedPrompts });
      } catch (e) {
          console.error("Failed to save prompt to library", e);
          throw e;
      }
  };

  const handleDeletePromptFromLibrary = async (id: string) => {
      if (!user || !airtableConfig) return;
      try {
          const updatedPrompts = (user.savedSystemPrompts || []).filter(p => p.id !== id);
          await updateUserSystemPrompts(airtableConfig, user, updatedPrompts);
          setUser({ ...user, savedSystemPrompts: updatedPrompts });
      } catch (e) {
          console.error("Failed to delete prompt from library", e);
          throw e;
      }
  };

  const handleImportPrompts = (background: string | undefined, slidePrompts: string[]) => {
      const newSteps: GenerationStep[] = [];
      
      if (background) {
          setGenerationMode('carousel');
          newSteps.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              prompt: background,
              status: 'idle',
              useSubject: false
          });
      }
      
      slidePrompts.forEach((slidePrompt, index) => {
          newSteps.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
              prompt: slidePrompt,
              status: 'idle',
              useSubject: false
          });
      });
      
      if (newSteps.length > 0) {
          setSteps(newSteps);
          setSelectedStepIndex(0);
          setActiveTab('generation');
      }
  };

  const handleSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && aiStudio.openSelectKey) {
      await aiStudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleAddStep = useCallback(() => {
    const newStep: GenerationStep = {
      id: generateId(),
      prompt: '',
      status: 'idle',
      isApproved: false,
      useSubject: true,
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepIndex(steps.length);
  }, [steps.length]);

  const handleUpdateStep = useCallback((id: string, prompt: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, prompt, isApproved: false } : step))
    );
  }, []);

  const handleToggleSubject = useCallback((id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, useSubject: !s.useSubject } : s));
  }, []);

  const handleRemoveStep = useCallback((id: string) => {
    setSteps((prev) => {
      const newSteps = prev.filter((step) => step.id !== id);
      return newSteps.length > 0 ? newSteps : [{...INITIAL_STEP, id: generateId()}];
    });
    setSelectedStepIndex(0);
  }, []);

  const handleRegenerateStep = useCallback(async () => {
    const stepIndex = selectedStepIndex;
    const step = steps[stepIndex];
    if (!step || !step.prompt.trim()) return;

    setIsGenerating(true);
    
    setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, status: 'pending', error: undefined, isApproved: false } : s));

    try {
        let previousImageBase64: string | undefined;

        if (stepIndex > 0) {
            if (generationMode === 'carousel') {
                const baseStep = steps[0];
                if (baseStep.status === 'completed' && baseStep.imageUrl) {
                    previousImageBase64 = baseStep.imageUrl;
                }
            } else {
                const prevStep = steps[stepIndex - 1];
                if (prevStep.status === 'completed' && prevStep.imageUrl) {
                    previousImageBase64 = prevStep.imageUrl;
                }
            }
        }

        const result = await generateImage({
            prompt: step.prompt,
            imageSize,
            aspectRatio,
            model: imageModel,
            previousImageBase64,
            subjectImageBase64: step.useSubject ? subjectImage : null
        });

        setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, status: 'completed', imageUrl: result } : s));

    } catch (error: any) {
        setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, status: 'failed', error: error.message } : s));
    } finally {
        setIsGenerating(false);
    }
  }, [selectedStepIndex, steps, generationMode, imageSize, aspectRatio, subjectImage]);

  const runGenerationSequence = useCallback(async () => {
    if (steps.length === 0) return;
    setIsGenerating(true);
    const currentResults = new Map<string, string>();

    try {
      if (generationMode === 'carousel') {
          // --- Carousel Logic: Generate Background first, then use it for others ---
          const baseStep = steps[0];
          setSteps((prev) => prev.map((s, idx) => idx === 0 ? { ...s, status: 'pending', error: undefined, isApproved: false } : s));
          setSelectedStepIndex(0);

          let baseImageBase64 = '';
          try {
              baseImageBase64 = await generateImage({
                  prompt: baseStep.prompt,
                  imageSize,
                  aspectRatio,
                  model: imageModel,
                  subjectImageBase64: baseStep.useSubject ? subjectImage : null 
              });
              setSteps((prev) => prev.map((s, idx) => idx === 0 ? { ...s, status: 'completed', imageUrl: baseImageBase64 } : s));
              currentResults.set(baseStep.id, baseImageBase64);
          } catch (error: any) {
              setSteps((prev) => prev.map((s, idx) => idx === 0 ? { ...s, status: 'failed', error: error.message } : s));
              setIsGenerating(false);
              return;
          }

          const variationIndices = steps.map((_, idx) => idx).slice(1);
          if (variationIndices.length > 0) {
              setSteps((prev) => prev.map((s, idx) => 
                idx > 0 && s.prompt.trim() ? { ...s, status: 'pending', error: undefined, isApproved: false } : s
              ));

              const promises = variationIndices.map(async (index) => {
                  const step = steps[index];
                  if (!step.prompt.trim()) return;

                  try {
                      // Pass the background (baseImageBase64) as 'previousImageBase64' to merge
                      const result = await generateImage({
                          prompt: step.prompt,
                          imageSize,
                          aspectRatio,
                          model: imageModel,
                          previousImageBase64: baseImageBase64,
                          subjectImageBase64: step.useSubject ? subjectImage : null
                      });
                      setSteps((prev) => prev.map((s, idx) => idx === index ? { ...s, status: 'completed', imageUrl: result } : s));
                  } catch (error: any) {
                      setSteps((prev) => prev.map((s, idx) => idx === index ? { ...s, status: 'failed', error: error.message } : s));
                  }
              });
              await Promise.all(promises);
          }
      } else {
          // Sequential Logic
          for (let i = 0; i < steps.length; i++) {
            if (!steps[i].prompt.trim()) continue;
            setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'pending', error: undefined, isApproved: false } : s)));
            setSelectedStepIndex(i);
            try {
              let inputImage: string | undefined = i > 0 ? currentResults.get(steps[i - 1].id) : undefined;
              const resultBase64 = await generateImage({
                prompt: steps[i].prompt,
                imageSize,
                aspectRatio,
                model: imageModel,
                previousImageBase64: inputImage,
                subjectImageBase64: steps[i].useSubject ? subjectImage : null
              });
              currentResults.set(steps[i].id, resultBase64);
              setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', imageUrl: resultBase64 } : s));
            } catch (error: any) {
              setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'failed', error: error.message } : s));
              break;
            }
          }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [steps, imageSize, aspectRatio, generationMode, subjectImage]);

  const handleLoadProject = (project: SavedProject) => {
      setProjectName(project.name);
      setSteps(project.steps);
      setImageSize(project.imageSize);
      setAspectRatio(project.aspectRatio);
      setGenerationMode(project.generationMode);
      if (project.imageModel) setImageModel(project.imageModel);
      setSelectedProjectId(project.id);
      setActiveTab('generation');
  };

  if (!user) {
      return <Login onLogin={handleLogin} />;
  }

  const isLucho = user?.username.toLowerCase() === 'lucho';

  return (
    <div className="flex h-full flex-col bg-gray-950 text-gray-100 font-sans relative">
      <header className="flex-none h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-4 z-20 select-none">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg shadow-lg shadow-primary-500/20">
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight italic leading-none text-white">Carru <span className="text-gray-500 not-italic font-medium text-xs ml-0.5">Cloud</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {!hasApiKey && (
              <button onClick={handleSelectKey} className="px-3 py-1.5 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded text-xs animate-pulse flex items-center gap-2">
                <Key className="w-3 h-3" /> API Key
              </button>
            )}

            {activeTab === 'generation' && (
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project Name"
                        className="bg-gray-900 border border-gray-800 text-gray-200 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-primary-500 w-32 md:w-40 transition-all"
                    />
                     <button 
                        onClick={handleSaveProject} 
                        disabled={isSaving}
                        className={`p-1.5 rounded border transition-all ${isSaving ? 'bg-primary-900 border-primary-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border-gray-700'}`} 
                        title="Save Project"
                     >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <div className="h-4 w-px bg-gray-800 mx-1" />
                    <button onClick={runGenerationSequence} disabled={isGenerating || !hasApiKey} className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all ${isGenerating || !hasApiKey ? 'bg-gray-800 text-gray-500' : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/40'}`}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isGenerating ? 'BUILD' : 'RUN'}</span>
                    </button>
                </div>
            )}
             
            <button onClick={handleLogout} className="p-1.5 ml-2 text-gray-500 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800 w-full md:w-[340px] flex-none overflow-hidden bg-gray-950 relative z-10">
           {/* Tab Switcher - More Compact */}
           <div className="flex border-b border-gray-800">
                <button onClick={() => setActiveTab('generation')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'generation' ? 'border-primary-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}>
                    Editor
                </button>
                <button onClick={() => setActiveTab('gen')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'gen' ? 'border-primary-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}>
                    Gen
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'gallery' ? 'border-primary-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}>
                    Gallery
                </button>
           </div>

           <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
               {activeTab === 'generation' ? (
                   <>
                        <Settings 
                            imageSize={imageSize} 
                            aspectRatio={aspectRatio} 
                            generationMode={generationMode} 
                            imageModel={imageModel}
                            subjectImage={subjectImage} 
                            onSizeChange={setImageSize} 
                            onAspectRatioChange={setAspectRatio} 
                            onModeChange={setGenerationMode} 
                            onModelChange={setImageModel}
                            onSubjectImageChange={setSubjectImage} 
                            onSaveSubjectToProfile={handleSaveSubjectToProfile}
                            disabled={isGenerating || isSaving} 
                        />
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <StepList 
                              steps={steps} 
                              isGenerating={isGenerating} 
                              currentStepIndex={selectedStepIndex} 
                              generationMode={generationMode} 
                              onAddStep={handleAddStep} 
                              onUpdateStep={handleUpdateStep} 
                              onRemoveStep={handleRemoveStep} 
                              onSelectStep={setSelectedStepIndex} 
                              onToggleSubject={handleToggleSubject}
                              selectedIndex={selectedStepIndex} 
                              subjectAvailable={!!subjectImage}
                            />
                        </div>
                   </>
               ) : activeTab === 'gallery' ? (
                   <GalleryList projects={savedProjects} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
               ) : (
                   <div className="p-6 flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
                       <Sparkles className="w-12 h-12 mb-4" />
                       <p className="text-sm">Chat with the AI to brainstorm and generate your carousel slides.</p>
                   </div>
               )}
           </div>
        </div>

        <div className="flex-1 min-w-0 bg-gray-950 relative h-full flex flex-col">
          <div className={`flex-1 min-h-0 ${activeTab === 'generation' ? 'block' : 'hidden'}`}>
             <MainPreview 
                step={steps[selectedStepIndex]} 
                isGenerating={isGenerating} 
                totalSteps={steps.length} 
                currentStepIndex={selectedStepIndex} 
                onNavigate={(dir) => setSelectedStepIndex(prev => dir === 'next' ? Math.min(steps.length-1, prev+1) : Math.max(0, prev-1))} 
                onToggleApproval={() => setSteps(prev => prev.map((s,i) => i === selectedStepIndex ? {...s, isApproved: !s.isApproved} : s))} 
                onRegenerate={handleRegenerateStep} 
             />
          </div>
          <div className={`flex-1 min-h-0 ${activeTab === 'gallery' ? 'block' : 'hidden'}`}>
             <GalleryDetail project={savedProjects.find(p => p.id === selectedProjectId) || null} onLoadProject={handleLoadProject} onDeleteProject={handleDeleteProject} />
          </div>
          <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'gen' ? 'block' : 'hidden'}`}>
             {isLucho && (
               <div className="flex-none flex border-b border-gray-800 bg-gray-950">
                 <button onClick={() => setGenSubTab('slides')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${genSubTab === 'slides' ? 'border-primary-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}>
                   Slides
                 </button>
                 <button onClick={() => setGenSubTab('ideas')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${genSubTab === 'ideas' ? 'border-primary-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}>
                   Ideas
                 </button>
               </div>
             )}
             
             <div className={`flex-1 min-h-0 ${!isLucho || genSubTab === 'slides' ? 'block' : 'hidden'}`}>
                 <GenChat 
                    initialSystemPrompt={user.systemPrompt || ''}
                    savedPrompts={user.savedSystemPrompts || []}
                    onSaveSystemPrompt={handleSaveSystemPrompt}
                    onSavePromptToLibrary={handleSavePromptToLibrary}
                    onDeletePromptFromLibrary={handleDeletePromptFromLibrary}
                    onImportPrompts={handleImportPrompts}
                    apiKey={getGeminiApiKey()}
                 />
             </div>

             {isLucho && (
                 <div className={`flex-1 min-h-0 ${genSubTab === 'ideas' ? 'block' : 'hidden'}`}>
                     <IdeasChat 
                        initialSystemPrompt={user.ideasSystemPrompt || ''}
                        onSaveSystemPrompt={handleSaveIdeasSystemPrompt}
                        apiKey={getGeminiApiKey()}
                     />
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
