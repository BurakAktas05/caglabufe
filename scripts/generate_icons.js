const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6d44e4"/>
      <stop offset="50%" stop-color="#5D3EBC"/>
      <stop offset="100%" stop-color="#3c1e87"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE169"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </linearGradient>
    <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f3f9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1e0e4b" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Subtle glow ring -->
  <circle cx="256" cy="230" r="180" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <circle cx="256" cy="230" r="150" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>

  <!-- Group for Bag & Food with Shadow -->
  <g filter="url(#shadow)">
    <!-- Shopping Bag Body -->
    <path d="M166 210 L346 210 L330 350 C328 368 314 380 296 380 L216 380 C198 380 184 368 182 350 Z" fill="url(#bagGrad)"/>
    
    <!-- Bag Handle -->
    <path d="M210 210 V160 C210 135 230 115 256 115 C282 115 302 135 302 160 V210" stroke="url(#goldGrad)" stroke-width="18" stroke-linecap="round" fill="none"/>
    
    <!-- Bag Fold / Rim Detail -->
    <path d="M154 204 C154 196 160 190 168 190 L344 190 C352 190 358 196 358 204 L354 220 L158 220 Z" fill="#e2e8f0"/>
    
    <!-- Fast Delivery Flash / Bolt -->
    <path d="M264 240 L236 290 L260 290 L248 340 L286 280 L262 280 Z" fill="url(#goldGrad)"/>
    
    <!-- Steam / Warmth waves above bag -->
    <path d="M228 100 C224 85 232 75 228 62" stroke="#FFD10D" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 1" opacity="0.85"/>
    <path d="M256 94 C252 79 260 69 256 56" stroke="#FFD10D" stroke-width="5" stroke-linecap="round" opacity="0.95"/>
    <path d="M284 100 C280 85 288 75 284 62" stroke="#FFD10D" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 1" opacity="0.85"/>
  </g>

  <!-- Brand Typography -->
  <!-- ÇAĞLA Pill -->
  <g filter="url(#shadow)">
    <rect x="116" y="398" width="280" height="62" rx="31" fill="#1e133e" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">ÇAĞLA BÜFE</text>
  </g>

  <!-- Karabük KYK Badge -->
  <rect x="186" y="470" width="140" height="24" rx="12" fill="url(#goldGrad)"/>
  <text x="256" y="486" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#3c1e87" text-anchor="middle" letter-spacing="1">KARABÜK &amp; KYK</text>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public');
  const svgBuffer = Buffer.from(svgIcon);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  console.log('Saved icon.svg');

  // 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 180x180 (apple-touch-icon)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 32x32 favicon
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(console.error);
