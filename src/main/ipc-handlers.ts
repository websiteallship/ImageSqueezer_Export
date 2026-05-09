import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { IPC } from '@shared/constants'
import { getAllSettings, getSetting, setSetting, getStats, addStats, clearStats } from './store'
import { processBatch, cancelBatch } from './compressor/batch'
import { processWatermarkBatch, cancelWatermarkBatch } from './compressor/watermark-batch'
import type { CompressRequest, AppSettings, WatermarkRequest } from '@shared/types'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ── DIALOG: open image files ──────────────────────────────────────────────
  ipcMain.handle(IPC.DIALOG_OPEN_FILES, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn ảnh để nén',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'] }
      ]
    })
    return result
  })

  // ── DIALOG: choose output folder ──────────────────────────────────────────
  ipcMain.handle(IPC.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn thư mục lưu ảnh đã nén',
      properties: ['openDirectory', 'createDirectory']
    })
    return result
  })

  // ── SETTINGS: get all ─────────────────────────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getAllSettings()
  })

  // ── SETTINGS: set one key ─────────────────────────────────────────────────
  ipcMain.handle(
    IPC.SETTINGS_SET,
    <K extends keyof AppSettings>(_event: Electron.IpcMainInvokeEvent, key: K, value: AppSettings[K]) => {
      if (typeof key !== 'string') throw new Error('Invalid key')
      setSetting(key, value)
      return { success: true }
    }
  )

  // ── STATS: get history ────────────────────────────────────────────────────
  ipcMain.handle(IPC.STATS_GET, () => {
    return getStats()
  })

  // ── STATS: clear history ──────────────────────────────────────────────────
  ipcMain.handle('stats:clear', () => {
    clearStats()
    return { success: true }
  })

  // ── IMAGE: compress batch ─────────────────────────────────────────────────
  ipcMain.handle(IPC.IMAGE_COMPRESS, async (_event, request: CompressRequest) => {
    if (!request?.files?.length || !request?.options) {
      throw new Error('Invalid compress request')
    }

    // Resolve outputDir: askOutputDir flag → open dialog; else use request/store value
    let outputDir = request.options.outputDir?.trim() || getSetting('outputDir')
    if (getSetting('askOutputDir')) {
      const dlg = await dialog.showOpenDialog(mainWindow, {
        title: 'Chọn thư mục lưu ảnh đã nén',
        properties: ['openDirectory', 'createDirectory']
      })
      if (!dlg.canceled && dlg.filePaths[0]) outputDir = dlg.filePaths[0]
    }

    const resolvedRequest: CompressRequest = {
      ...request,
      options: {
        ...request.options,
        outputDir: outputDir || path.join(process.env.HOME || process.env.USERPROFILE || '', 'Pictures', 'ImageSqueezer_Export')
      }
    }

    const result = await processBatch(resolvedRequest, (progress) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('compress:progress', progress)
      }
    })

    if (result.processedCount > 0) {
      addStats({
        timestamp: Date.now(),
        fileCount: result.processedCount,
        totalSaved: result.totalSaved,
        outputFormat: request.options.outputFormat,
        label: `${result.processedCount} ảnh`
      })
    }

    return result
  })

  // ── IMAGE: cancel batch ───────────────────────────────────────────────────
  ipcMain.handle(IPC.IMAGE_CANCEL, () => {
    cancelBatch()
    return { success: true }
  })

  // ── DIALOG: open single image (for logo picker) ───────────────────────────
  ipcMain.handle(IPC.DIALOG_OPEN_IMAGE, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn ảnh logo watermark',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }
      ]
    })
    return result
  })

  // ── IMAGE: watermark batch ────────────────────────────────────────────────
  ipcMain.handle(IPC.IMAGE_WATERMARK, async (_event, request: WatermarkRequest) => {
    if (!request?.files?.length || !request?.watermark) {
      throw new Error('Invalid watermark request')
    }

    const outputDir = request.outputDir?.trim()
      ? request.outputDir
      : getSetting('outputDir') ||
        path.join(process.env.HOME || process.env.USERPROFILE || '', 'Pictures', 'ImageSqueezer_Export')

    const result = await processWatermarkBatch(
      { ...request, outputDir },
      (progress) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('watermark:progress', progress)
        }
      }
    )

    if (result.processedCount > 0) {
      addStats({
        timestamp: Date.now(),
        fileCount: result.processedCount,
        totalSaved: 0,
        outputFormat: 'watermark',
        label: `${result.processedCount} ảnh (watermark)`
      })
    }

    return result
  })

  // ── IMAGE: cancel watermark ───────────────────────────────────────────────
  ipcMain.handle(IPC.IMAGE_WATERMARK_CANCEL, () => {
    cancelWatermarkBatch()
    return { success: true }
  })

  // ── FS: get file stat ────────────────────────────────────────────────────
  ipcMain.handle('fs:stat', (_event, filePath: string) => {
    if (typeof filePath !== 'string') throw new Error('Invalid path')
    try {
      const stat = fs.statSync(filePath)
      return { size: stat.size }
    } catch {
      return { size: 0 }
    }
  })

  // ── SHELL: open output folder ─────────────────────────────────────────────
  ipcMain.handle('shell:open-folder', (_event, folderPath: string) => {
    if (typeof folderPath !== 'string') throw new Error('Invalid path')
    shell.openPath(folderPath)
  })
}
