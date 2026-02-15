import loadEnvVars from "@/utils/configs";

loadEnvVars();

// AUTH CONFIGURATION
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const AUTH_URL = process.env.AUTH_URL || process.env.BETTER_AUTH_URL || "";
export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// SMTP CONFIGURATION
export const EMAIL_SERVER = process.env.EMAIL_SERVER || "";
export const EMAIL_FROM = process.env.EMAIL_FROM || "";

// GOOGLE CLOUD PLATFORM
export const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "";
export const GCP_BUCKET = process.env.GCP_BUCKET || "";
export const GCP_PRIVATE_KEY = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n") || "";
export const GCP_CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL || "";

// GOOGLE MAPS
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";

// GEMINI
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";


