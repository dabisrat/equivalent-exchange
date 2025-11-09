// app/api/generate-pwa-assets/route.ts
import { getUser } from "@eq-ex/auth";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Complete PWA asset specifications
const PWA_ASSETS = {
  // Standard PWA icons (manifest.json)
  icons: [
    { size: 64, name: "pwa-64x64.png", purpose: "any" },
    { size: 192, name: "pwa-192x192.png", purpose: "any" },
    { size: 512, name: "pwa-512x512.png", purpose: "any" },
  ],

  // Maskable icons (for Android adaptive icons)
  maskableIcons: [
    { size: 512, name: "maskable-icon-512x512.png", purpose: "maskable" },
  ],

  // Apple touch icons (iOS)
  appleTouchIcons: [{ size: 180, name: "apple-touch-icon-180x180.png" }],

  // Favicons
  favicons: [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 48, name: "favicon-48x48.png" },
  ],

  // Additional common sizes
  additionalIcons: [
    { size: 72, name: "icon-72x72.png" },
    { size: 96, name: "icon-96x96.png" },
    { size: 128, name: "icon-128x128.png" },
    { size: 144, name: "icon-144x144.png" },
    { size: 152, name: "icon-152x152.png" },
    { size: 384, name: "icon-384x384.png" },
  ],
};

// iOS splash screen sizes (portrait)
const IOS_SPLASH_SCREENS = [
  {
    width: 640,
    height: 1136,
    name: "apple-splash-640-1136.png",
    device: "iPhone SE, 5s",
  },
  {
    width: 750,
    height: 1334,
    name: "apple-splash-750-1334.png",
    device: "iPhone 8, 7, 6s",
  },
  {
    width: 828,
    height: 1792,
    name: "apple-splash-828-1792.png",
    device: "iPhone 11, XR",
  },
  {
    width: 1125,
    height: 2436,
    name: "apple-splash-1125-2436.png",
    device: "iPhone X, XS, 11 Pro",
  },
  {
    width: 1170,
    height: 2532,
    name: "apple-splash-1170-2532.png",
    device: "iPhone 12 Pro, 13",
  },
  {
    width: 1179,
    height: 2556,
    name: "apple-splash-1179-2556.png",
    device: "iPhone 14 Pro",
  },
  {
    width: 1242,
    height: 2688,
    name: "apple-splash-1242-2688.png",
    device: "iPhone XS Max, 11 Pro Max",
  },
  {
    width: 1284,
    height: 2778,
    name: "apple-splash-1284-2778.png",
    device: "iPhone 12 Pro Max, 13 Pro Max",
  },
  {
    width: 1290,
    height: 2796,
    name: "apple-splash-1290-2796.png",
    device: "iPhone 14 Pro Max",
  },
  {
    width: 1536,
    height: 2048,
    name: "apple-splash-1536-2048.png",
    device: "iPad Mini, Air",
  },
  {
    width: 1668,
    height: 2224,
    name: "apple-splash-1668-2224.png",
    device: 'iPad Pro 10.5"',
  },
  {
    width: 1668,
    height: 2388,
    name: "apple-splash-1668-2388.png",
    device: 'iPad Pro 11"',
  },
  {
    width: 2048,
    height: 2732,
    name: "apple-splash-2048-2732.png",
    device: 'iPad Pro 12.9"',
  },
];

async function generateIcon(
  buffer: Buffer,
  size: number,
  maskable: boolean = false
) {
  const padding = maskable ? Math.floor(size * 0.1) : 0; // 10% padding for maskable icons
  const iconSize = maskable ? size - padding * 2 : size;

  // Use 80% of icon size for the logo (10% padding on each side = 80% logo)
  const logoSize = Math.floor(iconSize * 0.8);
  const logoMargin = Math.floor((iconSize - logoSize) / 2);

  // Resize logo to 70% of icon size
  const resizedLogo = await sharp(buffer)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create canvas with white background and center the logo
  return await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        top: logoMargin,
        left: logoMargin,
      },
    ])
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function generateSplashScreen(
  buffer: Buffer,
  width: number,
  height: number,
  backgroundColor: string
) {
  // Parse background color
  const bgColor = backgroundColor.startsWith("#")
    ? backgroundColor.slice(1)
    : backgroundColor;

  const r = parseInt(bgColor.slice(0, 2), 16);
  const g = parseInt(bgColor.slice(2, 4), 16);
  const b = parseInt(bgColor.slice(4, 6), 16);

  // Get logo size (40% of smallest dimension for better visibility)
  const logoSize = Math.floor(Math.min(width, height) * 0.4);

  // Resize logo
  const logo = await sharp(buffer)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create splash screen with logo centered
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .composite([
      {
        input: logo,
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const generateSplash = formData.get("generateSplash") === "true";
    const backgroundColor =
      (formData.get("backgroundColor") as string) || "#ffffff";
    const themeColor = (formData.get("themeColor") as string) || "#000000";

    const generatedAssets: any = {
      icons: [],
      splashScreens: [],
    };

    // Generate all icon types
    const allIcons = [
      ...PWA_ASSETS.icons,
      ...PWA_ASSETS.additionalIcons,
      ...PWA_ASSETS.appleTouchIcons,
      ...PWA_ASSETS.favicons,
    ];

    for (const icon of allIcons) {
      const iconBuffer = await generateIcon(buffer, icon.size, false);
      generatedAssets.icons.push({
        name: icon.name,
        size: icon.size,
        data: iconBuffer.toString("base64"),
        mimeType: "image/png",
        purpose: "any",
      });
    }

    // Generate maskable icons
    for (const icon of PWA_ASSETS.maskableIcons) {
      const iconBuffer = await generateIcon(buffer, icon.size, true);
      generatedAssets.icons.push({
        name: icon.name,
        size: icon.size,
        data: iconBuffer.toString("base64"),
        mimeType: "image/png",
        purpose: "maskable",
      });
    }

    // Generate iOS splash screens if requested
    if (generateSplash) {
      for (const splash of IOS_SPLASH_SCREENS) {
        const splashBuffer = await generateSplashScreen(
          buffer,
          splash.width,
          splash.height,
          backgroundColor
        );

        generatedAssets.splashScreens.push({
          name: splash.name,
          width: splash.width,
          height: splash.height,
          device: splash.device,
          data: splashBuffer.toString("base64"),
          mimeType: "image/png",
        });
      }
    }

    // Generate complete manifest.json
    const manifest = {
      name: formData.get("appName") || "My PWA App",
      short_name: formData.get("shortName") || "PWA",
      description: formData.get("description") || "A Progressive Web App",
      start_url: "/",
      display: "standalone",
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: "portrait-primary",
      icons: [
        ...allIcons.map(({ name, size }) => ({
          src: `/icons/${name}`,
          sizes: `${size}x${size}`,
          type: "image/png",
          purpose: "any",
        })),
        ...PWA_ASSETS.maskableIcons.map(({ name, size, purpose }) => ({
          src: `/icons/${name}`,
          sizes: `${size}x${size}`,
          type: "image/png",
          purpose,
        })),
      ],
    };

    // Generate HTML meta tags
    const htmlTags = {
      // Standard meta tags
      viewport:
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
      themeColor: `<meta name="theme-color" content="${themeColor}">`,
      manifest: '<link rel="manifest" href="/manifest.json">',

      // Favicon tags
      faviconIco:
        '<link rel="icon" href="/icons/favicon-48x48.png" sizes="48x48">',
      favicon16:
        '<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">',
      favicon32:
        '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">',

      // Apple tags
      appleTouchIcon:
        '<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">',
      appleMobileWebAppCapable:
        '<meta name="apple-mobile-web-app-capable" content="yes">',
      appleMobileWebAppStatusBarStyle: `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
      appleMobileWebAppTitle: `<meta name="apple-mobile-web-app-title" content="${formData.get("shortName") || "PWA"}">`,

      // iOS splash screens
      iosSplashScreens: generateSplash
        ? IOS_SPLASH_SCREENS.map(
            (splash) =>
              `<link rel="apple-touch-startup-image" href="/splash/${splash.name}" media="(device-width: ${splash.width / 2}px) and (device-height: ${splash.height / 2}px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">`
          ).join("\n    ")
        : "",
    };

    return NextResponse.json({
      success: true,
      assets: generatedAssets,
      manifest,
      htmlTags,
      summary: {
        totalIcons: generatedAssets.icons.length,
        totalSplashScreens: generatedAssets.splashScreens.length,
        maskableIcons: PWA_ASSETS.maskableIcons.length,
        appleTouchIcons: PWA_ASSETS.appleTouchIcons.length,
        favicons: PWA_ASSETS.favicons.length,
      },
    });
  } catch (error: any) {
    console.error("Error generating PWA assets:", error);
    return NextResponse.json(
      { error: "Failed to generate PWA assets", details: error.message },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
