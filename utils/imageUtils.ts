
/**
 * Compresses a Base64 image string to ensure it fits within Airtable's Long Text limit (approx 100k chars).
 * It reduces quality and dimensions until it fits.
 */
export const compressImageForStorage = (base64String: string, targetSizeKB: number = 70): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Initial downscale if huge
      const MAX_DIM = 800;
      if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width *= ratio;
          height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Recursive compression
      let quality = 0.7;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      const checkSize = () => {
          if (dataUrl.length < targetSizeKB * 1024 || quality <= 0.1) {
              resolve(dataUrl);
          } else {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
              checkSize();
          }
      };
      
      checkSize();
    };
    img.onerror = (e) => reject(e);
  });
};
