// Where the API and the web app run. Override them at build time with VITE_API_URL and
// VITE_WEB_URL (for example in extension/.env.local); the API URL must also be listed in
// host_permissions in public/manifest.json.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5080';
export const WEB_URL: string = import.meta.env.VITE_WEB_URL ?? 'http://localhost:5173';
