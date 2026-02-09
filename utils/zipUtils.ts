import JSZip from 'jszip';
import { GenerationStep, GenerationMode } from '../types';

export const createZipFromSteps = async (
  steps: GenerationStep[],
  generationMode: GenerationMode
): Promise<Blob | null> => {
  const zip = new JSZip();
  // In Carousel mode, Step 1 is the background/base, which the user usually doesn't want in the final slide deck.
  // In Sequential mode, we export everything as it's a process.
  
  // We filter for approved steps only, unless they are completed and we want to just dump everything?
  // The requirement was "approved" images.
  
  const stepsToExport = generationMode === 'carousel' ? steps.slice(1) : steps;
  
  let addedCount = 0;

  stepsToExport.forEach((step, index) => {
      if (step.status === 'completed' && step.imageUrl && step.isApproved) {
          // Image URL is "data:image/png;base64,..."
          const base64Data = step.imageUrl.split(',')[1];
          // Adjust index for filename to be 1-based relative to the export set
          const fileName = `slide-${index + 1}.png`;
          zip.file(fileName, base64Data, {base64: true});
          addedCount++;
      }
  });

  if (addedCount === 0) {
      return null;
  }

  return await zip.generateAsync({type: "blob"});
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};