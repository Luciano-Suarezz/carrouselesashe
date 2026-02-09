import React, { useState, useEffect } from 'react';
import { generateCreativeIdea, generateSlidePrompts } from '../services/geminiService';
import { Sparkles, Lightbulb, ListOrdered, Loader2, Settings2, Save, RotateCcw } from 'lucide-react';

interface PromptAssistantProps {
    onApplyPrompts: (prompts: string[]) => void;
    disabled: boolean;
}

const DEFAULT_IDEA_SYSTEM = "You are an expert creative director. Take the provided topic and expand it into a brief (2-3 sentences), rich, visually interesting scene description. Focus on lighting, atmosphere, and composition.";

const DEFAULT_SLIDES_SYSTEM = `Rol del Sistema: Soy un Generador de Prompts para Carruseles de Instagram con Estilo Unificado (API Mode). Mi tarea es convertir un guion en una estructura JSON estricta conteniendo prompts de imagen (Nano Banana/Gemini).

## LÓGICA DE GENERACIÓN (Estricta):

1. **Selección de Estilo:** Elegiré aleatoriamente UNO de: Claymation, Cuento de Hadas, Doodle en Pizarra, Collage Futurista, Cómic Americano Moderno, Arte Abstracto Geométrico, Anime, Scrapbook Analógico, Bauhaus Minimalista.

2. **Definición del "Paquete de Estilo":** Definiré la paleta (Color #0088e4 + complementarios) y elementos recurrentes.

3. **Generación del Fondo Universal (Consistencia 100%):**
   - Crearé un prompt para una sola imagen de fondo base, sin texto ni objetos complejos.

4. **Reglas para el "Scroll-Stopper" (Diapositiva 1):**
   - La diapositiva 1 debe ser visualmente más impactante (primer plano, luz dramática, etc.).

5. **Generación de Diapositivas:**
   - Generaré el prompt final en español para cada diapositiva, describiendo la escena *sobre* el fondo universal, manteniendo la cohesión visual.

## FORMATO DE SALIDA (JSON SIMPLE Y SECUENCIAL):

Tu respuesta debe ser **únicamente** un objeto JSON válido. No incluyas markdown (\\\`\\\`\\\`json ... \\\`\\\`\\\`) ni texto introductorio.

El objeto JSON debe contener el **prompt final en español listo para copiar y pegar** para cada componente, utilizando claves simples y secuenciales:

### Estructura y Ejemplo de Salida Esperada:

{
  "style_used": "Nombre del estilo elegido",
  "background": "Prompt final en español del fondo universal...",
  "slide_1": "Prompt final en español para la diapositiva 1...",
  "slide_2": "Prompt final en español para la diapositiva 2...",
  "slide_3": "Prompt final en español para la diapositiva 3..."
  // ... añadir más diapositivas según el guion
}

## INSTRUCCIÓN FINAL:
Espera a recibir el guion del usuario. Genera SOLO el JSON resultante siguiendo esta estructura simplificada.`;

export const PromptAssistant: React.FC<PromptAssistantProps> = ({ onApplyPrompts, disabled }) => {
    const [topic, setTopic] = useState('');
    const [developedIdea, setDevelopedIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFunction, setActiveFunction] = useState<'idea' | 'slides' | null>(null);
    
    // System Prompts State
    const [showConfig, setShowConfig] = useState(false);
    const [ideaSystemPrompt, setIdeaSystemPrompt] = useState(DEFAULT_IDEA_SYSTEM);
    const [slidesSystemPrompt, setSlidesSystemPrompt] = useState(DEFAULT_SLIDES_SYSTEM);

    // Load saved prompts on mount
    useEffect(() => {
        const savedIdea = localStorage.getItem('sia_idea_system_prompt');
        const savedSlides = localStorage.getItem('sia_slides_system_prompt');
        if (savedIdea) setIdeaSystemPrompt(savedIdea);
        if (savedSlides) setSlidesSystemPrompt(savedSlides);
    }, []);

    const handleSaveConfig = () => {
        localStorage.setItem('sia_idea_system_prompt', ideaSystemPrompt);
        localStorage.setItem('sia_slides_system_prompt', slidesSystemPrompt);
        setShowConfig(false);
    };

    const handleResetConfig = () => {
        setIdeaSystemPrompt(DEFAULT_IDEA_SYSTEM);
        setSlidesSystemPrompt(DEFAULT_SLIDES_SYSTEM);
    };

    const handleDevelopIdea = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setActiveFunction('idea');
        try {
            const result = await generateCreativeIdea(topic, ideaSystemPrompt);
            setDevelopedIdea(result);
        } catch (error) {
            console.error(error);
            alert("Failed to develop idea. Check console.");
        } finally {
            setIsLoading(false);
            setActiveFunction(null);
        }
    };

    const handleGenerateSlides = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setActiveFunction('slides');
        try {
            const prompts = await generateSlidePrompts(topic, slidesSystemPrompt);
            if (prompts && prompts.length > 0) {
                onApplyPrompts(prompts);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate slide prompts. Check console.");
        } finally {
            setIsLoading(false);
            setActiveFunction(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 w-full">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-primary-400">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold text-base">Prompt Assistant</span>
                </div>
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Configure System Prompts"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                
                {/* Configuration Panel */}
                {showConfig && (
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Prompts Configuration</h3>
                            <button onClick={handleResetConfig} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Reset Defaults
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs text-primary-400 font-medium">Idea Generator System Prompt</label>
                            <textarea 
                                value={ideaSystemPrompt}
                                onChange={(e) => setIdeaSystemPrompt(e.target.value)}
                                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-primary-400 font-medium">Slide Generator System Prompt</label>
                            <textarea 
                                value={slidesSystemPrompt}
                                onChange={(e) => setSlidesSystemPrompt(e.target.value)}
                                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-primary-500"
                            />
                            <p className="text-[10px] text-gray-600">Note: Must return a JSON Object with 'background' and 'slide_N' keys.</p>
                        </div>

                        <button 
                            onClick={handleSaveConfig}
                            className="w-full py-2 bg-primary-900/50 hover:bg-primary-900 border border-primary-700 text-primary-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                        >
                            <Save className="w-3 h-3" /> Save Configuration
                        </button>
                    </div>
                )}

                {/* Main Inputs */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Topic / Theme</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. 'Cyberpunk Christmas', 'Abstract Geometry'"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            disabled={disabled || isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={handleDevelopIdea}
                            disabled={disabled || isLoading || !topic.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-sm font-medium text-gray-200 transition-all hover:shadow-lg disabled:opacity-50"
                        >
                            {isLoading && activeFunction === 'idea' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 text-yellow-500" />}
                            <span>Develop Creative Idea</span>
                        </button>

                        <button
                            onClick={handleGenerateSlides}
                            disabled={disabled || isLoading || !topic.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-900/20 transition-all disabled:opacity-50"
                        >
                            {isLoading && activeFunction === 'slides' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListOrdered className="w-4 h-4" />}
                            <span>Generate & Apply 6 Prompts</span>
                        </button>
                    </div>
                </div>

                {/* Idea Output */}
                {developedIdea && (
                    <div className="space-y-2 pt-4 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Developed Concept</label>
                            <button 
                                onClick={() => {navigator.clipboard.writeText(developedIdea)}}
                                className="text-xs text-primary-400 hover:text-primary-300"
                            >
                                Copy
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={developedIdea}
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-300 leading-relaxed h-40 resize-none focus:outline-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};