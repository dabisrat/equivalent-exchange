#!/usr/bin/env node

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon configuration
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create a simple icon design
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background with rounded corners
  const radius = size * 0.1875; // 18.75% radius for iOS-style rounded corners
  
  // Fill background
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Main text "EQ/EX"
  const fontSize = size * 0.15; // Responsive font size
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw main text
  ctx.fillText('EQ/EX', size / 2, size * 0.45);
  
  // Draw three dots below
  const dotRadius = size * 0.02;
  const dotY = size * 0.68;
  const spacing = size * 0.08;
  
  ctx.fillStyle = '#ffffff';
  // Left dot
  ctx.beginPath();
  ctx.arc(size / 2 - spacing, dotY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(size / 2, dotY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Right dot
  ctx.beginPath();
  ctx.arc(size / 2 + spacing, dotY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

// Generate all icon sizes
console.log('Generating PWA icons...');

iconSizes.forEach(size => {
  const canvas = createIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Generated: ${filename} (${buffer.length} bytes)`);
});

// Generate apple-touch-icon (180x180 is standard)
const appleIcon = createIcon(180);
const appleBuffer = appleIcon.toBuffer('image/png');
const appleFilepath = path.join(iconsDir, 'apple-touch-icon.png');
fs.writeFileSync(appleFilepath, appleBuffer);
console.log(`✅ Generated: apple-touch-icon.png (${appleBuffer.length} bytes)`);

console.log('\n🎉 All PWA icons generated successfully!');
console.log('\nIcons created:');
iconSizes.forEach(size => {
  console.log(`  📱 ${size}x${size}px`);
});
console.log(`  🍎 180x180px (Apple Touch Icon)`);

console.log('\n💡 For production, consider:');
console.log('  • Creating custom branded icons');
console.log('  • Using a design tool like Figma/Sketch');
console.log('  • Ensuring icons follow PWA maskable guidelines');
console.log('  • Adding proper screenshots for app stores');