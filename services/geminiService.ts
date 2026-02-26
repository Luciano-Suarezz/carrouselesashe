
import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize, AspectRatio, ImageModel } from "../types";

const TEXT_MODEL_NAME = 'gemini-3-flash-preview';

// Store the API key provided by the user in the login screen
let sessionApiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
    sessionApiKey = key;
};

export const getGeminiApiKey = () => {
    if (!sessionApiKey) {
        throw new Error("API Key is missing. Please log in with a valid Gemini API Key.");
    }
    return sessionApiKey;
};

export const validateGeminiKey = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        // Perform a minimal check to verify the key works
        await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: "Ping",
        });
        return true;
    } catch (error) {
        console.error("API Key Validation Failed:", error);
        return false;
    }
};

interface GenerateImageOptions {
  prompt: string;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  model: ImageModel;
  previousImageBase64?: string; 
  subjectImageBase64?: string | null; 
}

const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting URL to Base64:", error);
        // Fallback or rethrow depending on needs, here we rethrow to inform user
        throw error;
    }
};

export const generateImage = async ({
  prompt,
  imageSize,
  aspectRatio,
  model,
  previousImageBase64,
  subjectImageBase64
}: GenerateImageOptions): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const parts: any[] = [];
    
    // 1. Handle Subject Image (Reference)
    if (subjectImageBase64) {
         let cleanData = subjectImageBase64;
         // Check if it is a URL (e.g. Cloudinary) and convert if needed
         if (subjectImageBase64.startsWith('http')) {
             cleanData = await urlToBase64(subjectImageBase64);
         }
         
         const base64Data = cleanData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
         parts.push({
            inlineData: {
                mimeType: 'image/png',
                data: base64Data
            }
         });
    }

    // 2. Handle Previous Image (Context/Background)
    if (previousImageBase64) {
      let cleanData = previousImageBase64;
      // Check if it is a URL (e.g. from a loaded project) and convert if needed
      if (previousImageBase64.startsWith('http')) {
          cleanData = await urlToBase64(previousImageBase64);
      }

      const base64Data = cleanData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
    }

    let finalPrompt = prompt;
    if (subjectImageBase64) {
        finalPrompt = `(Maintain strict visual consistency with the provided reference subject/character) ${prompt}`;
    }
    
    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: aspectRatio,
        },
      },
    });

    if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
            for (const part of content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
    }
    throw new Error("No image data found.");
  } catch (error: any) {
    if (error.message?.includes('403') || error.status === 403) {
       throw new Error("Permission denied. Check API Key and billing.");
    }
    throw new Error(error.message || "Failed to generate image");
  }
};

/**
 * Toma un prompt simple y lo expande a un prompt profesional para IA.
 */
export const refinePrompt = async (simplePrompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `Improve this image generation prompt to be professional, detailed, and visually stunning. Keep it in the same language as input. Only return the improved prompt text, no intro or outro: "${simplePrompt}"`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Refine error:", error);
    return simplePrompt;
  }
};

/**
 * Genera una idea creativa basada en un tema y una instrucción de sistema.
 */
export const generateCreativeIdea = async (topic: string, systemInstruction: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: topic,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text || '';
    } catch (error) {
        console.error("Creative idea error:", error);
        throw new Error("Failed to generate creative idea");
    }
};

export const generateSlidePrompts = async (topic: string, systemInstruction?: string): Promise<string[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: topic,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });
        const json = JSON.parse(response.text);
        const prompts: string[] = [];
        if (json.background) prompts.push(String(json.background));
        const slideKeys = Object.keys(json).filter(key => key.startsWith('slide_')).sort((a,b) => (parseInt(a.split('_')[1]) || 0) - (parseInt(b.split('_')[1]) || 0));
        slideKeys.forEach(k => prompts.push(String(json[k])));
        return prompts;
    } catch (error) {
        throw new Error("Failed to generate slide prompts");
    }
};

export const parseImportText = async (rawText: string): Promise<{ background?: string, slides: string[] }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const response = await ai.models.generateContent({
            model: TEXT_MODEL_NAME,
            contents: `You are an expert parser. Extract the background prompt and the slide prompts from the following text.
Return a JSON object with this exact structure:
{
  "background": "The background prompt text here, if any. Otherwise null.",
  "slides": [
    "Combined Visual Idea and Nano Banana Prompt for slide 1",
    "Combined Visual Idea and Nano Banana Prompt for slide 2"
  ]
}

For each slide, combine the 'Visual Idea' and the 'Nano Banana (Gemini) Prompt' into a single string exactly as they appear in the text, keeping the labels. For example:
Visual Idea (ENG): [text]
Nano Banana (Gemini) Prompt (ES):
[text]

Here is the raw text to parse:
${rawText}`,
            config: {
                responseMimeType: "application/json",
            }
        });
        const json = JSON.parse(response.text);
        return {
            background: json.background || undefined,
            slides: json.slides || []
        };
    } catch (error) {
        console.error("Parse import error:", error);
        throw new Error("Failed to parse the imported text.");
    }
};
