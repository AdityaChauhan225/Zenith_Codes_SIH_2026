/**
 * Centralized API base configuration for local dev and cloud deployment.
 * Defaults to relative path `/api` which is automatically proxied:
 * - In local dev: via vite.config.js proxy to http://localhost:5000
 * - In production: via vercel.json rewrite or VITE_API_URL environment variable
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};
