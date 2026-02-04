import type { MarkerData } from './map.ts';
import type { SelectionState } from './stateManager.ts';
import { updateEmptyState } from './emptyState.ts';

interface LocationCard extends MarkerData {
  markerId: string;
  category: 'Community Fridge' | 'Food Donation';
}

/**
 * Creates a card element for a location.
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
 * Renders location cards to a container.
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
 * Uses aria-selected attribute for accessibility and CSS class for visual styling.
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
      } else {
        card.setAttribute('aria-selected', 'false');
        card.classList.remove('selected');
      }
    });
  });
}

/**
 * Filters cards based on search query.
 * Uses CSS class toggling (.hidden) instead of DOM removal
 * to maintain event listeners and state.
 *
 * @param cards - Array of card HTMLElements to filter
 * @param searchQuery - The search query string to match against
 *
 * @example
 * ```typescript
 * const cards = document.querySelectorAll<HTMLElement>('.card');
 * filterCards(Array.from(cards), 'fridge');
 * ```
 */
export function filterCards(cards: HTMLElement[], searchQuery: string): void {
  const query = searchQuery.toLocaleLowerCase().trim();

  cards.forEach((card) => {
    const name = card.querySelector('.card-name')?.textContent ?? '';
    const matches = name.toLocaleLowerCase().includes(query);

    if (matches) {
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
