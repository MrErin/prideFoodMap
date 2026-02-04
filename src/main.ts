import 'leaflet/dist/leaflet.css';
import { initializeMap } from './map.ts';
import { renderCards } from './cards.ts';
import type { MarkerData } from './map.ts';

interface LocationCard extends MarkerData {
  markerId: string;
  category: 'Community Fridge' | 'Food Donation';
}

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');

  try {
    const { fridgeData, donationData } = await initializeMap();

    // Create location cards with category and markerId
    // Note: markerId is empty for now - will be populated in plan 02-03
    const fridgeCards: LocationCard[] = fridgeData.map(
      (data: MarkerData): LocationCard => ({
        ...data,
        markerId: '', // Placeholder - will be set in plan 02-03
        category: 'Community Fridge',
      })
    );

    const donationCards: LocationCard[] = donationData.map(
      (data: MarkerData): LocationCard => ({
        ...data,
        markerId: '', // Placeholder - will be set in plan 02-03
        category: 'Food Donation',
      })
    );

    // Combine and render cards (will be sorted alphabetically by renderCards)
    const allCards = [...fridgeCards, ...donationCards];
    renderCards(allCards);

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
