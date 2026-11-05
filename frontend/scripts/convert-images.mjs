/**
 * Script de conversion d'images existantes vers WebP + AVIF.
 *
 * Utilisation :
 *   cd frontend
 *   node scripts/convert-images.mjs
 *
 * Prérequis :
 *   npm install -D sharp
 */

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const ASSETS_DIR = './src/assets'
const PUBLIC_IMAGES_DIR = './public/images'
const OUTPUT_QUALITY = { webp: 82, avif: 40 }

async function convertFile(input, outputWebp, outputAvif) {
  await sharp(input).webp({ quality: OUTPUT_QUALITY.webp }).toFile(outputWebp)
  await sharp(input).avif({ quality: OUTPUT_QUALITY.avif }).toFile(outputAvif)
  console.log(`✅ ${path.basename(input)} → .webp + .avif`)
}

async function main() {
  const convertDir = async (dir) => {
    const files = await fs.readdir(dir)
    for (const file of files) {
      if (file.endsWith('.svg')) continue
      const ext = path.extname(file).toLowerCase()
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const input = path.join(dir, file)
        const base = path.basename(file, ext)
        await convertFile(
          input,
          path.join(dir, `${base}.webp`),
          path.join(dir, `${base}.avif`),
        )
      }
    }
  }

  console.log('🔄 Conversion des images dans src/assets…')
  await convertDir(ASSETS_DIR)

  console.log('🔄 Conversion des images dans public/images…')
  await convertDir(PUBLIC_IMAGES_DIR)

  console.log('\n🎉 Conversion terminée !')
}

main().catch((err) => {
  console.error('❌ Erreur lors de la conversion :', err)
  process.exit(1)
})
