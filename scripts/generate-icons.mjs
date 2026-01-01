import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const appDir = join(rootDir, 'app');

const logoPath = join(publicDir, 'weekend.jpg');

async function generateIcons() {
  console.log('🎨 Generating icons from weekend.jpg...\n');

  try {
    // favicon.ico (32x32) - ไปที่ app folder สำหรับ Next.js
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(join(appDir, 'favicon.ico'));
    console.log('✅ favicon.ico (32x32)');

    // icon.png (32x32) - สำหรับ Next.js App Router
    await sharp(logoPath)
      .resize(32, 32)
      .png()
      .toFile(join(appDir, 'icon.png'));
    console.log('✅ icon.png (32x32)');

    // apple-icon.png (180x180) - สำหรับ iOS
    await sharp(logoPath)
      .resize(180, 180)
      .png()
      .toFile(join(appDir, 'apple-icon.png'));
    console.log('✅ apple-icon.png (180x180)');

    // icon-192.png - สำหรับ Android/PWA
    await sharp(logoPath)
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'icon-192.png'));
    console.log('✅ icon-192.png (192x192)');

    // icon-512.png - สำหรับ PWA splash
    await sharp(logoPath)
      .resize(512, 512)
      .png()
      .toFile(join(publicDir, 'icon-512.png'));
    console.log('✅ icon-512.png (512x512)');

    console.log('\n🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
