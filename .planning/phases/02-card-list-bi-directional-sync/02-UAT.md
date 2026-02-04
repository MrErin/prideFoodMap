---
status: complete
phase: 02-card-list-bi-directional-sync
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-02-03T00:00:00Z
updated: 2026-02-03T12:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Card List Display
expected: When the page loads, a list of location cards appears below the map. Each card shows the location name, address, and category (Community Fridge or Food Donation). The cards are displayed in a grid layout.
result: pass

### 2. Alphabetical Ordering
expected: Cards are sorted alphabetically by location name (A to Z).
result: pass

### 3. Responsive Layout
expected: On wider screens, cards appear in multiple columns (3+). On mobile/narrow screens, cards stack in a single column.
result: pass

### 4. Card Click Selection
expected: Clicking a card highlights it with a blue border. The corresponding map marker also becomes highlighted (drop-shadow effect). Only one card/marker can be selected at a time.
result: pass

### 5. Marker Click Selection
expected: Clicking a map marker highlights it with a drop-shadow effect. The corresponding card also becomes highlighted with a blue border. Only one marker/card can be selected at a time.
result: pass

### 6. Selection Clearing (Escape)
expected: Pressing the Escape key clears all selections - the blue border disappears from cards and the marker highlight is removed.
result: issue
reported: "the escape key clears the selections sometimes. But if the user clicks on the map marker and the pop-up is open, then presses escape, the drop shadow remains on the marker and the pop up remains open. The highlight border disappears on both the marker and the card though."
severity: major

### 7. Visual Feedback
expected: Selected items have clear visual feedback: cards show a blue border, markers show a drop-shadow/scale effect. The transitions are smooth.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Pressing Escape key always clears all selections - blue border disappears from cards and marker highlight is removed, popup closes if open"
  status: failed
  reason: "User reported: the escape key clears the selections sometimes. But if the user clicks on the map marker and the pop-up is open, then presses escape, the drop shadow remains on the marker and the pop up remains open. The highlight border disappears on both the marker and the card though."
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
