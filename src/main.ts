/**
 * main - Application entry point
 *
 * Orchestrates the initialization of map, cards, state management,
 * and event handlers. Manages bi-directional sync between map markers
 * and card list through the StateManager observer pattern.
 */

import 'leaflet/dist/leaflet.css';
import {
  initializeMap,
  setupMarkerClickHandlers,
  highlightMarker,
  setupLayerEventListeners,
  announce,
} from './map.ts';
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
    const {
      map,
      fridgeData,
      donationData,
      fridgeMarkers,
      donationMarkers,
      fridgeMarkerIds,
      donationMarkerIds,
    } = await initializeMap(stateManager);

    // Combine all markers for event handler setup
    const allMarkers = new Map([...fridgeMarkers, ...donationMarkers]);

    // Create location cards with category and markerId
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
    setupMarkerClickHandlers(allMarkers, stateManager);

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
      highlightMarker(allMarkers, state.selectedId);

      // Announce selection to screen readers
      if (state.selectedId) {
        const selectedCard = document.querySelector<HTMLElement>(
          `[data-marker-id="${state.selectedId}"]`
        );
        const cardName = selectedCard?.querySelector('.card-name')?.textContent ?? '';
        if (cardName) {
          announce(`Selected ${cardName}`);
        }
      }
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
