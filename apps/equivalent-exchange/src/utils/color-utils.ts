function hexToHSL(hex: string) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function shiftHue(h: number, shift: number) {
  return (h + shift + 360) % 360;
}

export function generateThemeCSS(
  baseHex: string,
  variant: "neutral" | "tinted" | "fill" | "saturated" = "neutral"
): string {
  if (!baseHex) return "";

  const base = hexToHSL(baseHex);

  const h = base.h;
  const s = base.s;
  const l = base.l;

  // Chart palette: harmonious colors around the wheel
  const chartColors = [
    { h: h, s, l: l + 20 },
    { h: shiftHue(h, 20), s, l },
    { h: shiftHue(h, 40), s, l: l - 5 },
    { h: shiftHue(h, 60), s, l: l - 10 },
    { h: shiftHue(h, 80), s, l: l - 15 },
  ];

  const toHSL = (c: { h: number; s: number; l: number }) =>
    `hsl(${c.h.toFixed(4)} ${c.s.toFixed(4)}% ${c.l.toFixed(4)}%)`;

  // === Variant 1: Neutral background ===
  const lightNeutral = `
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 5%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(0 0% 5%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(0 0% 5%);
  --primary: ${toHSL({ h, s, l })};
  --primary-foreground: hsl(0 0% 98%);
  --secondary: hsl(0 0% 96%);
  --secondary-foreground: hsl(0 0% 10%);
  --muted: hsl(0 0% 96%);
  --muted-foreground: hsl(0 0% 45%);
  --accent: hsl(0 0% 96%);
  --accent-foreground: hsl(0 0% 10%);
  --destructive: hsl(0 100% 40%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(0 0% 90%);
  --input: hsl(0 0% 90%);
  --ring: hsl(0 0% 63%);
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  const darkNeutral = `
.dark {
  --background: hsl(0 0% 5%);
  --foreground: hsl(0 0% 98%);
  --card: hsl(0 0% 10%);
  --card-foreground: hsl(0 0% 98%);
  --popover: hsl(0 0% 15%);
  --popover-foreground: hsl(0 0% 98%);
  --primary: ${toHSL({ h, s, l })};
  --primary-foreground: hsl(0 0% 10%);
  --secondary: hsl(0 0% 15%);
  --secondary-foreground: hsl(0 0% 98%);
  --muted: hsl(0 0% 15%);
  --muted-foreground: hsl(0 0% 63%);
  --accent: hsl(0 0% 25%);
  --accent-foreground: hsl(0 0% 98%);
  --destructive: hsl(0 100% 65%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: hsl(0 0% 15%);
  --input: hsl(0 0% 20%);
  --ring: hsl(0 0% 45%);
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  // === Variant 2: Tinted background ===
  const lightTinted = `
:root {
  --background: ${toHSL({ h, s: s * 0.1, l: 98 })};
  --foreground: hsl(0 0% 5%);
  --card: ${toHSL({ h, s: s * 0.1, l: 100 })};
  --card-foreground: hsl(0 0% 5%);
  --popover: ${toHSL({ h, s: s * 0.1, l: 100 })};
  --popover-foreground: hsl(0 0% 5%);
  --primary: ${toHSL({ h, s, l })};
  --primary-foreground: hsl(0 0% 98%);
  --secondary: ${toHSL({ h, s: s * 0.1, l: 96 })};
  --secondary-foreground: hsl(0 0% 10%);
  --muted: ${toHSL({ h, s: s * 0.1, l: 96 })};
  --muted-foreground: hsl(0 0% 45%);
  --accent: ${toHSL({ h, s: s * 0.1, l: 96 })};
  --accent-foreground: hsl(0 0% 10%);
  --destructive: hsl(0 100% 40%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: ${toHSL({ h, s: s * 0.1, l: 90 })};
  --input: ${toHSL({ h, s: s * 0.1, l: 90 })};
  --ring: ${toHSL({ h, s: s * 0.1, l: 63 })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  const darkTinted = `
.dark {
  --background: ${toHSL({ h, s: s * 0.2, l: 8 })};
  --foreground: hsl(0 0% 98%);
  --card: ${toHSL({ h, s: s * 0.2, l: 12 })};
  --card-foreground: hsl(0 0% 98%);
  --popover: ${toHSL({ h, s: s * 0.2, l: 15 })};
  --popover-foreground: hsl(0 0% 98%);
  --primary: ${toHSL({ h, s, l: Math.min(l + 20, 95) })};
  --primary-foreground: hsl(0 0% 10%);
  --secondary: ${toHSL({ h, s: s * 0.2, l: 15 })};
  --secondary-foreground: hsl(0 0% 98%);
  --muted: ${toHSL({ h, s: s * 0.2, l: 15 })};
  --muted-foreground: hsl(0 0% 63%);
  --accent: ${toHSL({ h, s: s * 0.2, l: 25 })};
  --accent-foreground: hsl(0 0% 98%);
  --destructive: hsl(0 100% 65%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: ${toHSL({ h, s: s * 0.2, l: 15 })};
  --input: ${toHSL({ h, s: s * 0.2, l: 20 })};
  --ring: ${toHSL({ h, s: s * 0.2, l: 45 })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  // === Variant 3: Fill background ===
  const lightFill = `
:root {
  --background: ${toHSL({ h, s: s * 0.3, l: 97 })};
  --foreground: hsl(0 0% 5%);
  --card: ${toHSL({ h, s: s * 0.4, l: 95 })};
  --card-foreground: hsl(0 0% 5%);
  --popover: ${toHSL({ h, s: s * 0.4, l: 95 })};
  --popover-foreground: hsl(0 0% 5%);
  --primary: ${toHSL({ h, s, l })};
  --primary-foreground: hsl(0 0% 98%);
  --secondary: ${toHSL({ h, s: s * 0.5, l: 90 })};
  --secondary-foreground: hsl(0 0% 10%);
  --muted: ${toHSL({ h, s: s * 0.4, l: 88 })};
  --muted-foreground: hsl(0 0% 45%);
  --accent: ${toHSL({ h, s: s * 0.6, l: 85 })};
  --accent-foreground: hsl(0 0% 10%);
  --destructive: hsl(0 100% 40%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: ${toHSL({ h, s: s * 0.5, l: 80 })};
  --input: ${toHSL({ h, s: s * 0.5, l: 80 })};
  --ring: ${toHSL({ h, s, l })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  const darkFill = `
.dark {
  --background: ${toHSL({ h, s: s * 0.4, l: 8 })};
  --foreground: hsl(0 0% 98%);
  --card: ${toHSL({ h, s: s * 0.5, l: 12 })};
  --card-foreground: hsl(0 0% 98%);
  --popover: ${toHSL({ h, s: s * 0.5, l: 15 })};
  --popover-foreground: hsl(0 0% 98%);
  --primary: ${toHSL({ h, s, l: Math.min(l + 20, 95) })};
  --primary-foreground: hsl(0 0% 10%);
  --secondary: ${toHSL({ h, s: s * 0.6, l: 18 })};
  --secondary-foreground: hsl(0 0% 98%);
  --muted: ${toHSL({ h, s: s * 0.5, l: 20 })};
  --muted-foreground: hsl(0 0% 63%);
  --accent: ${toHSL({ h, s: s * 0.7, l: 25 })};
  --accent-foreground: hsl(0 0% 98%);
  --destructive: hsl(0 100% 65%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: ${toHSL({ h, s: s * 0.6, l: 22 })};
  --input: ${toHSL({ h, s: s * 0.6, l: 25 })};
  --ring: ${toHSL({ h, s, l: Math.min(l + 20, 95) })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  // === Variant 4: Saturated background ===
  const lightSaturated = `
:root {
  --background: ${toHSL({ h, s: s * 0.8, l: 85 })};
  --foreground: hsl(0 0% 5%);
  --card: ${toHSL({ h, s: s * 0.9, l: 80 })};
  --card-foreground: hsl(0 0% 5%);
  --popover: ${toHSL({ h, s: s * 0.9, l: 80 })};
  --popover-foreground: hsl(0 0% 5%);
  --primary: ${toHSL({ h, s, l })};
  --primary-foreground: hsl(0 0% 98%);
  --secondary: ${toHSL({ h, s, l: 70 })};
  --secondary-foreground: hsl(0 0% 10%);
  --muted: ${toHSL({ h, s: s * 0.9, l: 75 })};
  --muted-foreground: hsl(0 0% 45%);
  --accent: ${toHSL({ h, s, l: 65 })};
  --accent-foreground: hsl(0 0% 10%);
  --destructive: hsl(0 100% 40%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: ${toHSL({ h, s, l: 60 })};
  --input: ${toHSL({ h, s, l: 60 })};
  --ring: ${toHSL({ h, s, l })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  const darkSaturated = `
.dark {
  --background: ${toHSL({ h, s, l: 12 })};
  --foreground: hsl(0 0% 98%);
  --card: ${toHSL({ h, s, l: 18 })};
  --card-foreground: hsl(0 0% 98%);
  --popover: ${toHSL({ h, s, l: 20 })};
  --popover-foreground: hsl(0 0% 98%);
  --primary: ${toHSL({ h, s, l: Math.min(l + 20, 95) })};
  --primary-foreground: hsl(0 0% 10%);
  --secondary: ${toHSL({ h, s, l: 25 })};
  --secondary-foreground: hsl(0 0% 98%);
  --muted: ${toHSL({ h, s, l: 28 })};
  --muted-foreground: hsl(0 0% 63%);
  --accent: ${toHSL({ h, s, l: 35 })};
  --accent-foreground: hsl(0 0% 98%);
  --destructive: hsl(0 100% 65%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: ${toHSL({ h, s, l: 30 })};
  --input: ${toHSL({ h, s, l: 32 })};
  --ring: ${toHSL({ h, s, l: Math.min(l + 20, 95) })};
  --chart-1: ${toHSL(chartColors[0])};
  --chart-2: ${toHSL(chartColors[1])};
  --chart-3: ${toHSL(chartColors[2])};
  --chart-4: ${toHSL(chartColors[3])};
  --chart-5: ${toHSL(chartColors[4])};
}`;

  // Return based on variant
  if (variant === "neutral") {
    return `${lightNeutral}\n${darkNeutral}`;
  } else if (variant === "tinted") {
    return `${lightTinted}\n${darkTinted}`;
  } else if (variant === "fill") {
    return `${lightFill}\n${darkFill}`;
  } else {
    return `${lightSaturated}\n${darkSaturated}`;
  }
}
