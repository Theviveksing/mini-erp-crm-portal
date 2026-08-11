export const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
