// src/api/image.ts
import {IMAGE_URL, UPLOAD_PRESET} from "./config"

export const uploadImage = async (imageUri: string): Promise<string | null> => {
  const data = new FormData();
  
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any);
  
  data.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(IMAGE_URL, {
      method: 'POST',
      body: data,
    });
    
    const result = await response.json();
    return result.secure_url || null;
  } catch (error) {
    console.error("Upload Service Error:", error);
    return null;
  }
};