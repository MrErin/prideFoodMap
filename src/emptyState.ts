/**
 * emptyState - Empty state UI component with ARIA live region
 *
 * Provides accessible empty state messaging for search results.
 * Uses aria-live="polite" to announce changes to screen readers
 * without interrupting current announcements.
 */

/**
 * Empty state element reference
 */
let emptyStateElement: HTMLElement | null = null;

/**
 * Creates an empty state element with ARIA live region.
 * The element is initially hidden and only shown when needed.
 *
 * @param containerSelector - CSS selector for the parent container
 * @returns The created empty state element
 *
 * @example
 * ```typescript
 * const emptyState = createEmptyState('#card-list');
 * document.querySelector('#card-list')?.appendChild(emptyState);
 * ```
 */
export function createEmptyState(containerSelector: string): HTMLElement {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) {
    throw new Error(`Container not found: ${containerSelector}`);
  }

  const emptyState = document.createElement('div');
  emptyState.id = 'empty-state';
  emptyState.className = 'hidden';
  emptyState.setAttribute('role', 'status');

  container.appendChild(emptyState);
  emptyStateElement = emptyState;

  return emptyState;
}

/**
 * Updates the empty state visibility and content.
 *
 * When isEmpty is true:
 * - Removes 'hidden' class to show the element
 * - Sets aria-live="polite" for screen reader announcements
 * - Updates text content with message
 *
 * When isEmpty is false:
 * - Adds 'hidden' class to hide the element
 * - Removes aria-live attribute to prevent stale announcements
 *
 * @param isEmpty - Whether the state should be visible (no results)
 * @param query - The search query that resulted in empty state (optional)
 *
 * @example
 * ```typescript
 * updateEmptyState(true, 'fridge'); // Shows "No locations match your search."
 * updateEmptyState(false); // Hides empty state
 * ```
 */
export function updateEmptyState(isEmpty: boolean, _query: string = ''): void {
  if (!emptyStateElement) {
    // Try to find existing element if not cached
    emptyStateElement = document.getElementById('empty-state');
  }

  if (!emptyStateElement) {
    return; // Silent fail if element doesn't exist yet
  }

  if (isEmpty) {
    emptyStateElement.classList.remove('hidden');
    emptyStateElement.setAttribute('aria-live', 'polite');
    emptyStateElement.textContent = 'No locations match your search.';
  } else {
    emptyStateElement.classList.add('hidden');
    emptyStateElement.removeAttribute('aria-live');
    emptyStateElement.textContent = '';
  }
}
