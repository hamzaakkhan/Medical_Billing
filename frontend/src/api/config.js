/**
 * Dynamic API Base URL resolver.
 * When running on laptop (localhost/127.0.0.1): resolves to 'http://localhost:8000'.
 * When accessed from a phone or network device: automatically uses the machine's LAN IP from window.location.hostname (e.g. 'http://192.168.x.x:8000').
 * Can also be explicitly overridden by setting VITE_API_URL in a .env file.
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

