# EQ/EX PWA Setup

## PWA Features

Your EQ/EX app is now configured as a Progressive Web App (PWA) with the following features:

### ✅ Core PWA Features

- **Service Worker**: Automatically caches resources for offline functionality
- **Web App Manifest**: Enables app installation on devices
- **App Icons**: Full set of icons for different devices and platforms
- **Install Prompts**: Native install prompts and custom iOS instructions

### 📱 Installation Experience

#### Desktop & Android

- Users will see an "Install App" button in the header
- Browsers will show native install prompts
- App can be installed from the browser's address bar

#### iOS Safari

- Automatic install prompt with step-by-step instructions
- Users can dismiss the prompt (won't show again)
- Manual installation via Share → "Add to Home Screen"

### 🔧 Technical Implementation

#### Files Added/Modified:

- `next.config.ts` - PWA configuration with caching strategies
- `public/manifest.json` - App manifest with metadata
- `public/icons/` - App icons in various sizes
- `src/components/pwa-install-button.tsx` - Install button component
- `src/components/ios-install-prompt.tsx` - iOS-specific install prompt
- `src/app/layout.tsx` - PWA meta tags and components

#### Caching Strategy:

- **Static Assets**: Images, fonts, CSS, JS files cached with StaleWhileRevalidate
- **Google Fonts**: Cached for 365 days
- **Next.js Data**: API routes excluded, pages cached for 24 hours
- **Network First**: Dynamic content with 10s timeout

### 🚀 Production Setup

#### Icon Requirements:

The current icons are placeholders. For production, you should:

1. **Replace icons** in `public/icons/` with your branded icons
2. **Generate proper sizes** using the provided script:

   ```bash
   # Install ImageMagick first
   brew install imagemagick

   # Run the icon generation script
   ./scripts/generate-pwa-icons.sh
   ```

3. **Create screenshots** for app store listings:
   - `screenshot-wide.png` (1280x720) for desktop
   - `screenshot-narrow.png` (720x1280) for mobile

#### Manifest Customization:

Update `public/manifest.json` with:

- Your app's actual name and description
- Your brand colors for `theme_color` and `background_color`
- Your domain in the screenshots URLs

#### Testing:

1. **Build the app**: `pnpm build`
2. **Start production server**: `pnpm start`
3. **Test on mobile devices** - check install prompts work
4. **Test offline functionality** - disconnect network and verify app loads
5. **Lighthouse PWA audit** - should score 100/100

### 📊 PWA Capabilities

#### What Works Offline:

- Previously visited pages
- Static assets (images, fonts, styles)
- Cached API responses

#### What Requires Internet:

- New API calls
- Real-time features (Supabase subscriptions)
- Authentication flows

### 🛠 Development Notes

- PWA features are **disabled in development** for better debugging
- Service worker is only active in production builds
- Clear browser cache when testing PWA updates
- Use incognito/private browsing for fresh PWA testing

### 🔍 Debugging

Check PWA status:

1. Open Chrome DevTools
2. Go to Application tab
3. Check Service Workers and Manifest sections
4. Run Lighthouse audit for PWA score

The app is now ready for users to install as a native-like app on their devices!
