// Initialize Vercel Web Analytics
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@2.0.1/dist/index.mjs';

// Inject Web Analytics when the page loads
if (typeof window !== 'undefined') {
  inject();
}
