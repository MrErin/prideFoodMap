import 'leaflet/dist/leaflet.css';
import { initializeMap } from './map.ts';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');

  try {
    await initializeMap();

    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error initializing map:', error);

    if (loadingEl) {
      loadingEl.textContent = 'Error loading map. Please try again later.';
      loadingEl.style.color = 'red';
    }
  }
});
