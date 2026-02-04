import 'leaflet/dist/leaflet.css';
import { initializeMap, setupMarkerClickHandlers, highlightMarker } from './map.ts';
import { renderCards, updateCardSelection } from './cards.ts';
import { StateManager } from './stateManager.ts';
import type { MarkerData } from './map.ts';

interface LocationCard extends MarkerData {
  markerId: string;
  category: 'Community Fridge' | 'Food Donation';
}

// Create StateManager instance for bi-directional sync
const stateManager = new StateManager();

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');

  try {
    const { fridgeData, donationData, fridgeMarkerIds, donationMarkerIds } = await initializeMap();

    // Create location cards with category and markerId
    // markerId is now populated from addMarkersFromCSV return value using L.Util.stamp()
    const fridgeCards: LocationCard[] = fridgeData.map(
      (data: MarkerData, index: number): LocationCard => ({
        ...data,
        markerId: fridgeMarkerIds[index] || '',
        category: 'Community Fridge',
      })
    );

    const donationCards: LocationCard[] = donationData.map(
      (data: MarkerData, index: number): LocationCard => ({
        ...data,
        markerId: donationMarkerIds[index] || '',
        category: 'Food Donation',
      })
    );

    // Combine and render cards (will be sorted alphabetically by renderCards)
    const allCards = [...fridgeCards, ...donationCards];
    renderCards(allCards);

    // Setup card click handlers
    const cardContainer = document.querySelector<HTMLElement>('#card-list');
    if (cardContainer) {
      const cards = cardContainer.querySelectorAll<HTMLElement>('.card');
      cards.forEach((card) => {
        const markerId = card.dataset.markerId;
        if (markerId) {
          card.addEventListener('click', () => {
            stateManager.setSelected(markerId);
          });
        }
      });
    }

    // Setup marker click handlers
    setupMarkerClickHandlers(stateManager);

    // Escape key listener to clear selection
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stateManager.clearSelection();
      }
    };
    window.addEventListener('keydown', escapeHandler);

    // Subscribe to state changes for bi-directional sync
    stateManager.subscribe((state) => {
      updateCardSelection(state.selectedId);
      highlightMarker(state.selectedId);
    });

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
