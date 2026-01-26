

## Plan: Make Contact Icons Tappable with Visual Distinction

### Overview

Transform the contact detail view so that the icons (phone, email, location) become the primary tap targets. Making them blue creates a clear visual affordance that they're interactive, while keeping the text readable and allowing long-press copy/paste.

### Design Approach

**Visual Changes:**
- Phone icon: Blue colored, tappable → opens dialer
- Email icon: Blue colored, tappable → opens email client  
- Location/Address icon: Blue colored, tappable → opens Google Maps
- Company icon: Remains neutral (no action)

**Interaction Model:**
- Tap on icon → triggers the respective action (call, email, maps)
- Tap on text → also triggers the action (larger touch target)
- Long press on text → browser-controlled copy/paste menu

### Technical Details

**File: `src/pages/ContactDetail.tsx`**

For each actionable row (email, phone, address), the icon container will be converted to a tappable button with:

1. **Blue icon color**: `text-primary` instead of `text-foreground`
2. **Subtle blue background tint**: `bg-primary/20` instead of `bg-white/10`
3. **Explicit onClick handler**: Using `window.location.href` for reliable protocol handling
4. **Touch feedback**: `active:scale-95` for visual confirmation
5. **Accessibility**: `role="button"` and `aria-label` for screen readers

**Email Row (lines 218-228):**
```tsx
<div className="flex items-center gap-3">
  <button
    onClick={(e) => {
      e.stopPropagation();
      window.location.href = `mailto:${contact.email}`;
    }}
    className="p-2 rounded-xl bg-primary/20 active:scale-95 transition-transform touch-manipulation"
    aria-label="Send email"
  >
    <Mail className="h-5 w-5 text-primary" />
  </button>
  <div 
    className="flex-1 cursor-pointer"
    onClick={() => window.location.href = `mailto:${contact.email}`}
  >
    <p className="text-sm text-muted-foreground">Email</p>
    <p className="font-medium text-foreground">{contact.email}</p>
  </div>
</div>
```

**Phone Row (lines 230-242):**
```tsx
{contact.phone && (
  <div className="flex items-center gap-3">
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = `tel:${contact.phone}`;
      }}
      className="p-2 rounded-xl bg-primary/20 active:scale-95 transition-transform touch-manipulation"
      aria-label="Call phone"
    >
      <Phone className="h-5 w-5 text-primary" />
    </button>
    <div 
      className="flex-1 cursor-pointer"
      onClick={() => window.location.href = `tel:${contact.phone}`}
    >
      <p className="text-sm text-muted-foreground">Phone</p>
      <p className="font-medium text-foreground">{contact.phone}</p>
    </div>
  </div>
)}
```

**Address Row (lines 244-254):**
```tsx
{contact.address && (
  <div className="flex items-center gap-3">
    <button
      onClick={(e) => {
        e.stopPropagation();
        const query = encodeURIComponent(contact.address || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }}
      className="p-2 rounded-xl bg-primary/20 active:scale-95 transition-transform touch-manipulation"
      aria-label="Open in maps"
    >
      <MapPin className="h-5 w-5 text-primary" />
    </button>
    <div 
      className="flex-1 cursor-pointer"
      onClick={() => {
        const query = encodeURIComponent(contact.address || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }}
    >
      <p className="text-sm text-muted-foreground">Address</p>
      <p className="font-medium text-foreground">{contact.address}</p>
    </div>
  </div>
)}
```

**Company Row (lines 208-216):**
Remains unchanged - company is not actionable.

### Visual Summary

| Field | Icon Color | Icon Background | Tap Action |
|-------|------------|-----------------|------------|
| Company | Gray (neutral) | `bg-white/10` | None |
| Email | Blue (primary) | `bg-primary/20` | Opens email client |
| Phone | Blue (primary) | `bg-primary/20` | Opens phone dialer |
| Address | Blue (primary) | `bg-primary/20` | Opens Google Maps |

### Why This Works

1. **Clear Visual Affordance**: Blue icons signal interactivity, following iOS/Android conventions where blue typically means "tappable"

2. **Dual Tap Target**: Both the icon AND the text area are tappable, maximizing touch accessibility

3. **Touch Feedback**: `active:scale-95` provides instant visual feedback confirming the tap was registered

4. **`touch-manipulation`**: Eliminates the 300ms delay on mobile browsers

5. **Protocol Handling**: `window.location.href` for `tel:` and `mailto:` ensures compatibility with Android WebView browsers like Comet

6. **Google Maps Integration**: Using the universal `maps/search` URL works on all platforms - Android opens Google Maps app if installed, iOS opens Apple Maps or prompts, desktop opens browser

7. **Long Press Preserved**: Since we're not preventing default text selection behavior, long press to copy/paste remains browser-controlled

### Files Modified

1. **`src/pages/ContactDetail.tsx`**
   - Update email row with blue tappable icon
   - Update phone row with blue tappable icon  
   - Update address row with blue tappable icon + Google Maps link
   - Company row unchanged (not actionable)

### Testing Checklist

- [ ] Android: Tap blue phone icon → opens dialer
- [ ] Android: Tap blue email icon → opens email client
- [ ] Android: Tap blue location icon → opens Google Maps
- [ ] iOS: Same behaviors as Android
- [ ] Long press on text → copy menu appears (browser-controlled)
- [ ] Visual: Blue icons have subtle blue background tint
- [ ] Visual: Tap shows scale-down feedback

