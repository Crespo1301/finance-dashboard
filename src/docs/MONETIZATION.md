# Monetization roadmap (AdSense-first)

This project is a **client-side** personal finance dashboard (localStorage). The goal is to monetize with ads **without** harming UX, accessibility, or performance.

## Current implementation

- **Reserved ad slots** (fixed `minHeight`) to prevent layout shifts (CLS).
- `AdsSlot` component supports:
  - **Placeholder mode** for pre-approval (no third-party scripts).
  - **Safe script loading** (AdSense script only injects when ads are enabled and the user allows ads).
- Consent entry point:
  - `ConsentBanner` shown until user makes a choice (privacy by default).
  - `Privacy Preferences` modal reachable from banner and footer link.

### Where ads appear

- Below charts: `placement="belowCharts"`
- Between sections: `placement="betweenSections"`
- Footer: `placement="footer"`

> Ads are **not** rendered inside transaction rows or forms.

## How to enable AdSense (after approval)

1. Update `src/config/adsConfig.js`:
   - `ADSENSE_CLIENT`
   - each `adSlot` in `SLOTS`
2. Flip:
   - `ADS_ENABLED: true`
   - optionally: `PLACEHOLDER_MODE: false`
3. Verify:
   - Ads do not load before a user choice (default is denied).
   - Non-personalized ads work when **Ads** is on but **Personalized ads** is off.

## Performance checklist

- Reserve slot space (already done).
- Avoid above-the-fold surprises (limit ad density near the header).
- Consider lazy-loading slots below the fold with IntersectionObserver while still reserving space.
