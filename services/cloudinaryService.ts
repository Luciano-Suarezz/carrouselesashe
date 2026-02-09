
import { CloudinaryConfig } from "../types";

export const uploadImageToCloudinary = async (base64Data: string, config: CloudinaryConfig): Promise<string> => {
    // If it's already a URL, return it
    if (base64Data.startsWith('http')) return base64Data;

    const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', config.uploadPreset);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        return data.secure_url; // Returns the hosted URL
    } catch (error) {
        console.error("Cloudinary Error:", error);
        throw error;
    }
};
