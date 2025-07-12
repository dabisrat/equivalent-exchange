function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslToHslString(h: number, s: number, l: number): string {
  return `${Math.round(h * 100) / 100} ${Math.round(s * 100) / 100}% ${Math.round(l * 100) / 100}%`;
}

export function generateThemeColors(primaryColor: string, secondaryColor: string) {
  const [primaryH, primaryS, primaryL] = hexToHsl(primaryColor);
  const [secondaryH, secondaryS, secondaryL] = hexToHsl(secondaryColor);

  // Generate chart colors based on primary
  const generateChartVariations = (h: number, s: number, l: number) => ({
    chart1: hslToHslString(h, s, l), // Original primary
    chart2: hslToHslString(h, Math.max(s + 5, 30), Math.min(l + 15, 80)),
    chart3: hslToHslString(h, Math.max(s + 10, 35), Math.min(l + 25, 85)),
    chart4: hslToHslString(h, Math.max(s + 8, 32), Math.max(l - 20, 20)),
    chart5: hslToHslString(h, Math.max(s - 5, 25), Math.max(l - 30, 15)),
  });

  return {
    light: {
      // Core colors
      background: hslToHslString(0, 0, 100),
      foreground: hslToHslString(210, 10, 3.9),
      
      // Cards and surfaces
      card: hslToHslString(0, 0, 100),
      'card-foreground': hslToHslString(210, 10, 3.9),
      popover: hslToHslString(0, 0, 100),
      'popover-foreground': hslToHslString(210, 10, 3.9),
      
      // Primary colors (user's primary color)
      primary: hslToHslString(primaryH, primaryS, primaryL),
      'primary-foreground': hslToHslString(primaryH, Math.max(primaryS + 2, 50), Math.min(primaryL + 45, 95)),
      
      // Secondary colors (based on user's secondary or muted version)
      secondary: hslToHslString(secondaryH, Math.max(secondaryS - 20, 4), Math.min(secondaryL + 70, 91)),
      'secondary-foreground': hslToHslString(secondaryH, Math.max(secondaryS - 15, 6), Math.max(secondaryL - 80, 10)),
      
      // Muted areas
      muted: hslToHslString(secondaryH, Math.max(secondaryS - 20, 4), Math.min(secondaryL + 70, 91)),
      'muted-foreground': hslToHslString(secondaryH, Math.max(secondaryS - 10, 5), Math.min(secondaryL + 10, 51)),
      
      // Accent (lighter version of primary)
      accent: hslToHslString(primaryH, Math.max(primaryS - 20, 30), Math.min(primaryL + 30, 81)),
      'accent-foreground': hslToHslString(primaryH, Math.max(primaryS - 15, 29), Math.max(primaryL - 40, 10)),
      
      // System colors
      destructive: hslToHslString(0, 99, 45),
      'destructive-foreground': hslToHslString(0, 100, 99),
      
      // Borders and inputs
      border: hslToHslString(0, 6, 90),
      input: hslToHslString(0, 6, 90),
      ring: hslToHslString(primaryH, primaryS, primaryL),
      
      // Charts (variations of primary)
      ...generateChartVariations(primaryH, primaryS, primaryL),
      
      // Sidebar (using secondary as base)
      sidebar: hslToHslString(secondaryH, Math.max(secondaryS - 20, 4), Math.min(secondaryL + 70, 91)),
      'sidebar-foreground': hslToHslString(secondaryH, Math.max(secondaryS - 15, 6), Math.max(secondaryL - 80, 10)),
      'sidebar-primary': hslToHslString(primaryH, primaryS, primaryL),
      'sidebar-primary-foreground': hslToHslString(primaryH, Math.max(primaryS + 2, 50), Math.min(primaryL + 45, 95)),
      'sidebar-accent': hslToHslString(primaryH, Math.max(primaryS - 20, 30), Math.min(primaryL + 30, 81)),
      'sidebar-accent-foreground': hslToHslString(primaryH, Math.max(primaryS - 15, 29), Math.max(primaryL - 40, 10)),
      'sidebar-border': hslToHslString(0, 6, 90),
      'sidebar-ring': hslToHslString(primaryH, primaryS, primaryL),
    },
    dark: {
      // Core dark backgrounds
      background: hslToHslString(primaryH, Math.max(primaryS * 0.8, 25), Math.max(primaryL - 70, 8)),
      foreground: hslToHslString(primaryH, Math.max(primaryS * 0.2, 8), Math.min(primaryL + 55, 95)),
      
      // Cards and surfaces (slightly lighter than background)
      card: hslToHslString(primaryH, Math.max(primaryS * 0.75, 30), Math.max(primaryL - 65, 12)),
      'card-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.2, 8), Math.min(primaryL + 55, 95)),
      popover: hslToHslString(primaryH, Math.max(primaryS * 0.75, 30), Math.max(primaryL - 65, 12)),
      'popover-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.2, 8), Math.min(primaryL + 55, 95)),
      
      // Primary colors (lightened for dark mode)
      primary: hslToHslString(primaryH, Math.max(primaryS * 0.85, 30), Math.min(primaryL + 10, 50)),
      'primary-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.6, 30), Math.min(primaryL + 55, 95)),
      
      // Secondary colors
      secondary: hslToHslString(secondaryH, Math.max(secondaryS * 0.3, 7), Math.min(secondaryL - 60, 20)),
      'secondary-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.1, 4), Math.min(primaryL + 56, 96)),
      
      // Muted areas
      muted: hslToHslString(secondaryH, Math.max(secondaryS * 0.3, 7), Math.min(secondaryL - 60, 20)),
      'muted-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.4, 15), Math.min(primaryL + 25, 65)),
      
      // Accent
      accent: hslToHslString(primaryH + 15, Math.max(primaryS + 48, 75), Math.max(primaryL - 75, 12)),
      'accent-foreground': hslToHslString(primaryH + 30, Math.max(primaryS * 0.3, 12), Math.min(primaryL + 56, 96)),
      
      // System colors
      destructive: hslToHslString(0, 70, 45),
      'destructive-foreground': hslToHslString(12, 12, 92),
      
      // Borders and inputs
      border: hslToHslString(primaryH, Math.max(primaryS * 0.7, 30), Math.max(primaryL - 65, 17)),
      input: hslToHslString(primaryH, Math.max(primaryS * 0.7, 30), Math.max(primaryL - 65, 17)),
      ring: hslToHslString(primaryH, Math.max(primaryS * 0.85, 30), Math.min(primaryL + 10, 50)),
      
      // Charts (dark mode variations)
      'chart-1': hslToHslString(primaryH, Math.max(primaryS * 0.85, 30), Math.min(primaryL + 10, 50)),
      'chart-2': hslToHslString(primaryH, Math.max(primaryS + 5, 35), Math.min(primaryL + 15, 55)),
      'chart-3': hslToHslString(primaryH, Math.max(primaryS + 10, 40), Math.min(primaryL + 25, 65)),
      'chart-4': hslToHslString(primaryH, Math.max(primaryS + 8, 38), Math.max(primaryL - 20, 30)),
      'chart-5': hslToHslString(primaryH, Math.max(primaryS - 5, 25), Math.max(primaryL - 30, 20)),
      
      // Sidebar
      sidebar: hslToHslString(primaryH, Math.max(primaryS * 0.8, 30), Math.min(primaryL - 55, 20)),
      'sidebar-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.2, 8), Math.min(primaryL + 55, 95)),
      'sidebar-primary': hslToHslString(primaryH, Math.max(primaryS * 0.85, 30), Math.min(primaryL + 10, 50)),
      'sidebar-primary-foreground': hslToHslString(primaryH, Math.max(primaryS * 0.6, 30), Math.min(primaryL + 55, 95)),
      'sidebar-accent': hslToHslString(primaryH + 15, Math.max(primaryS + 48, 75), Math.max(primaryL - 75, 12)),
      'sidebar-accent-foreground': hslToHslString(primaryH + 30, Math.max(primaryS * 0.3, 12), Math.min(primaryL + 56, 96)),
      'sidebar-border': hslToHslString(primaryH, Math.max(primaryS * 0.7, 30), Math.max(primaryL - 65, 17)),
      'sidebar-ring': hslToHslString(primaryH, Math.max(primaryS * 0.85, 30), Math.min(primaryL + 10, 50)),
    },
  };
}

export function generateThemeCSS(primaryColor: string, secondaryColor: string): string {
  const colors = generateThemeColors(primaryColor, secondaryColor);
  
  return `
    :root {
      ${Object.entries(colors.light).map(([key, value]) => `--${key}: hsl(${value});`).join('\n      ')}
    }
    
    .dark {
      ${Object.entries(colors.dark).map(([key, value]) => `--${key}: hsl(${value});`).join('\n      ')}
    }
  `;
}