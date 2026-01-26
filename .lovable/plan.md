

## Plan: Fix Phone and Email Links for Mobile Browsers

### Problem Summary

The current implementation uses `window.location.href` for `tel:` and `mailto:` protocols, which causes:
- **Android (Comet/WebView)**: `net::ERR_UNKNOWN_URL_SCHEME` error - WebView treats these as web navigation
- **iOS Safari**: Taps on phone/email icons do nothing - Safari blocks programmatic navigation to non-web protocols
- **Address link works**: Because it uses `window.open` with a standard `https://` URL

### Root Cause

Android WebView-based browsers do not natively handle non-web protocols like `tel:` or `mailto:`. When `window.location.href` is used, the browser attempts to navigate to these URIs as if they were web pages, resulting in the error.

iOS Safari has similar restrictions and may silently block `window.location.href` assignments for non-standard protocols within click handlers.

### Solution

Replace JavaScript-based navigation with native `<a>` tags. Browsers universally recognize `<a href="tel:...">` and `<a href="mailto:...">` as protocol handlers and will correctly invoke the dialer or email client.

### Technical Changes

**File: `src/pages/ContactDetail.tsx`**

Replace the current `<button>` and `<div onClick>` pattern with proper `<a>` tags:

**Email Row (lines 218-236):**
```tsx
<a 
  href={`mailto:${contact.email}`}
  className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
>
  <div className="p-2 rounded-xl bg-primary/20">
    <Mail className="h-5 w-5 text-primary" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm text-muted-foreground">Email</p>
    <p className="font-medium text-foreground break-all">{contact.email}</p>
  </div>
</a>
```

**Phone Row (lines 238-258):**
```tsx
{contact.phone && (
  <a 
    href={`tel:${contact.phone}`}
    className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
  >
    <div className="p-2 rounded-xl bg-primary/20">
      <Phone className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">Phone</p>
      <p className="font-medium text-foreground">{contact.phone}</p>
    </div>
  </a>
)}
```

**Address Row (lines 260-284):**
Keep using `window.open` since Google Maps requires an HTTPS URL, but wrap the entire row in a clickable container for consistency:
```tsx
{contact.address && (
  <a 
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address || '')}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg active:bg-white/10 transition-colors touch-manipulation"
  >
    <div className="p-2 rounded-xl bg-primary/20">
      <MapPin className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">Address</p>
      <p className="font-medium text-foreground">{contact.address}</p>
    </div>
  </a>
)}
```

### Why This Works

| Current Approach | New Approach |
|------------------|--------------|
| `<button onClick={() => window.location.href = 'tel:...'>` | `<a href="tel:...">` |
| WebView treats as navigation request | Browser recognizes as protocol handler |
| Fails with `ERR_UNKNOWN_URL_SCHEME` | Opens native dialer/email client |

1. **Native `<a>` tags**: Browsers universally recognize anchor tags with `tel:` and `mailto:` hrefs as intent triggers, not web navigation
2. **No JavaScript needed**: The browser/OS handles protocol detection natively without any JavaScript involvement
3. **Consistent pattern**: All three rows (email, phone, address) now use the same `<a>` tag pattern
4. **Touch feedback preserved**: `active:bg-white/10` provides visual tap feedback
5. **Long press works**: Native anchor tags preserve browser-controlled long-press behavior for copy/paste

### Visual Design

The blue icon styling is preserved:
- Icons remain `text-primary` (blue)
- Icon backgrounds remain `bg-primary/20` (subtle blue tint)
- The entire row is tappable with visual feedback on press

### Files Modified

1. **`src/pages/ContactDetail.tsx`**
   - Replace email button+div with single `<a>` tag
   - Replace phone button+div with single `<a>` tag
   - Replace address button+div with single `<a>` tag (keeping `target="_blank"`)

### Testing Checklist

After implementation, verify:
- [ ] Android Comet: Tap phone row → opens dialer (no error)
- [ ] Android Comet: Tap email row → opens email client (no error)
- [ ] Android Comet: Tap address row → opens Google Maps
- [ ] iOS Safari: Tap phone row → opens dialer
- [ ] iOS Safari: Tap email row → opens Mail app
- [ ] iOS Safari: Tap address row → opens Maps
- [ ] Desktop: All links work as expected
- [ ] Long press on any row → copy menu appears

