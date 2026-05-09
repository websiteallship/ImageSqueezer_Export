export type FileStatus = 'pending' | 'processing' | 'success' | 'error'

export interface StatsRecord {
  timestamp: number
  fileCount: number
  totalSaved: number  // bytes
  outputFormat: string
  label?: string
}

export type OutputFormat = 'webp' | 'avif' | 'jpeg' | 'png'

export interface QueueFile {
  id: string
  name: string
  path: string
  size: number
  type: string
  status: FileStatus
  progress: number
  // Populated after compression
  newName?: string
  newSize?: number
  newPath?: string
  saved?: number
  errorMsg?: string
}

export interface CompressOptions {
  outputFormat: OutputFormat
  quality: number
  autoRenameSEO: boolean
  stripExif: boolean
  outputDir: string
  concurrentThreads?: number
  enableWatermark?: boolean
  watermark?: WatermarkOptions
  /** SEO settings from the SEO tab — takes priority over top-level autoRenameSEO/stripExif */
  seoSettings?: SeoSettings
}

export interface CompressRequest {
  files: Array<{ id: string; path: string; name: string; size: number }>
  options: CompressOptions
}

export interface CompressProgress {
  id: string
  progress: number
  status: FileStatus
  newName?: string
  newSize?: number
  newPath?: string
  saved?: number
  errorMsg?: string
}

export interface CompressResult {
  success: boolean
  processedCount: number
  totalSaved: number
}

export interface SeoSettings {
  /** Naming template, e.g. "{name}-{size}" */
  renameTemplate: string
  /** Strip all EXIF (GPS, device, software) */
  stripExif: boolean
  /** Embed IPTC copyright metadata */
  embedIptc: boolean
  /** IPTC author / website string */
  iptcAuthor: string
}

export interface AppSettings {
  outputDir: string
  askOutputDir: boolean
  theme: 'light' | 'dark' | 'system'
  concurrentThreads: number
  hardwareAcceleration: boolean
  defaultFormat: OutputFormat
  defaultQuality: number
  autoRenameSEO: boolean
  stripExif: boolean
  windowBounds: { x: number; y: number; width: number; height: number }
  watermarkOptions?: WatermarkOptions
  seoSettings?: SeoSettings
  statsHistory?: StatsRecord[]
}

export interface DialogOpenResult {
  canceled: boolean
  filePaths: string[]
}

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type WatermarkMode = 'text' | 'logo'

export interface WatermarkOptions {
  mode: WatermarkMode
  // Text watermark
  text?: string
  fontSize?: number
  fontColor?: string   // hex e.g. '#ffffff'
  fontOpacity?: number // 0-1
  // Logo watermark
  logoPath?: string
  logoWidth?: number   // px
  logoOpacity?: number // 0-1
  // Common
  position: WatermarkPosition
  margin?: number      // px offset from edge
  tile?: boolean       // repeat pattern
}

export interface WatermarkRequest {
  files: Array<{ id: string; path: string; name: string; size: number }>
  watermark: WatermarkOptions
  outputDir: string
}

export interface WatermarkProgress {
  id: string
  progress: number
  status: FileStatus
  newPath?: string
  newName?: string
  newSize?: number
  errorMsg?: string
}
