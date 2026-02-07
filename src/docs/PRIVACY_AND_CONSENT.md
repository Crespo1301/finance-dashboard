# Privacy & consent notes (CMP-ready stub)

This app is client-side only and stores finance data in **localStorage**.

## What exists today

- `PrivacyPreferencesProvider` stores a basic preference object in localStorage:
  - `analytics` (optional)
  - `ads` (optional)
  - `personalizedAds` (optional)
- Default is **denied** for non-essential categories (privacy by default).
- `ConsentBanner` prompts for a choice.
- Footer includes:
  - Privacy Policy route (`/privacy`)
  - **Privacy Preferences** link (re-opens the modal)

## IMPORTANT: This is not a full CMP

If you serve ads to users in **EEA/UK/Switzerland**, Google may require a **Google-certified CMP** integrated with **IAB TCF** depending on your setup.

This project intentionally uses a lightweight stub so you can:
- avoid loading ad tech until a choice is made
- keep UX stable while you integrate a real CMP later
