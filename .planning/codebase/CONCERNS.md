# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**TypeScript `any` type usage in tests:**
- Issue: Test mocks use `as any` type assertions to bypass TypeScript strict checking
- Files: `src/test/map.test.ts` (lines 17, 31, 39, 50, 62)
- Impact: Reduces type safety in tests; potential for mock-related bugs to go undetected
- Fix approach: Create proper mock interfaces for `Response` and `global.fetch` or use `vi.fn<typeof fetch>()` pattern

**DOM query timing with setTimeout:**
- Issue: ARIA attributes are added using `setTimeout(..., 100)` and `setTimeout(..., 167)` without waiting for actual DOM readiness
- Files: `src/map.ts` (lines 153-167)
- Impact: Race condition; accessibility attributes may not be applied if DOM takes longer than expected to render
- Fix approach: Use `requestAnimationFrame` or wait for specific DOM elements via `MutationObserver`

**Explicit CDN dependency in HTML:**
- Issue: Leaflet CSS is loaded from CDN in `index.html` while JS is bundled via npm
- Files: `index.html` (lines 7-10)
- Impact: Version mismatch risk between bundled Leaflet JS and CDN CSS; offline functionality blocked
- Fix approach: Import Leaflet CSS through bundler or ensure exact version pinning

**Hard-coded map defaults:**
- Issue: Map center and zoom are hard-coded to USA view
- Files: `src/map.ts` (line 118)
- Impact: Poor UX for international users; markers may be off-screen on load
- Fix approach: Calculate bounds from loaded data and fit view accordingly

## Known Bugs

**Flaky E2E test on Firefox:**
- Symptoms: Popup test fails intermittently on Firefox due to timing issues
- Files: `e2e/map.spec.ts` (line 92)
- Trigger: Running test suite on Firefox browser
- Workaround: Test is currently skipped on Firefox with `test.skip(browserName === 'firefox', 'Flaky on Firefox due to timing')`
- Fix approach: Replace `waitForTimeout` with proper awaitable conditions (e.g., `await expect(popup).toBeVisible()` without arbitrary delays)

**CSV schema mismatch between files:**
- Symptoms: `fridgePins.csv` includes `icon` column not present in `donationPins.csv` or `MarkerData` interface
- Files: `public/data/fridgePins.csv`, `src/map.ts` (interface at lines 4-13)
- Trigger: Reading CSV data with unexpected columns
- Workaround: PapaParse ignores unknown columns with `header: true` setting
- Fix approach: Standardize CSV schemas or make `MarkerData` interface more flexible with partial properties

**Potential XSS vulnerability in marker popups:**
- Symptoms: Location name and description are directly inserted into HTML without sanitization
- Files: `src/map.ts` (lines 82-88)
- Trigger: If CSV data contains malicious HTML/JavaScript in `locationName` or `description` fields
- Workaround: Currently relies on trusted data sources
- Fix approach: HTML-escape user-controlled content before inserting into popup content string

## Security Considerations

**Unvalidated CSV data:**
- Risk: CSV data is fetched and parsed without validation of coordinate ranges or required fields
- Files: `src/map.ts` (lines 31-48, 69-114)
- Current mitigation: Basic `isNaN` checks on coordinates (line 76)
- Recommendations: Add schema validation library (Zod, Yup) or validate coordinate ranges (-90 to 90 for lat, -180 to 180 for lng)

**No Content Security Policy:**
- Risk: No CSP headers set; inline styles and external CDN used
- Files: `index.html` (inline styles at lines 11-78, CDN at lines 7-10)
- Current mitigation: None
- Recommendations: Add CSP headers via server config or meta tag; move inline styles to external CSS

**External CDN dependency:**
- Risk: Loading Leaflet CSS from `cdnjs.cloudflare.com` introduces supply chain risk
- Files: `index.html` (lines 7-10)
- Current mitigation: HTTPS connection
- Recommendations: Bundle CSS locally or pin to specific SRI hash

**No HTTPS enforcement:**
- Risk: Application may load over HTTP in production
- Files: No security headers detected
- Current mitigation: None
- Recommendations: Add HSTS header and ensure production deployment enforces HTTPS

## Performance Bottlenecks

**Synchronous CSV parsing on main thread:**
- Problem: PapaParse runs `dynamicTyping: true` synchronously on potentially large CSV files
- Files: `src/map.ts` (lines 37-47)
- Cause: All CSV data loaded and parsed at once before map initialization
- Improvement path: Use PapaParse's worker mode for large files, or implement pagination

**Multiple setTimeout calls during initialization:**
- Problem: Two sequential `setTimeout` calls (100ms and 167ms) delay map readiness
- Files: `src/map.ts` (lines 55, 153)
- Cause: Waiting for DOM elements without proper event-based approach
- Improvement path: Replace with event-driven architecture using DOM mutation observers

**No asset preloading:**
- Problem: Icons and CSV files fetched only after map initialization begins
- Files: `src/map.ts` (lines 17-29, 130-133)
- Cause: No resource hints or preloading strategy
- Improvement path: Add `<link rel="preload">` hints for critical CSV and icon assets

**Unbounded marker rendering:**
- Problem: All markers added to DOM at once; no virtualization or clustering for large datasets
- Files: `src/map.ts` (lines 61-115)
- Cause: Simple forEach iteration over all CSV rows
- Improvement path: Implement marker clustering (Leaflet.markercluster) for datasets > 100 markers

## Fragile Areas

**Map initialization coupling:**
- Files: `src/main.ts`, `src/map.ts`
- Why fragile: Map initialization is tightly coupled to DOM element IDs (`map`, `announcements`, `loading`, `leaflet-control-layers`)
- Safe modification: When changing HTML structure, update all corresponding DOM queries in `map.ts` and `main.ts`
- Test coverage: Gaps - E2E tests assume specific DOM structure; no unit tests for element presence

**CSS class dependencies:**
- Files: `src/map.ts` (lines 154, 156), `index.html`
- Why fragile: JavaScript relies on Leaflet's internal CSS class names (`.leaflet-control-layers`) which may change in library updates
- Safe modification: Pin Leaflet version or create abstraction layer for DOM queries
- Test coverage: Partial - E2E tests check for `.leaflet-control-layers` visibility but not class name stability

**Icon file paths:**
- Files: `src/map.ts` (lines 17-29), `public/icons/`
- Why fragile: Icon paths concatenated with `baseURL`; no runtime validation that files exist
- Safe modification: When moving icons, update both file system and path references
- Test coverage: None - no tests verify icon assets load successfully

**CSV column ordering assumptions:**
- Files: `public/data/fridgePins.csv`, `public/data/donationPins.csv`, `src/map.ts`
- Why fragile: Different CSV files have different columns; code assumes certain fields exist
- Safe modification: Update `MarkerData` interface when adding/removing CSV columns
- Test coverage: Basic - only tests exact CSV structures; no tests for missing/extra columns

## Scaling Limits

**Marker count:**
- Current capacity: ~32 markers (current dataset)
- Limit: Performance degradation expected above 500-1000 markers without clustering
- Scaling path: Implement Leaflet.markercluster plugin for on-demand rendering

**CSV file size:**
- Current capacity: ~3KB per CSV file
- Limit: Browser memory constraints and main-thread parsing
- Scaling path: Move to streaming CSV parser or implement server-side pagination

**Geographic scope:**
- Current capacity: Localized to Chattanooga, TN area
- Limit: Single view fits all markers; global scale would require zoom/pan UX improvements
- Scaling path: Add geolocation API for "show my location" and auto-fit to user's area

## Dependencies at Risk

**PapaParse:**
- Risk: Package is maintained but infrequently updated; last release may have unparsed bugs
- Impact: CSV parsing failures could prevent map from loading any data
- Migration plan: Consider native browser CSV parsing or alternative libraries if issues arise

**Leaflet (no官方 TypeScript types in main package):**
- Risk: Using `@types/leaflet` separate package which may lag behind Leaflet releases
- Impact: Type mismatches after Leaflet updates could cause build failures
- Migration plan: Monitor Leaflet 1.10+ which may include native TypeScript types

## Missing Critical Features

**No error recovery mechanism:**
- Problem: If CSV loading fails, entire map fails to initialize
- Files: `src/main.ts` (lines 13-20)
- Blocks: Users see error message but no fallback map experience
- Fix approach: Load CSV data progressively; show map with partial data if one source fails

**No offline support:**
- Problem: Application requires network for both tiles and data
- Files: Throughout
- Blocks: Use in areas with poor connectivity
- Fix approach: Implement service worker with cache for tiles and CSV data

**No loading progress indicator:**
- Problem: Binary loading state (loading vs loaded) with no progress feedback
- Files: `index.html` (line 90 - commented out loading div)
- Blocks: User visibility into load status on slow connections
- Fix approach: Re-enable and enhance loading indicator with progress percentage

## Test Coverage Gaps

**Marker icon loading:**
- What's not tested: Verification that custom icon files (fridge.png, donation.png) load successfully
- Files: `src/map.ts` (lines 17-29)
- Risk: Broken icon files silently fail; markers appear with default Leaflet icons
- Priority: Low

**addMarkersFromCSV function:**
- What's not tested: The core marker creation logic, coordinate validation, popup binding
- Files: `src/map.ts` (lines 61-115)
- Risk: Regression bugs in marker rendering or popup behavior
- Priority: High

**initializeMap function:**
- What's not tested: Full map initialization flow, tile loading, layer controls
- Files: `src/map.ts` (lines 117-177)
- Risk: Breaking changes to map configuration go undetected until manual testing
- Priority: High

**Accessibility announcements:**
- What's not tested: Screen reader announcements are triggered correctly
- Files: `src/map.ts` (lines 50-59, 106, 114, 169-171)
- Risk: ARIA live region updates fail silently for assistive technology users
- Priority: Medium

**CSV error handling:**
- What's not tested: Behavior when CSV has malformed rows, missing columns, or invalid data types
- Files: `src/map.ts` (lines 37-47, 69-114)
- Risk: Bad data causes runtime errors or silent failures
- Priority: Medium

---

*Concerns audit: 2026-02-03*
