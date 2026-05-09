import { applyWatermark } from './watermark-engine'
import type { WatermarkRequest, WatermarkProgress } from '@shared/types'

export type WatermarkProgressCallback = (progress: WatermarkProgress) => void

let isCancelled = false

export async function processWatermarkBatch(
  request: WatermarkRequest,
  onProgress: WatermarkProgressCallback
): Promise<{ processedCount: number }> {
  const { files, watermark, outputDir } = request
  isCancelled = false
  let processedCount = 0

  for (const file of files) {
    if (isCancelled) {
      onProgress({ id: file.id, progress: 0, status: 'error', errorMsg: 'Cancelled' })
      continue
    }

    onProgress({ id: file.id, progress: 20, status: 'processing' })

    try {
      const result = await applyWatermark(file.path, file.name, outputDir, watermark)

      onProgress({
        id: file.id,
        progress: 100,
        status: 'success',
        newPath: result.newPath,
        newName: result.newName,
        newSize: result.newSize,
      })

      processedCount++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      onProgress({ id: file.id, progress: 0, status: 'error', errorMsg })
    }
  }

  return { processedCount }
}

export function cancelWatermarkBatch(): void {
  isCancelled = true
}
