

## Issue Summary

**The Problem**: The `card-images` storage bucket was made private for security, but this broke how card images are stored and accessed:

1. **10 existing contacts have broken image URLs** - They store public URLs like:
   ```
   https://vxapeastsknvzvjwhzdo.supabase.co/storage/v1/object/public/card-images/...
   ```
   These URLs no longer work because the bucket is now private.

2. **New contacts would store expiring signed URLs** - The current code stores signed URLs (which expire in 1 hour) in the `card_image_url` field instead of the stable file path. After 1 hour, these images would become inaccessible.

---

## The Fix

**Solution**: Store file paths (not URLs) in the database, and generate signed URLs on-demand when displaying images.

```text
Current (Broken):
Scan -> Store signed URL in card_image_url (expires in 1hr) -> URLs become invalid

Fixed:
Scan -> Store file PATH in card_image_url -> Generate signed URLs on-demand when needed
```

---

## Technical Changes

### 1. Update Review.tsx

Change line 337 from:
```tsx
card_image_url: imageUrl || null,  // Stores expiring signed URL
```
To:
```tsx
card_image_url: imagePath || null,  // Stores stable file path
```

Also update the merge/update flow at line 401.

### 2. Update BatchReview.tsx

Same change at line 327 and line 398 - store `imagePath` instead of `imageUrl`.

### 3. Database Migration

Convert the 10 existing broken public URLs to file paths:

```sql
UPDATE public.contacts
SET card_image_url = REPLACE(
  card_image_url, 
  'https://vxapeastsknvzvjwhzdo.supabase.co/storage/v1/object/public/', 
  ''
)
WHERE card_image_url LIKE '%/object/public/%';
```

This transforms:
```
https://vxapeastsknvzvjwhzdo.supabase.co/storage/v1/object/public/card-images/user-id/file.jpg
```
Into:
```
card-images/user-id/file.jpg
```

### 4. Create useCardImageUrl Hook (Optional - for future display)

If you later want to display card images in the contact detail page, create a hook that generates signed URLs from stored paths:

```tsx
// src/hooks/useCardImageUrl.tsx
export function useCardImageUrl(storedPath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedPath) return;
    
    // Extract actual path and generate signed URL
    const path = storedPath.replace("card-images/", "");
    supabase.storage
      .from("card-images")
      .createSignedUrl(path, 3600)
      .then(({ data }) => setImageUrl(data?.signedUrl || null));
  }, [storedPath]);

  return imageUrl;
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Review.tsx` | Store `imagePath` instead of `imageUrl` in database (2 places) |
| `src/pages/BatchReview.tsx` | Store `imagePath` instead of `imageUrl` in database (2 places) |
| Database migration | Convert 10 existing public URLs to paths |

---

## No Immediate Display Impact

Good news: The card images are currently only displayed during the review flow (before saving), using the signed URL passed via navigation state. The stored `card_image_url` is not currently rendered anywhere in the app, so fixing the storage format won't break any existing UI.

