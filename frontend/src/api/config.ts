// src/api/config.ts

const BASE_IP = "10.0.2.2";
const PORT = "8000";

const CLOUD_NAME = 'do8tedem8';
const UPLOAD_PRESET_VALUE = 'crop_app_preset';
 
export const UPLOAD_PRESET = UPLOAD_PRESET_VALUE
export const IMAGE_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
export const BASE_URL = `http://${BASE_IP}:${PORT}/api/v1`;

export const ENDPOINTS = {
  WEATHER: `${BASE_URL}/weather`,
  CROP: `${BASE_URL}/crop`,
  DSS: `${BASE_URL}/dss`,
  SOIL: `${BASE_URL}/soil`,
  GARDEN: `${BASE_URL}/garden`,
  USER: `${BASE_URL}/user`,
  CONTENT: `${BASE_URL}/content`,
};