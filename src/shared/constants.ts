// IPC Channels — Renderer → Main (invoke)
export const IPC = {
  IMAGE_COMPRESS: 'image:compress',
  IMAGE_CANCEL: 'image:cancel',
  IMAGE_WATERMARK: 'image:watermark',
  IMAGE_WATERMARK_CANCEL: 'image:watermark-cancel',
  DIALOG_OPEN_FILES: 'dialog:open-files',
  DIALOG_OPEN_FOLDER: 'dialog:open-folder',
  DIALOG_OPEN_IMAGE: 'dialog:open-image',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  STATS_GET: 'stats:get',
} as const

// IPC Channels — Main → Renderer (push via webContents.send)
export const IPC_PUSH = {
  COMPRESS_PROGRESS: 'compress:progress',
  WATERMARK_PROGRESS: 'watermark:progress',
} as const

export const DEFAULT_SETTINGS = {
  outputDir: '',
  askOutputDir: false,
  theme: 'light' as const,
  concurrentThreads: 4,
  hardwareAcceleration: true,
  defaultFormat: 'webp' as const,
  defaultQuality: 82,
  autoRenameSEO: true,
  stripExif: true,
  windowBounds: { x: 0, y: 0, width: 1280, height: 800 },
  watermarkOptions: {
    mode: 'text' as const,
    text: '© ImageSqueezer',
    fontSize: 36,
    fontColor: '#ffffff',
    fontOpacity: 0.65,
    logoPath: '',
    logoWidth: 200,
    logoOpacity: 0.75,
    position: 'top-right' as const,
    margin: 20,
    tile: false
  },
  seoSettings: {
    renameTemplate: '{name}-{size}',
    stripExif: true,
    embedIptc: false,
    iptcAuthor: ''
  }
}

export const MAX_BATCH_FILES = 20
