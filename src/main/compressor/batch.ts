import { compressFile } from './sharp-engine'
import fs from 'node:fs/promises'
import { getSetting } from '../store'
import type { CompressRequest, CompressProgress } from '@shared/types'

export type ProgressCallback = (progress: CompressProgress) => void

let isCancelled = false

/**
 * Simple semaphore-based concurrency limiter (no ESM-only deps).
 */
async function runWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker() {
    while (index < tasks.length && !isCancelled) {
      const current = index++
      results[current] = await tasks[current]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export async function processBatch(
  request: CompressRequest,
  onProgress: ProgressCallback
): Promise<{ processedCount: number; totalSaved: number }> {
  const { files, options } = request
  isCancelled = false

  let processedCount = 0
  let totalSaved = 0

  const tasks = files.map((file, idx) => async () => {
    if (isCancelled) {
      onProgress({ id: file.id, progress: 0, status: 'error', errorMsg: 'Cancelled' })
      return
    }

    onProgress({ id: file.id, progress: 10, status: 'processing' })

    try {
      await fs.access(file.path)
      onProgress({ id: file.id, progress: 40, status: 'processing' })

      const result = await compressFile(file.path, file.name, file.size, options, idx + 1)

      onProgress({
        id: file.id,
        progress: 100,
        status: 'success',
        newName: result.newName,
        newSize: result.newSize,
        newPath: result.newPath,
        saved: result.saved,
      })

      totalSaved += result.saved
      processedCount++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      onProgress({ id: file.id, progress: 0, status: 'error', errorMsg })
    }
  })

  await runWithLimit(tasks, options.concurrentThreads ?? getSetting('concurrentThreads') ?? 4)
  return { processedCount, totalSaved }
}

export function cancelBatch(): void {
  isCancelled = true
}
