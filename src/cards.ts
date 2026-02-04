import type { MarkerData } from './map.ts';

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
