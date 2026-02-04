# Phase 04: Polish & Accessibility Enhancement - Research

**Researched:** 2026-02-03
**Domain:** Auto-scroll, keyboard navigation, and accessible DOM timing for Leaflet maps
**Confidence:** HIGH

## Summary

This research covers implementing Phase 4 polish features for the Pride Food Map. The project uses vanilla TypeScript with Leaflet 1.9.4, with an existing Observer-based StateManager for bi-directional marker-card synchronization and search/filter functionality already complete.

The core requirements are:
1. Auto-scroll card list to show corresponding card when marker is clicked
2. Keyboard navigation on cards (Tab, Enter, Escape)
3. Complete ARIA attribute coverage for all interactive elements

**Primary recommendation:** Use native browser APIs - `Element.scrollIntoView()` for auto-scroll (with `prefers-reduced-motion` support), leverage existing `tabindex="0"` on cards for keyboard navigation, and ensure focus management follows WAI-ARIA Authoring Practices. No external libraries needed. Extend existing StateManager event-driven patterns rather than introducing timing dependencies.

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Element.scrollIntoView() | Native | Auto-scroll to element | Built-in API, smooth behavior option |
| prefers-reduced-motion | CSS Media Query | Respect user motion preferences | Accessibility requirement, WCAG 2.2 |
| Keyboard events | Native DOM API | Enter/Escape key handling | No dependencies, standard pattern |
| ARIA attributes | WAI-ARIA 1.2 | Screen reader announcements | W3C standard, excellent support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| requestAnimationFrame | Native | Smooth DOM updates | Already used in project for timing |
| StateManager.subscribe | Existing | Event-driven scroll triggers | Leverage existing observer pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| scrollIntoView | jQuery animate / manual scrollTo | Native is simpler, no dependency |
| tabindex="0" | Arrow key grid navigation | Tab navigation is standard, arrow keys add complexity |
| CSS scroll-behavior | JS-only smooth scroll | CSS is declarative, but JS gives more control for focus management |

**Installation:**
```bash
# No new dependencies needed - all built-in APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cards.ts           # Existing: add scrollIntoView to updateCardSelection
├── map.ts             # Existing: markers already trigger selection via StateManager
├── stateManager.ts    # Existing: selection state management
├── keyboardNav.ts     # NEW: keyboard event handlers for cards (optional)
└── main.ts            # Existing: wire up keyboard listeners
```

### Pattern 1: Auto-Scroll with Accessibility
**What:** Use `scrollIntoView()` with `behavior: 'smooth'` option, but respect `prefers-reduced-motion`
**When to use:** User clicks marker and card list should scroll to corresponding card
**Example:**
```typescript
// Source: MDN + CSS-Tricks accessibility patterns
function scrollToCard(cardElement: HTMLElement): void {
  // Check user's motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollOptions: ScrollIntoViewOptions = {
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'nearest'
  };

  cardElement.scrollIntoView(scrollOptions);

  // CRITICAL: Set focus for keyboard accessibility
  cardElement.focus();
}
```

### Pattern 2: Keyboard Navigation for Cards
**What:** Cards already have `tabindex="0"` - add Enter key activation in event listener
**When to use:** User navigates with Tab key and presses Enter to select card
**Example:**
```typescript
// Source: Smashing Magazine keyboard accessibility guide (2022)
function setupKeyboardNavigation(cards: HTMLElement[]): void {
  cards.forEach((card) => {
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const markerId = card.dataset.markerId;
        if (markerId) {
          stateManager.setSelected(markerId);
        }
      }
    });
  });
}

// Escape key handler already exists in main.ts
// Just ensure cards can receive focus when selected
```

### Pattern 3: Focus Management After Auto-Scroll
**What:** After scrolling to card, move focus so keyboard users can continue navigating
**When to use:** After marker click triggers auto-scroll
**Example:**
```typescript
// Source: CSS-Tricks "Smooth Scrolling and Accessibility"
function highlightAndScrollToCard(markerId: string): void {
  const card = document.querySelector(`[data-marker-id="${markerId}"]`) as HTMLElement;

  if (card) {
    // Use requestAnimationFrame for timing (existing pattern in project)
    requestAnimationFrame(() => {
      // First update selection styling
      card.setAttribute('aria-selected', 'true');
      card.classList.add('selected');

      // Then scroll and focus
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      card.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest'
      });

      // CRITICAL: Set focus for keyboard accessibility
      card.focus();
    });
  }
}
```

### Pattern 4: Listening for Motion Preference Changes
**What:** Watch for changes to `prefers-reduced-motion` media query
**When to use:** User changes system settings while page is open
**Example:**
```typescript
// Source: CSS-Tricks smooth scrolling accessibility
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Store current preference
let userPrefersReducedMotion = motionQuery.matches;

// Listen for changes
motionQuery.addEventListener('change', (e) => {
  userPrefersReducedMotion = e.matches;
});
```

### Anti-Patterns to Avoid
- **Auto-scroll without focus management:** Keyboard users can't continue navigating after scroll
- **Ignoring prefers-reduced-motion:** Causes motion sickness for vestibular disorder users
- **Using setTimeout for scroll timing:** Use requestAnimationFrame instead (already used in project)
- **Positive tabindex values:** Breaks natural tab order, violates WCAG 2.4.3 Focus Order
- **Removing outline on focus:** Use outline-color: transparent for high contrast mode instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll animation | Custom requestAnimationFrame loop | scrollIntoView({behavior: 'smooth'}) | Handles edge cases, respects browser settings |
| Motion detection | User preference setting storage | window.matchMedia('(prefers-reduced-motion)') | System-level preference, no storage needed |
| Focus management | Manual focus tracking | Native focus() + tabindex="0" | Built-in browser behavior |
| Keyboard event handling | Custom keyboard mapping | Standard DOM keyboard events | Consistent with browser patterns |

**Key insight:** Auto-scroll and keyboard navigation are well-solved problems. Use native APIs and focus on accessibility integration (focus management, motion preferences) rather than building custom implementations.

## Common Pitfalls

### Pitfall 1: Auto-Scroll Without Focus Management
**What goes wrong:** User clicks marker, page scrolls to card, but keyboard focus remains on marker. Screen reader users are confused - they hear marker announcement but see card. Keyboard users must Tab through entire map to reach card.

**Why it happens:** `scrollIntoView()` only moves the viewport. It doesn't update keyboard focus. Many developers forget focus is separate from scroll position.

**How to avoid:** Always call `element.focus()` after `scrollIntoView()`. Ensure target element has `tabindex="0"` (already present on cards). Use requestAnimationFrame to ensure DOM has updated before focusing.

**Warning signs:** Clicking marker scrolls viewport but Tab key doesn't move focus to card. Screen reader testing shows focus didn't follow scroll.

### Pitfall 2: Ignoring prefers-reduced-motion
**What goes wrong:** Users with vestibular disorders experience nausea, dizziness, or migraines from smooth scrolling. They've set OS preference to reduce motion, but website ignores it.

**Why it happens:** Smooth scrolling is often enabled globally without checking user preferences. CSS `scroll-behavior: smooth` applies to all scroll operations indiscriminately.

**How to avoid:** Always check `window.matchMedia('(prefers-reduced-motion: reduce)')` before using smooth behavior. Use 'auto' (instant) when preference is set. Listen for changes to media query.

**Warning signs:** No mention of reduced motion in implementation. Testing with macOS "Reduce motion" or Windows "Animations" settings still shows smooth scroll.

### Pitfall 3: Using setTimeout for DOM Timing
**What goes wrong:** Auto-scroll fails because card element dimensions aren't computed yet. Or scroll works but focus doesn't because element isn't visible. Intermittent failures that are hard to reproduce.

**Why it happens:** Developers use arbitrary `setTimeout(..., 100)` delays hoping DOM will be ready. This is unreliable - sometimes too fast, sometimes too slow.

**How to avoid:** Use `requestAnimationFrame()` for DOM-related timing (already used in updateCardSelection). For waiting on specific DOM changes, use MutationObserver. Rely on Leaflet's built-in events for map-related timing.

**Warning signs:** Arbitrary timeout values in code. Intermittent test failures. Comments like "wait for DOM to update".

### Pitfall 4: Cards Not Focusable After Selection
**What goes wrong:** User clicks marker, card scrolls into view and gets selected border, but pressing Tab moves focus away from card. Keyboard user can't interact with selected card.

**Why it happens:** Selection styling (CSS class, aria-selected) is separate from focus state. Cards have `tabindex="0"` but focus() is never called after scroll.

**How to avoid:** Always call `focus()` on card element after scrolling to it. Ensure `tabindex="0"` is set (already present). Test with keyboard only - no mouse.

**Warning signs:** Visual selection works but Tab key doesn't move focus to selected card. Keyboard-only testing reveals broken workflow.

### Pitfall 5: Enter Key Doesn't Activate Cards
**What goes wrong:** Keyboard user Tabs to card, presses Enter, nothing happens. Or Space key triggers but Enter doesn't. User doesn't know how to select card with keyboard.

**Why it happens:** Only click event listener is attached. Many keyboard users expect Enter to activate focusable elements (especially buttons, links, and interactive cards).

**How to avoid:** Add keydown event listener for Enter and Space keys. Prevent default behavior for Space (which would scroll page). Trigger same action as click event.

**Warning signs:** Keyboard users report they can't "click" cards. Testing reveals Tab reaches card but Enter does nothing.

### Pitfall 6: Escape Key Doesn't Clear Selection
**What goes wrong:** User selects card with mouse, wants to deselect with keyboard (Escape), but nothing happens. Or Escape works for markers but not cards. Inconsistent behavior.

**Why it happens:** Escape key listener is on window (already in main.ts), but card-specific Escape handling might be missing or inconsistent with marker behavior.

**How to avoid:** Ensure Escape clears selection regardless of current focus. Test Escape from marker focus, card focus, and document focus. Announce "selection cleared" to screen readers.

**Warning signs:** Pressing Escape doesn't deselect selected card. Inconsistent behavior between markers and cards.

## Code Examples

Verified patterns from official sources:

### Auto-Scroll with Reduced Motion Support
```typescript
// Source: CSS-Tricks "Smooth Scrolling and Accessibility"
// https://css-tricks.com/smooth-scrolling-accessibility/

export function scrollToCard(card: HTMLElement): void {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shouldReduceMotion = motionQuery.matches;

  card.scrollIntoView({
    behavior: shouldReduceMotion ? 'auto' : 'smooth',
    block: 'nearest'
  });

  // Always set focus after scroll for accessibility
  card.focus();
}
```

### Keyboard Event Handler for Cards
```typescript
// Source: Smashing Magazine "A Guide To Keyboard Accessibility"
// https://www.smashingmagazine.com/2022/11/guide-keyboard-accessibility-html-css-part1/

function setupCardKeyboardNavigation(card: HTMLElement): void {
  card.addEventListener('keydown', (e: KeyboardEvent) => {
    // Enter or Space activates the card
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent Space from scrolling page
      const markerId = card.dataset.markerId;
      if (markerId) {
        stateManager.setSelected(markerId);
      }
    }
  });
}
```

### Complete Selection with Scroll and Focus
```typescript
// Pattern combines existing StateManager with new scroll behavior
// Uses requestAnimationFrame timing already established in project

export function updateCardSelectionWithScroll(
  selectedId: string | null
): void {
  requestAnimationFrame(() => {
    const container = document.querySelector<HTMLElement>('#card-list');
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>('.card');

    cards.forEach((card) => {
      const markerId = card.dataset.markerId;

      if (markerId === selectedId) {
        // Update selection state
        card.setAttribute('aria-selected', 'true');
        card.classList.add('selected');

        // Scroll into view respecting motion preferences
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

        card.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest'
        });

        // Move focus for keyboard accessibility
        card.focus();

        // Announce to screen readers (optional, aria-selected may be sufficient)
        const cardName = card.querySelector('.card-name')?.textContent ?? '';
        announce(`Selected ${cardName}`);
      } else {
        // Clear selection
        card.setAttribute('aria-selected', 'false');
        card.classList.remove('selected');
      }
    });
  });
}
```

### Tab Index Management
```typescript
// Cards already have tabindex="0" in createCardElement()
// This is the correct approach - no changes needed

// Source: Smashing Magazine - tabindex="0" makes elements focusable
// https://www.smashingmagazine.com/2022/11/guide-keyboard-accessibility-html-css-part1/

// Current implementation (correct):
export function createCardElement(cardData: LocationCard): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.markerId = cardData.markerId;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-selected', 'false');
  card.setAttribute('tabindex', '0'); // CORRECT - makes keyboard focusable
  // ... rest of implementation
}
```

### ARIA Attributes Already Present
```typescript
// Cards already have proper ARIA attributes - verify completeness

// Current ARIA attributes on cards (from createCardElement):
// - role="listitem" ✓
// - aria-selected="false"/"true" ✓ (toggled in updateCardSelection)
// - tabindex="0" ✓

// Additional ARIA to verify:
// - aria-hidden on hidden cards ✓ (in filterCards)
// - aria-label on card list container ✓ (in renderCards)
// - aria-live on empty state ✓ (in emptyState.ts)

// Map markers have:
// - role="button" ✓
// - aria-label ✓
// - tabindex="0" ✓

// Layer control has:
// - role="group" ✓
// - aria-label ✓
// - aria-label on inputs ✓

// Assessment: ARIA coverage is already comprehensive
// Phase 04 should verify no interactive elements are missing ARIA
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setTimeout for DOM timing | requestAnimationFrame | ~2013 | More reliable, syncs with paint cycle |
| Always smooth scroll | prefers-reduced-motion check | Safari 10.1 (2017) | Accessibility requirement, WCAG 2.2 |
| Separate scroll/focus | Combined scrollIntoView + focus() | - | Expected behavior for keyboard users |
| Click-only cards | Click + Enter/Space activation | - | WCAG 2.1.1 Keyboard requirement |

**Deprecated/outdated:**
- **jQuery animate() for scroll:** Native scrollIntoView is simpler and faster
- **Arbitrary setTimeout delays:** Use requestAnimationFrame for DOM timing
- **Ignoring reduced motion preference:** Violates WCAG 2.2, excludes users with vestibular disorders
- **Positive tabindex values:** Breaks natural tab order, WCAG 2.4.3 violation

## Open Questions

1. **Scroll position within card list**
   - What we know: scrollIntoView with 'block: 'nearest'' will scroll minimally
   - What's unclear: Should selected card be at top, center, or just visible?
   - Recommendation: Use 'nearest' for minimal disruption. 'center' could hide cards above selection.

2. **Focus indicator visibility**
   - What we know: Cards have outline when focused (CSS `*:focus { outline: 3px solid #007bff; }`)
   - What's unclear: Does selected state (aria-selected='true') have distinct visual indicator from focus?
   - Recommendation: Ensure focus and selection have distinct visual styles. Focus follows keyboard, selection follows click/Enter.

3. **Arrow key navigation**
   - What we know: Tab navigation works, cards have tabindex="0"
   - What's unclear: Should arrow keys navigate between cards (grid pattern)?
   - Recommendation: Start with Tab-only navigation. Arrow keys add complexity and may confuse users expecting grid behavior. Evaluate based on user feedback.

## Sources

### Primary (HIGH confidence)
- [MDN - Element: scrollIntoView()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) - Official API documentation (Dec 2025)
- [MDN - Window.matchMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) - Media query API for motion preference detection
- [MDN - MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) - DOM change observation API (June 2025)
- [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) - Official W3C accessibility patterns
- [WAI-ARIA 1.2 Specification](https://w3c.github.io/aria/) - Updated specification (Jan 2026)

### Secondary (MEDIUM confidence)
- [CSS-Tricks - Smooth Scrolling and Accessibility](https://css-tricks.com/smooth-scrolling-accessibility/) - Focus management and motion preferences (Apr 2017 - principles still current)
- [Smashing Magazine - A Guide To Keyboard Accessibility (Part 1)](https://www.smashingmagazine.com/2022/11/guide-keyboard-accessibility-html-css-part1/) - Comprehensive keyboard navigation guide (Nov 2022)
- [MDN - Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Keyboard-navigable_JavaScript_widgets) - Focus management patterns (June 2025)
- [WebAIM - Keyboard Navigation Requirements for Web Maps](https://webaim.org/discussion/mail_message?id=50896) - Map-specific keyboard accessibility

### Tertiary (LOW confidence)
- [Native Smooth Scrolling - Dev Tips](https://umaar.com/dev-tips/235-smooth-scroll-into-view/) - Quick reference for scrollIntoView
- [Zander's Code Notes - CSS scroll-behavior](https://notes.zander.wtf/notes/css-scroll-behaviour/) - prefers-reduced-motion implementation
- [UXPin - Keyboard Navigation Patterns for Complex Widgets](https://www.uxpin.com/studio/blog/keyboard-navigation-patterns-complex-widgets/) - General keyboard navigation patterns (Dec 2025)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All built-in APIs with excellent browser support
- Architecture: HIGH - Patterns verified against official documentation and established best practices
- Pitfalls: HIGH - All pitfalls documented with verified solutions from authoritative sources

**Research date:** 2026-02-03
**Valid until:** 2026-05-03 (90 days - stable domain, but accessibility guidelines may update)
