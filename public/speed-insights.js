// Initialize Vercel Speed Insights
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2.0.0/dist/index.mjs';

// Inject Speed Insights when the page loads
if (typeof window !== 'undefined') {
  injectSpeedInsights();
}
