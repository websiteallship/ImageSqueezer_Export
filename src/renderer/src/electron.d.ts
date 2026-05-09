import type {
  CompressRequest,
  CompressProgress,
  AppSettings,
  DialogOpenResult,
  WatermarkRequest,
  WatermarkProgress,
  StatsRecord,
} from '../../../shared/types'

declare global {
  interface Window {
    electronAPI: {
      compressImages: (request: CompressRequest) => Promise<{ processedCount: number; totalSaved: number }>
      cancelCompress: () => Promise<{ success: boolean }>
      openFiles: () => Promise<DialogOpenResult>
      openFolder: () => Promise<DialogOpenResult>
      getSettings: () => Promise<AppSettings>
      setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<{ success: boolean }>
      openInExplorer: (folderPath: string) => Promise<void>
      onCompressProgress: (callback: (progress: CompressProgress) => void) => () => void
      // Watermark
      applyWatermark: (request: WatermarkRequest) => Promise<{ processedCount: number }>
      cancelWatermark: () => Promise<{ success: boolean }>
      openImageFile: () => Promise<DialogOpenResult>
      onWatermarkProgress: (callback: (progress: WatermarkProgress) => void) => () => void
      // Stats
      getStats: () => Promise<StatsRecord[]>
      // FS
      getFileStat: (filePath: string) => Promise<{ size: number }>
    }
  }
}

