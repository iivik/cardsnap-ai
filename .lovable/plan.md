

## Plan: Fix Contact Card Layout - Truncate Long Titles, Keep Badge Visible

### Problem
Long job titles push the category badge (Partner, Influencer, etc.) off the right edge of the screen on both iOS and Android.

### Solution
Add flexbox constraints to ensure the name/title container shrinks when needed, while the badge always stays visible. Long titles will truncate with ellipsis (...).

### Technical Changes

**File: `src/components/contacts/ContactCard.tsx` (lines 42-50)**

**Current code:**
```tsx
<div className="flex items-start justify-between gap-2">
  <div>
    <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
    {contact.title && (
      <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
    )}
  </div>
  <CategoryBadge category={contact.category} />
</div>
```

**Updated code:**
```tsx
<div className="flex items-start justify-between gap-2">
  <div className="min-w-0 flex-1">
    <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
    {contact.title && (
      <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
    )}
  </div>
  <CategoryBadge category={contact.category} className="flex-shrink-0" />
</div>
```

### What Each Class Does

| Class | Purpose |
|-------|---------|
| `min-w-0` | Allows the flex child to shrink below its content size |
| `flex-1` | Makes the container take remaining space but shrink when needed |
| `flex-shrink-0` | Prevents the badge from ever shrinking |

### Expected Result

```text
┌────────────────────────────────────────────────┐
│ [AV] │ John Smith                    │ Partner │
│      │ Senior VP Information Tech... │         │
│      │                               │         │
│      │ 🏢 Acme Corp                  │         │
│      │ ✉️ john@acme.com              │         │
└────────────────────────────────────────────────┘
```

- Long titles truncate with "..." 
- Category badge always visible on the right
- All cards maintain consistent height
- Full title visible when tapping into contact detail

### Files to Modify

1. **`src/components/contacts/ContactCard.tsx`**
   - Add `min-w-0 flex-1` to the name/title container div (line 43)
   - Add `flex-shrink-0` class to CategoryBadge (line 49)

