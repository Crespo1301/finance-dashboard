# AdSense readiness checklist

Use this checklist when you're ready to enable **real ads** (beyond placeholders). This project already uses reserved-height ad slots to reduce layout shift and includes a privacy preferences entry point.

## 1) Site basics

- The site has clear navigation and meaningful functionality/content.
- Privacy Policy (`/privacy`) and Terms (`/terms`) are live and linked in the footer.
- You have a visible way to contact you (for example, a GitHub profile link in the Privacy Policy).

## 2) Consent & cookies

- If you serve users in the EEA/UK/CH, you generally need consent for ad storage and personalization before using advertising cookies/identifiers.
- This app includes a consent UI stub and stored preferences; before turning on personalized ads, plan to integrate a CMP.

## 3) Technical setup

1. In `src/config/adsConfig.js`:
   - Set `ADS_ENABLED: true`
   - Set each placement's `adSlot` id
2. Verify ad slots render with **no layout shifts** (reserved heights keep CLS low).
3. Confirm ads are **not inserted into transaction rows or forms**.

## 4) ads.txt

- If you use AdSense, you may need an `ads.txt` file at the root of your domain.
- For Vite/Vercel, put it in `/public/ads.txt` and deploy.
- Add the entry provided by Google in your AdSense dashboard.

## 5) Review checklist

- No broken pages, console errors, or blank screens.
- Privacy Policy and Terms are accurate and match actual behavior.
- Consent experience works and provides a way to change preferences (footer link).
- Core pages load fast on mobile.
