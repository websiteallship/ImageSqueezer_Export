import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/constants'
import type {
  CompressRequest,
  CompressProgress,
  AppSettings,
  DialogOpenResult,
  WatermarkRequest,
  WatermarkProgress,
} from '@shared/types'

const INVOKE_CHANNELS = [
  IPC.IMAGE_COMPRESS,
  IPC.IMAGE_CANCEL,
  IPC.IMAGE_WATERMARK,
  IPC.IMAGE_WATERMARK_CANCEL,
  IPC.DIALOG_OPEN_FILES,
  IPC.DIALOG_OPEN_FOLDER,
  IPC.DIALOG_OPEN_IMAGE,
  IPC.SETTINGS_GET,
  IPC.SETTINGS_SET,
  IPC.STATS_GET,
  'shell:open-folder',
  'fs:stat'
] as const

type InvokeChannel = (typeof INVOKE_CHANNELS)[number]

const PUSH_CHANNELS = ['compress:progress', 'watermark:progress'] as const
type PushChannel = (typeof PUSH_CHANNELS)[number]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function invoke<T>(channel: InvokeChannel, ...args: unknown[]): Promise<T> {
  if (!(INVOKE_CHANNELS as readonly string[]).includes(channel)) {
    return Promise.reject(new Error(`Channel "${channel}" not allowed`))
  }
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

function onPush(channel: PushChannel, callback: (arg: unknown) => void): () => void {
  if (!(PUSH_CHANNELS as readonly string[]).includes(channel)) return () => {}
  const listener = (_event: Electron.IpcRendererEvent, arg: unknown) => callback(arg)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('electronAPI', {
  compressImages: (request: CompressRequest) =>
    invoke<{ processedCount: number; totalSaved: number }>(IPC.IMAGE_COMPRESS, request),

  cancelCompress: () =>
    invoke<{ success: boolean }>(IPC.IMAGE_CANCEL),

  openFiles: () =>
    invoke<DialogOpenResult>(IPC.DIALOG_OPEN_FILES),

  openFolder: () =>
    invoke<DialogOpenResult>(IPC.DIALOG_OPEN_FOLDER),

  getSettings: () =>
    invoke<AppSettings>(IPC.SETTINGS_GET),

  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    invoke<{ success: boolean }>(IPC.SETTINGS_SET, key, value),

  openInExplorer: (folderPath: string) =>
    invoke<void>('shell:open-folder', folderPath),

  onCompressProgress: (callback: (progress: CompressProgress) => void) =>
    onPush('compress:progress', (arg) => callback(arg as CompressProgress)),

  applyWatermark: (request: WatermarkRequest) =>
    invoke<{ processedCount: number }>(IPC.IMAGE_WATERMARK, request),

  cancelWatermark: () =>
    invoke<{ success: boolean }>(IPC.IMAGE_WATERMARK_CANCEL),

  openImageFile: () =>
    invoke<DialogOpenResult>(IPC.DIALOG_OPEN_IMAGE),

  onWatermarkProgress: (callback: (progress: WatermarkProgress) => void) =>
    onPush('watermark:progress', (arg) => callback(arg as WatermarkProgress)),

  getStats: () =>
    invoke<import('@shared/types').StatsRecord[]>(IPC.STATS_GET),

  getFileStat: (filePath: string) =>
    invoke<{ size: number }>('fs:stat', filePath),
})
