import 'leaflet/dist/leaflet.css';
import { initializeMap, setupMarkerClickHandlers, highlightMarker, setupLayerEventListeners } from './map.ts';
import { renderCards, updateCardSelection, filterCards } from './cards.ts';
import { StateManager } from './stateManager.ts';
import { setupSearchInput } from './search.ts';
import { createEmptyState } from './emptyState.ts';
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
    const { map, fridgeData, donationData, fridgeMarkerIds, donationMarkerIds } = await initializeMap();

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

    // Create empty state element
    createEmptyState('#card-list');

    // Setup card click and keyboard handlers
    const cardContainer = document.querySelector<HTMLElement>('#card-list');
    if (cardContainer) {
      const cards = cardContainer.querySelectorAll<HTMLElement>('.card');
      cards.forEach((card) => {
        const markerId = card.dataset.markerId;
        if (markerId) {
          // Click handler
          card.addEventListener('click', () => {
            stateManager.setSelected(markerId);
          });

          // Keyboard handler for Enter and Space key activation
          card.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault(); // Prevent Space from scrolling page
              stateManager.setSelected(markerId);
            }
          });
        }
      });
    }

    // Setup marker click handlers
    setupMarkerClickHandlers(stateManager);

    // Setup layer event listeners for visibility tracking
    setupLayerEventListeners(map, stateManager);

    // Escape key listener to clear selection
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stateManager.clearSelection();
      }
    };
    window.addEventListener('keydown', escapeHandler);

    // Setup search input with debounced handler
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchReset = document.getElementById('search-reset') as HTMLElement;
    if (searchInput && searchReset) {
      setupSearchInput(searchInput, searchReset, stateManager);
    }

    // Subscribe to state changes for bi-directional sync
    stateManager.subscribe((state) => {
      updateCardSelection(state.selectedId);
      highlightMarker(state.selectedId);
    });

    // Subscribe to search query changes for filtering
    stateManager.subscribe((state) => {
      const cards = document.querySelectorAll<HTMLElement>('.card');
      filterCards(Array.from(cards), state.searchQuery, state.visibleLayers);
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
