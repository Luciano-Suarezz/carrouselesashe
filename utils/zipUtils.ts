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

  for (let index = 0; index < stepsToExport.length; index++) {
      const step = stepsToExport[index];
      if (step.status === 'completed' && step.imageUrl && step.isApproved) {
          const fileName = `slide-${index + 1}.png`;
          
          if (step.imageUrl.startsWith('data:')) {
              // Image URL is "data:image/png;base64,..."
              const base64Data = step.imageUrl.split(',')[1];
              zip.file(fileName, base64Data, {base64: true});
              addedCount++;
          } else if (step.imageUrl.startsWith('http')) {
              try {
                  const response = await fetch(step.imageUrl, { mode: 'cors' });
                  if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  const arrayBuffer = await response.arrayBuffer();
                  zip.file(fileName, arrayBuffer);
                  addedCount++;
              } catch (error) {
                  console.error(`Failed to fetch image for zip: ${step.imageUrl}`, error);
              }
          }
      }
  }

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