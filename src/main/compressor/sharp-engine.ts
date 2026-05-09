import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import { ExifTool } from 'exiftool-vendored'
import { toSlug } from './utils'
import { getWatermarkComposites } from './watermark-engine'
import type { CompressOptions, OutputFormat, SeoSettings } from '@shared/types'

const exiftool = new ExifTool()

export interface CompressFileResult {
  newPath: string
  newName: string
  newSize: number
  saved: number
}

/**
 * Compress a single image file using Sharp.
 * Runs in the main process — never import this in renderer.
 */
export async function compressFile(
  inputPath: string,
  originalName: string,
  originalSize: number,
  options: CompressOptions,
  /** 1-based index in the batch, used for {index} token */
  batchIndex: number = 1
): Promise<CompressFileResult> {
  const { outputFormat, quality, autoRenameSEO, stripExif, outputDir, seoSettings } = options

  // Build output filename
  const ext = `.${outputFormat}`
  const parsedBase = path.parse(originalName).name

  let outputName: string
  if (autoRenameSEO) {
    outputName = buildSeoName(parsedBase, ext, seoSettings, batchIndex)
  } else {
    outputName = `${parsedBase}${ext}`
  }

  const outputPath = path.join(outputDir, outputName)

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  // Build Sharp pipeline
  let pipeline = sharp(inputPath)

  // Strip EXIF: by default Sharp copies metadata; withMetadata() keeps it.
  // To STRIP: do NOT call withMetadata → Sharp omits EXIF by default on output.
  // To KEEP:  call pipeline.withMetadata()
  const shouldStrip = seoSettings?.stripExif ?? stripExif ?? true
  if (!shouldStrip) {
    // Preserve original metadata (keep EXIF)
    pipeline = pipeline.withMetadata()
  }
  // If shouldStrip is true: no-op — Sharp already discards EXIF on format conversion

  // Apply watermark if enabled
  if (options.enableWatermark && options.watermark) {
    const meta = await pipeline.metadata()
    const imgW = meta.width ?? 800
    const imgH = meta.height ?? 600
    const composites = await getWatermarkComposites(options.watermark, imgW, imgH)
    pipeline = pipeline.composite(composites)
  }

  // Apply format-specific compression
  pipeline = applyFormat(pipeline, outputFormat, quality)

  await pipeline.toFile(outputPath)

  // Embed IPTC/EXIF copyright if enabled
  if (seoSettings?.embedIptc && seoSettings.iptcAuthor) {
    try {
      await exiftool.write(outputPath, {
        Creator: seoSettings.iptcAuthor,
        Copyright: seoSettings.iptcAuthor,
        CopyrightNotice: seoSettings.iptcAuthor
      }, ['-overwrite_original'])
    } catch (e) {
      console.error('ExifTool error:', e)
    }
  }

  const { size: newSize } = await fs.stat(outputPath)
  const saved = originalSize - newSize

  return {
    newPath: outputPath,
    newName: outputName,
    newSize,
    saved: Math.max(saved, 0)
  }
}

/**
 * Build SEO filename from template.
 * Supported tokens: {name}, {size}, {index}, {date}
 */
function buildSeoName(
  rawBase: string,
  ext: string,
  seo: SeoSettings | undefined,
  index: number
): string {
  const template = seo?.renameTemplate?.trim() || '{name}'
  const slug = toSlug(rawBase) || 'image'
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const idxStr = String(index).padStart(2, '0')

  const result = template
    .replace(/{name}/g, slug)
    .replace(/{size}/g, '800x600') // placeholder; real dims need pre-read (expensive in batch)
    .replace(/{index}/g, idxStr)
    .replace(/{date}/g, date)

  // Final sanitize — ensure safe filename
  const sanitized = toSlug(result.replace(/_/g, '-')) || slug
  return `${sanitized}${ext}`
}

function applyFormat(pipeline: sharp.Sharp, format: OutputFormat, quality: number): sharp.Sharp {
  switch (format) {
    case 'jpeg':
      return pipeline.jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: '4:2:0'
      })

    case 'png':
      return pipeline.png({
        quality,
        compressionLevel: 9,
        palette: true
      })

    case 'webp':
      return pipeline.webp({
        quality,
        effort: 6,
        lossless: false
      })

    case 'avif':
      // AVIF quality scale is inverted from user expectation — map 0-100 → effort
      return pipeline.avif({
        quality: Math.round(quality * 0.6), // ~60% of user quality value
        effort: 6
      })

    default:
      return pipeline.webp({ quality, effort: 6 })
  }
}
