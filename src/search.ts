/**
 * search - Debounced search input handler
 *
 * Provides search input functionality with debounced updates to prevent
 * excessive state changes while typing. Includes clear/reset button support.
 */

import type { StateManager } from './stateManager.ts';

/**
 * Creates a debounced version of a function.
 * The function will only be called after the specified delay has passed
 * since the last invocation.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * debouncedSearch('fridge'); // Will call after 300ms
 * debouncedSearch('fridge x'); // Resets timer, will call after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Sets up search input event listeners with debounced state updates.
 *
 * Features:
 * - Debounced search (300ms) to prevent excessive updates
 * - Clear/reset button visibility based on input value
 * - Automatic state updates via StateManager.setSearchQuery
 *
 * @param inputElement - The search input element
 * @param resetButton - The clear/reset button element
 * @param stateManager - The StateManager instance for search query state
 *
 * @example
 * ```typescript
 * const input = document.getElementById('search-input') as HTMLInputElement;
 * const reset = document.getElementById('search-reset') as HTMLElement;
 * setupSearchInput(input, reset, stateManager);
 * ```
 */
export function setupSearchInput(
  inputElement: HTMLInputElement,
  resetButton: HTMLElement,
  stateManager: StateManager
): void {
  // Update reset button visibility based on input value
  const updateResetButton = () => {
    if (inputElement.value.trim()) {
      resetButton.classList.remove('hidden');
    } else {
      resetButton.classList.add('hidden');
    }
  };

  // Create debounced search handler (300ms delay)
  const debouncedSearch = debounce(
    (query: string) => {
      stateManager.setSearchQuery(query);
    },
    300
  );

  // Input event listener - updates reset button and debounced search
  inputElement.addEventListener('input', () => {
    updateResetButton();
    debouncedSearch(inputElement.value);
  });

  // Reset button click listener - clears input and search
  resetButton.addEventListener('click', () => {
    inputElement.value = '';
    updateResetButton();
    stateManager.setSearchQuery('');
    inputElement.focus();
  });
}
