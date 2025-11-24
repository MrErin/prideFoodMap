import 'leaflet/dist/leaflet.css'
import {initializeMap} from "./map.ts";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeMap();

        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error initializing map:', error);

        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.textContent = 'Error loading map. Please try again later.';
            loadingEl.style.color = 'red';
        }
    }
});