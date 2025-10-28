# Analytics Layout Update

## Summary
Reorganized the analytics section in `CollectorHome.jsx` so that the "Daily Collection Trend" card sits beside the "Collections by Category" card, with recent receipts displayed beneath them in the new grid.

## Implementation Details

- **File:** `igcfms/src/components/collectingOfficer/CollectorHome.jsx`
- **Change:** Replaced the previous column-structured layout (`analytics-left` and `analytics-right`) with a single `collector-analytics-grid` that renders:
  - A hierarchy card for **Collections by Category**
  - A hierarchy card for **Daily Collection Trend**
  - A full-width hierarchy card for **Recent Receipts** (so it spans the grid width)
- **Benefit:** Ensures the trend chart is visually adjacent to the category pie chart, matching the requested layout.

- **File:** `igcfms/src/components/collectingOfficer/css/collectordashboard.css`
- **Change:** Updated styles to support the new grid arrangement:
  - Added `.analytics-card` and `.analytics-card-full` modifiers to control sizing.
  - `collector-analytics-grid` now acts as a two-column layout on larger screens, collapsing responsively.
  - The receipts container maintains its own internal grid.

## Visual Structure

```
┌─────────────────────────────────────────────┐
│ Collections by Category │ Daily Trend │     │
├─────────────────────────────────────────────┤
│               Recent Receipts               │
└─────────────────────────────────────────────┘
```

- Each card remains a `collector-table-card hierarchy-card` for consistency with existing styling.
- `.analytics-card-full` spans both columns to keep receipts below the two top cards.

## Notes
- No additional dependencies required.
- Layout is responsive; on narrow screens, all cards stack vertically.
- All analytics data bindings remain unchanged.
