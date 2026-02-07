export const ADS_CONFIG = {
  // Keep false until AdSense approval + consent stack is ready
  ADS_ENABLED: false,

  // Show placeholders in reserved slots (safe pre-approval)
  PLACEHOLDER_MODE: true,

  // Replace after approval
  ADSENSE_CLIENT: 'ca-pub-XXXXXXXXXXXXXXXX',

  SLOTS: {
    belowCharts: { adSlot: 'XXXXXXXXXX', minHeight: 250, label: 'Sponsored' },
    betweenSections: { adSlot: 'XXXXXXXXXX', minHeight: 180, label: 'Sponsored' },
    footer: { adSlot: 'XXXXXXXXXX', minHeight: 120, label: 'Sponsored' },
  },
}
