
# CardSnap AI — Project Status & Roadmap

## ✅ What's Done

### Core product
- **Auth** — email/password signup + login (`useAuth`), profile auto-created via `initialize_user_options` trigger with 7-day trial.
- **Card scanning** — camera capture (`useCamera`), auto-focus, tri-state flash, auto-capture thresholds.
- **AI extraction** — `extract-card` edge function using Lovable AI Gateway (Gemini), with JWT auth + SSRF protection.
- **Review flow** — single (`Review.tsx`) and batch (`BatchReview.tsx`) review with edit modal, duplicate detection, location capture (GPS + AI inference + history).
- **Contacts** — list, detail page with tappable native links, edit, delete, vCard export (single + bulk to phone).
- **Customization** — user-defined categories and meeting contexts with defaults, reorder, hide.
- **Analytics** — drill-downs, role breakdown, location tree, word cloud, category chart.
- **Settings** — theme (light/dark/system), profile, export, custom options management.
- **Admin pages built** — `AdminDashboard`, `AdminUsers`, `AdminPromoCodes`, `AdminLayout` (MRR, analytics, promo code CRUD).

### Backend & security
- Strict RLS on all tables (`contacts`, `profiles`, `user_roles`, `user_categories`, etc.).
- `user_roles` table with `has_role()` security-definer function (no privilege escalation).
- Profile UPDATE policy locks down `subscription_tier`, `scan_credits`, `total_scans_used` — only modifiable via the `decrement_scan_credit()` RPC.
- `card-images` storage bucket is **private** with per-user folder policies; signed URLs generated on demand.
- Existing contacts migrated from public URLs → stable file paths.
- HIBP leaked password protection enabled.
- Promo code validation RPC (`validate_promo_code`) + admin-only management policy.

---

## ❌ What's Missing

### 1. Razorpay payment integration (highest priority)
The DB schema is fully prepared (`razorpay_customer_id`, `razorpay_subscription_id`, `subscription_tier`, `subscription_status`, `subscription_currency`, `promo_code_used`) but **zero Razorpay code exists**:
- No checkout/subscription edge functions
- No webhook handler for subscription events
- No paywall UI when scan credits hit 0 or trial expires
- No "Upgrade" page / pricing screen
- No Razorpay SDK on client
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` not configured

### 2. Admin routes not wired up
`AdminDashboard`, `AdminUsers`, `AdminPromoCodes` exist but `App.tsx` has **no `/admin` routes**. The Settings page links to `/admin` → 404. Also no route guard checking `isAdmin`.

### 3. Card image not displayed in contact details
`card_image_url` now stores a path, but `ContactDetail.tsx` doesn't render the scanned image. Needs a `useCardImageUrl` hook to fetch a signed URL on demand.

### 4. Native iOS/Android packaging
README says "PWA-ready / native packaging — roadmap". No Capacitor config in the project yet.

### 5. Email verification / OAuth
Currently email + password only. No Google sign-in. No email verification flow visible (auto-confirm status unclear).

### 6. Trial enforcement & credit-out UX
`canScan()` exists in `useProfile`, but no UI blocks navigation to `/scan` when it returns false — user just hits the camera and the edge function would (or should) reject.

---

## 🛣️ Way Forward — Suggested Order

### Phase 1 — Make payments work (1–2 sessions)
1. Add Razorpay secrets (Key ID, Key Secret, Webhook Secret).
2. Build `/upgrade` pricing page (Pro / Business, INR + USD) reading from `profile.subscription_currency`.
3. Edge function `create-razorpay-subscription` — creates customer + subscription, returns checkout payload.
4. Edge function `razorpay-webhook` — handles `subscription.activated`, `subscription.charged`, `subscription.cancelled`, updates `profiles` row with service-role client.
5. Promo code application at checkout (use existing `validate_promo_code` RPC, write `promo_code_used` + bonus credits).
6. Client checkout flow (Razorpay JS SDK) + post-payment refetch profile.
7. Paywall modal: triggered when `canScan()` is false, deep-links to `/upgrade`.

### Phase 2 — Wire admin & polish (1 session)
1. Register `/admin/*` routes in `App.tsx` with an `<AdminRoute>` guard using `isAdmin` from `useProfile`.
2. Add `useCardImageUrl(path)` hook (returns signed URL, ~1h expiry, refetch on expiry); render image on `ContactDetail`.
3. Pre-flight scan-credit check in the `/scan` route to redirect to `/upgrade` instead of failing in the edge function.

### Phase 3 — Auth improvements (½ session)
1. Add Google OAuth provider (Supabase Auth → Google).
2. Confirm email verification setting matches the desired flow.

### Phase 4 — Native packaging (1 session)
1. Add Capacitor (iOS + Android shells).
2. Wire camera permissions, native share, and file save through Capacitor plugins (already partially abstracted in `export-utils`).
3. Build, test on device, publish.

---

## Notes / Decisions Needed Before Phase 1
- **Pricing tiers**: Pro vs Business — final INR + USD amounts, monthly vs annual, included scan credits per month?
- **Trial behavior after expiry**: hard block, or downgrade to "free with 0 credits"?
- **Currency selection**: auto-detect by IP/locale or always user-toggled in Settings (current behavior)?

If you confirm Phase 1 + the three pricing questions above, I'll start with the Razorpay integration in the next loop.
