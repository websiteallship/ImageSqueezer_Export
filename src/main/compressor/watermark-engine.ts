import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { WatermarkOptions, WatermarkPosition } from '@shared/types'

export interface WatermarkFileResult {
  newPath: string
  newName: string
  newSize: number
}

// ── Gravity mapping ───────────────────────────────────────────────────────────
function toGravity(pos: WatermarkPosition): string {
  const map: Record<WatermarkPosition, string> = {
    'top-left': 'northwest',
    'top-center': 'north',
    'top-right': 'northeast',
    'center': 'center',
    'bottom-left': 'southwest',
    'bottom-center': 'south',
    'bottom-right': 'southeast',
  }
  return map[pos] ?? 'southeast'
}

// ── Offset calculation based on position ─────────────────────────────────────
function positionToOffset(
  pos: WatermarkPosition,
  margin: number,
  imgW: number,
  imgH: number,
  wmW: number,
  wmH: number
): { left: number; top: number } {
  let left = 0
  let top = 0

  if (pos.includes('left')) left = margin
  else if (pos.includes('right')) left = imgW - wmW - margin
  else left = Math.floor((imgW - wmW) / 2)

  if (pos.startsWith('top')) top = margin
  else if (pos.startsWith('bottom')) top = imgH - wmH - margin
  else top = Math.floor((imgH - wmH) / 2)

  return { left: Math.max(0, left), top: Math.max(0, top) }
}

// ── Build SVG text watermark buffer ──────────────────────────────────────────
async function buildTextOverlay(
  opts: WatermarkOptions,
  imgW: number,
  imgH: number
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const text = opts.text ?? 'Watermark'
  const fontSize = opts.fontSize ?? 36
  const color = opts.fontColor ?? '#ffffff'
  const opacity = opts.fontOpacity ?? 0.6
  const margin = opts.margin ?? 20

  // Estimate text dimensions (rough heuristic)
  const charW = fontSize * 0.55
  const textWidth = Math.min(text.length * charW, imgW - margin * 2)
  const textHeight = fontSize * 1.4

  const svg = `<svg width="${textWidth + 20}" height="${textHeight + 10}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${(textWidth + 20) / 2}"
    y="${fontSize}"
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="${color}"
    fill-opacity="${opacity}"
    text-anchor="middle"
    dominant-baseline="auto"
  >${text}</text>
</svg>`

  const buffer = Buffer.from(svg)
  return {
    buffer,
    width: Math.ceil(textWidth + 20),
    height: Math.ceil(textHeight + 10),
  }
}

// ── Build tiled composite inputs ──────────────────────────────────────────────
async function buildTileInputs(
  overlayBuffer: Buffer,
  wmW: number,
  wmH: number,
  imgW: number,
  imgH: number,
  margin: number
): Promise<sharp.OverlayOptions[]> {
  const inputs: sharp.OverlayOptions[] = []
  const gapX = wmW + margin
  const gapY = wmH + margin

  for (let y = margin; y < imgH - wmH; y += gapY) {
    for (let x = margin; x < imgW - wmW; x += gapX) {
      inputs.push({ input: overlayBuffer, left: x, top: y, blend: 'over' })
    }
  }
  return inputs
}

export async function getWatermarkComposites(
  opts: WatermarkOptions,
  imgW: number,
  imgH: number
): Promise<sharp.OverlayOptions[]> {
  const margin = opts.margin ?? 20
  let composites: sharp.OverlayOptions[] = []

  if (opts.mode === 'text') {
    const { buffer: textBuf, width: wmW, height: wmH } = await buildTextOverlay(opts, imgW, imgH)

    if (opts.tile) {
      composites = await buildTileInputs(textBuf, wmW, wmH, imgW, imgH, margin)
    } else {
      const { left, top } = positionToOffset(opts.position, margin, imgW, imgH, wmW, wmH)
      composites = [{ input: textBuf, left, top, blend: 'over' }]
    }
  } else {
    // Logo mode
    if (!opts.logoPath) throw new Error('logoPath is required for logo watermark')
    await fs.access(opts.logoPath)

    const targetWidth = opts.logoWidth ?? Math.floor(imgW * 0.2)
    const opacity = opts.logoOpacity ?? 0.7

    // Resize logo + apply opacity via linear blend
    const logoBuf = await sharp(opts.logoPath)
      .resize({ width: targetWidth, fit: 'inside' })
      .ensureAlpha()
      .linear(opacity, 0) // multiply alpha channel
      .toBuffer()

    const logoMeta = await sharp(logoBuf).metadata()
    const wmW = logoMeta.width ?? targetWidth
    const wmH = logoMeta.height ?? targetWidth

    if (opts.tile) {
      composites = await buildTileInputs(logoBuf, wmW, wmH, imgW, imgH, margin)
    } else {
      const { left, top } = positionToOffset(opts.position, margin, imgW, imgH, wmW, wmH)
      composites = [{ input: logoBuf, left, top, blend: 'over' }]
    }
  }

  return composites
}

// ── Main watermark function ───────────────────────────────────────────────────
export async function applyWatermark(
  inputPath: string,
  originalName: string,
  outputDir: string,
  opts: WatermarkOptions
): Promise<WatermarkFileResult> {
  await fs.mkdir(outputDir, { recursive: true })

  const img = sharp(inputPath)
  const meta = await img.metadata()
  const imgW = meta.width ?? 800
  const imgH = meta.height ?? 600

  const composites = await getWatermarkComposites(opts, imgW, imgH)

  // Determine output filename with _wm suffix
  const parsed = path.parse(originalName)
  const ext = parsed.ext || '.jpg'
  const newName = `${parsed.name}_wm${ext}`
  const newPath = path.join(outputDir, newName)

  await sharp(inputPath)
    .composite(composites)
    .toFile(newPath)

  const { size: newSize } = await fs.stat(newPath)

  return { newPath, newName, newSize }
}
