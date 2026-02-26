
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5';
export type GenerationMode = 'sequential' | 'carousel';
export type ImageModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';

export interface GenerationStep {
  id: string;
  prompt: string;
  status: 'idle' | 'pending' | 'completed' | 'failed';
  imageUrl?: string; // Base64 data URL or Public URL
  error?: string;
  isApproved?: boolean;
  useSubject?: boolean; // New property to toggle subject usage per step
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  steps: GenerationStep[];
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  generationMode: GenerationMode;
  imageModel?: ImageModel;
  subjectImageBase64?: string | null;
}

export interface AppState {
  steps: GenerationStep[];
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  generationMode: GenerationMode;
  imageModel: ImageModel;
  isGenerating: boolean;
  currentStepIndex: number;
}

export interface UserProfile {
  username: string;
  recordId?: string; // Airtable Record ID
  subjectImageBase64?: string | null; // This might be a URL now if using Cloudinary
  systemPrompt?: string;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}
