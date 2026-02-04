import type { MarkerData } from './map.ts';
import type { SelectionState } from './stateManager.ts';
import { updateEmptyState } from './emptyState.ts';

interface LocationCard extends MarkerData {
  markerId: string;
  category: 'Community Fridge' | 'Food Donation';
}

/**
 * Scrolls a card into view with accessibility considerations.
 * Respects user's prefers-reduced-motion setting for smooth vs instant scroll.
 * Moves keyboard focus to the card for continued keyboard navigation.
 *
 * @param card - The card HTMLElement to scroll into view
 */
export function scrollToCard(card: HTMLElement): void {
  // Check user's motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll with appropriate behavior (smooth unless reduced motion is preferred)
  card.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'nearest', // Minimal viewport disruption
  });

  // Move keyboard focus to the card (critical for accessibility)
  card.focus();
}

/**
 * Creates a card element for a location with full ARIA attribute coverage.
 *
 * ARIA attributes set on the card element:
 * - role="listitem" - Identifies the card as a list item
 * - aria-selected="false" - Indicates selection state (updated via updateCardSelection)
 * - tabindex="0" - Makes the card focusable via keyboard
 *
 * @param cardData - The location data including marker ID and category
 * @returns HTMLElement representing the location card
 */
export function createCardElement(cardData: LocationCard): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.markerId = cardData.markerId;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-selected', 'false');
  card.setAttribute('tabindex', '0');

  const name = document.createElement('h3');
  name.className = 'card-name';
  name.textContent = cardData.locationName;

  const address = document.createElement('p');
  address.className = 'card-address';
  const fullAddress = `${cardData.street}, ${cardData.city}, ${cardData.state} ${cardData.zip}`;
  address.textContent = fullAddress;

  const badges = document.createElement('div');
  badges.className = 'card-badges';

  const badge = document.createElement('span');
  badge.className = `badge ${
    cardData.category === 'Community Fridge' ? 'badge-fridge' : 'badge-donation'
  }`;
  badge.textContent = cardData.category;
  badges.appendChild(badge);

  card.appendChild(name);
  card.appendChild(address);
  card.appendChild(badges);

  return card;
}

/**
 * Renders location cards to a container with ARIA labeling.
 *
 * Container ARIA attributes:
 * - aria-label="Food locations list" - Set when container has role="list"
 *
 * @param cards - Array of location cards to render
 * @param containerSelector - CSS selector for the container (default: '#card-list')
 */
export function renderCards(
  cards: LocationCard[],
  containerSelector: string = '#card-list'
): void {
  // Sort cards alphabetically by location name
  const sortedCards = [...cards].sort((a, b) =>
    a.locationName.localeCompare(b.locationName)
  );

  // Get or create container element
  let container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) {
    container = document.createElement('div');
    container.id = containerSelector.replace('#', '');
    container.className = 'card-list';
    document.body.appendChild(container);
  }

  // Clear existing content
  container.innerHTML = '';

  // Add cards to container
  sortedCards.forEach((cardData) => {
    const cardElement = createCardElement(cardData);
    container?.appendChild(cardElement);
  });

  // Set aria-label if container has list role
  if (container.getAttribute('role') === 'list') {
    container.setAttribute('aria-label', 'Food locations list');
  }
}

/**
 * Updates card selection styling based on the selected marker ID.
 *
 * ARIA attributes updated:
 * - aria-selected="true" - Set on the selected card
 * - aria-selected="false" - Set on all non-selected cards
 *
 * Also updates CSS class for visual styling and scrolls the selected card into view.
 *
 * @param selectedId - The ID of the selected marker, or null to clear all selections
 */
export function updateCardSelection(selectedId: SelectionState['selectedId']): void {
  requestAnimationFrame(() => {
    const container = document.querySelector<HTMLElement>('#card-list');
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>('.card');
    cards.forEach((card) => {
      const markerId = card.dataset.markerId;
      if (markerId === selectedId) {
        card.setAttribute('aria-selected', 'true');
        card.classList.add('selected');
        // Scroll the selected card into view
        scrollToCard(card);
      } else {
        card.setAttribute('aria-selected', 'false');
        card.classList.remove('selected');
      }
    });

    // Clear focus from all cards when selection is cleared (Escape key)
    if (selectedId === null) {
      const focusedCard = document.activeElement as HTMLElement;
      if (focusedCard?.classList.contains('card')) {
        focusedCard.blur();
      }
    }
  });
}

/**
 * Filters cards based on search query and visible layer set.
 * Uses CSS class toggling (.hidden) instead of DOM removal
 * to maintain event listeners and state.
 *
 * Combines search filtering with layer visibility filtering using AND logic:
 * a card is visible only if it matches BOTH the search query AND its category
 * is in the visibleLayers set.
 *
 * ARIA attributes updated:
 * - aria-hidden="true" - Set on hidden cards
 * - aria-hidden="false" - Set on visible cards
 *
 * @param cards - Array of card HTMLElements to filter
 * @param searchQuery - The search query string to match against
 * @param visibleLayers - Set of currently visible layer categories
 *
 * @example
 * ```typescript
 * const cards = document.querySelectorAll<HTMLElement>('.card');
 * const visibleLayers = new Set(['Community Fridge', 'Food Donation']);
 * filterCards(Array.from(cards), 'fridge', visibleLayers);
 * ```
 */
export function filterCards(cards: HTMLElement[], searchQuery: string, visibleLayers: Set<string>): void {
  const query = searchQuery.toLocaleLowerCase().trim();

  cards.forEach((card) => {
    const name = card.querySelector('.card-name')?.textContent ?? '';
    const category = card.querySelector('.badge')?.textContent ?? '';

    const matchesSearch = name.toLocaleLowerCase().includes(query);
    const matchesLayer = visibleLayers.has(category);

    // Card is visible only if BOTH search AND layer filters pass (AND logic)
    if (matchesSearch && matchesLayer) {
      card.classList.remove('hidden');
      card.setAttribute('aria-hidden', 'false');
    } else {
      card.classList.add('hidden');
      card.setAttribute('aria-hidden', 'true');
    }
  });

  // Update empty state based on visible card count
  const visibleCount = cards.filter((c) => !c.classList.contains('hidden')).length;
  updateEmptyState(visibleCount === 0, searchQuery);
}
