/**
 * Simple script to generate PWA icons from SVG
 * Requires: sharp package (npm install sharp --save-dev)
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512, 180];

// Simple SVG template for a clock icon
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#000000"/>
  <circle cx="256" cy="256" r="200" stroke="#ffffff" stroke-width="20" fill="none"/>
  <line x1="256" y1="256" x2="256" y2="140" stroke="#ffffff" stroke-width="20" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="340" y2="256" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="20" fill="#ffffff"/>
</svg>
`;

console.log('Icon generation script');
console.log('Note: This script creates SVG files. For PNG generation, use:');
console.log('1. Online tool: https://realfavicongenerator.net/');
console.log('2. ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png');
console.log('3. Sharp package: npm install sharp --save-dev');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size
sizes.forEach(size => {
  const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For now, create SVG placeholder - user should convert to PNG
  const svgFilepath = path.join(iconsDir, filename.replace('.png', '.svg'));
  fs.writeFileSync(svgFilepath, svgTemplate(size));
  console.log(`Created: ${svgFilepath}`);
});

console.log('\nTo convert SVG to PNG, install sharp and update this script,');
console.log('or use an online converter tool.');
