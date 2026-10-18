const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const sourceImage = 'C:/Users/AKTASSAK/.gemini/antigravity-ide/brain/2d33a452-8942-4226-adfe-ebac7df13680/cagla_bufe_app_icon_1792257630802.jpg';
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(sourceImage)) {
    console.error('Source image not found:', sourceImage);
    process.exit(1);
  }

  // 1. Crop the squircle app icon perfectly from the 1024x1024 render
  // The inner squircle is centered at x=165, y=165, 694x694
  const cropped512 = await sharp(sourceImage)
    .extract({ left: 165, top: 165, width: 694, height: 694 })
    .resize(512, 512, { fit: 'cover' })
    .toBuffer();

  // 2. Create smooth anti-aliased squircle corner mask (rx=110)
  const maskSvg = Buffer.from(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="512" height="512" rx="110" ry="110" fill="#ffffff" />
    </svg>`
  );

  // Smooth transparent rounded icon
  const icon512Buffer = await sharp(cropped512)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  // Full-bleed version for Android maskable icons (seamless dark purple behind rounded corners)
  const bgFill = Buffer.from(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#5831b8" />
          <stop offset="70%" stop-color="#3b1d82" />
          <stop offset="100%" stop-color="#28115e" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#rg)" />
    </svg>`
  );

  const fullBleed512 = await sharp(bgFill)
    .composite([{ input: icon512Buffer, top: 0, left: 0 }])
    .png({ quality: 100 })
    .toBuffer();

  // Save 512x512
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), fullBleed512);
  console.log('Saved public/icon-512.png');

  // Save 192x192
  const icon192Buffer = await sharp(fullBleed512)
    .resize(192, 192)
    .png({ quality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192Buffer);
  console.log('Saved public/icon-192.png');

  // Save apple-touch-icon.png (180x180) - iOS applies its own rounded corners
  const appleTouchBuffer = await sharp(fullBleed512)
    .resize(180, 180)
    .png({ quality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer);
  console.log('Saved public/apple-touch-icon.png');

  // Save favicon.png (64x64 high dpi)
  const faviconBuffer = await sharp(fullBleed512)
    .resize(64, 64)
    .png({ quality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconBuffer);
  console.log('Saved public/favicon.png');

  // Save favicon.ico (32x32)
  const icoBuffer = await sharp(fullBleed512)
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Saved public/favicon.ico');

  console.log('All PWA icons built successfully!');
}

main().catch(console.error);
