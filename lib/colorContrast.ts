// Shared between SwipeableOutfitStack and OutfitCard so a kept outfit's
// color computation is identical in both places (a swiped-right card must
// look the same once it settles into the chat as a normal OutfitCard).

// Relative luminance (WCAG) of a #rrggbb hex string, used to pick readable
// text over an arbitrary background color.
export function relativeLuminance(hex: string): number {
  const channels = hex.replace("#", "").match(/.{2}/g)?.map((h) => parseInt(h, 16) / 255) ?? [1, 1, 1];
  const [r = 1, g = 1, b = 1] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableTextColor(backgroundHex: string): string {
  return relativeLuminance(backgroundHex) > 0.45 ? "#2A211C" /* espresso */ : "#FFFFFF" /* porcelain */;
}

// Falls back to butter (the design system's default card color) when an
// outfit somehow has no color story, which the schema otherwise forbids.
export const FALLBACK_CARD_HEX = "#EFC673";
