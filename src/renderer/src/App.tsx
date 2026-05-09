import React, { useState, useEffect, useCallback } from 'react'
import {
  UploadCloud, Image as ImageIcon, Settings, FileCheck2,
  Type, Zap, Trash2, CheckCircle2, AlertCircle, BarChart3,
  SlidersHorizontal, Download, Info, FolderOpen, X,
  Layers, AlignLeft, AlignCenter, AlignRight,
  ImagePlus, Stamp, LayoutGrid, Move,
  Clock, Cpu, RefreshCw, Moon, Monitor
} from 'lucide-react'
import { formatBytes } from './utils'
import SeoTab, { DEFAULT_SEO_SETTINGS } from './SeoTab'
import type { QueueFile, OutputFormat, CompressOptions, WatermarkOptions, WatermarkPosition, WatermarkProgress, SeoSettings, StatsRecord } from '@shared/types'

const NAV = [
  { id: 'compress', icon: UploadCloud, label: 'Nén Ảnh' },
  { id: 'watermark', icon: Type, label: 'Watermark' },
  { id: 'seo', icon: FileCheck2, label: 'Tối ưu SEO' },
  { id: 'stats', icon: BarChart3, label: 'Thống kê' },
] as const

type Tab = (typeof NAV)[number]['id'] | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('compress')
  const [files, setFiles] = useState<QueueFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp')
  const [quality, setQuality] = useState(82)
  const [autoRenameSEO, setAutoRenameSEO] = useState(true)
  const [stripExif, setStripExif] = useState(true)
  const [outputDir, setOutputDir] = useState('')
  const [enableWatermark, setEnableWatermark] = useState(false)
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS)
  // Settings state
  const [askOutputDir, setAskOutputDir] = useState(false)
  const [concurrentThreads, setConcurrentThreads] = useState(4)
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [maxBatchFiles, setMaxBatchFiles] = useState(20)
  // Stats state
  const [statsHistory, setStatsHistory] = useState<StatsRecord[]>([])
  const [wmOptions, setWmOptions] = useState<WatermarkOptions>({
    mode: 'text',
    text: '© ImageSqueezer',
    fontSize: 36,
    fontColor: '#ffffff',
    fontOpacity: 0.65,
    logoPath: '',
    logoWidth: 200,
    logoOpacity: 0.75,
    position: 'top-right',
    margin: 20,
    tile: false
  })

  // Load settings on mount
  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => {
      setOutputFormat(s.defaultFormat)
      setQuality(s.defaultQuality)
      setAutoRenameSEO(s.autoRenameSEO)
      setStripExif(s.stripExif)
      setOutputDir(s.outputDir)
      if (s.watermarkOptions) setWmOptions(s.watermarkOptions)
      if (s.seoSettings) setSeoSettings(s.seoSettings)
      setAskOutputDir(s.askOutputDir ?? false)
      setConcurrentThreads(s.concurrentThreads ?? 4)
      setHardwareAcceleration(s.hardwareAcceleration ?? true)
      setTheme(s.theme ?? 'light')
      setMaxBatchFiles(s.maxBatchFiles ?? 20)
      if (s.statsHistory) setStatsHistory(s.statsHistory)
    }).catch(() => {})
  }, [])

  // Auto-save settings
  useEffect(() => {
    if (outputDir) window.electronAPI?.setSetting('outputDir', outputDir)
  }, [outputDir])
  useEffect(() => { window.electronAPI?.setSetting('watermarkOptions', wmOptions) }, [wmOptions])
  useEffect(() => { window.electronAPI?.setSetting('seoSettings', seoSettings) }, [seoSettings])
  useEffect(() => { window.electronAPI?.setSetting('askOutputDir', askOutputDir) }, [askOutputDir])
  useEffect(() => { window.electronAPI?.setSetting('concurrentThreads', concurrentThreads) }, [concurrentThreads])
  useEffect(() => { window.electronAPI?.setSetting('hardwareAcceleration', hardwareAcceleration) }, [hardwareAcceleration])
  useEffect(() => { window.electronAPI?.setSetting('theme', theme) }, [theme])
  useEffect(() => { window.electronAPI?.setSetting('maxBatchFiles', maxBatchFiles) }, [maxBatchFiles])
  // Reload stats when switching to stats tab
  useEffect(() => {
    if (tab === 'stats') {
      window.electronAPI?.getStats().then(setStatsHistory).catch(() => {})
    }
  }, [tab])

  // Subscribe to compression progress
  useEffect(() => {
    const unsub = window.electronAPI?.onCompressProgress((progress) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === progress.id
            ? {
                ...f,
                status: progress.status,
                progress: progress.progress,
                newName: progress.newName ?? f.newName,
                newSize: progress.newSize ?? f.newSize,
                newPath: progress.newPath ?? f.newPath,
                saved: progress.saved ?? f.saved,
                errorMsg: progress.errorMsg ?? f.errorMsg,
              }
            : f
        )
      )
    })
    return () => unsub?.()
  }, [])

  const addFiles = useCallback((incoming: QueueFile[]) => {
    setUploadError(null)
    setFiles((prev) => {
      const combined = [...prev, ...incoming]
      if (combined.length > maxBatchFiles) {
        setUploadError(`Tối đa ${maxBatchFiles} ảnh mỗi batch. Danh sách đã được cắt.`)
        return combined.slice(0, maxBatchFiles)
      }
      return combined
    })
  }, [maxBatchFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!e.dataTransfer.files.length) return
    const newFiles: QueueFile[] = Array.from(e.dataTransfer.files)
      .filter((f: File) => f.type.startsWith('image/'))
      .map((f: File, i: number) => ({
        id: `${Date.now()}-${i}`,
        name: f.name,
        path: (f as File & { path?: string }).path ?? f.name,
        size: f.size,
        type: f.type,
        status: 'pending',
        progress: 0,
      }))
    if (newFiles.length) addFiles(newFiles)
  }, [addFiles])

  const openFilePicker = async () => {
    const result = await window.electronAPI?.openFiles()
    if (!result || result.canceled || !result.filePaths.length) return
    const newFiles: QueueFile[] = result.filePaths.map((p: string, i: number) => {
      const name = p.split(/[\\/]/).pop() ?? p
      return { id: `${Date.now()}-${i}`, name, path: p, size: 0, type: 'image/jpeg', status: 'pending' as const, progress: 0 }
    })
    addFiles(newFiles)
  }

  const startCompress = async () => {
    const pending = files.filter((f) => f.status !== 'success')
    if (!pending.length) return
    setIsProcessing(true)
    const opts: CompressOptions = { 
      outputFormat, quality, autoRenameSEO, stripExif: seoSettings.stripExif, outputDir,
      enableWatermark,
      watermark: enableWatermark ? wmOptions : undefined,
      seoSettings
    }
    try {
      await window.electronAPI.compressImages({
        files: pending.map((f) => ({ id: f.id, path: f.path, name: f.name, size: f.size })),
        options: opts,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelCompress = () => { window.electronAPI?.cancelCompress(); setIsProcessing(false) }
  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id))
  const clearAll = () => { setFiles([]); setUploadError(null) }

  const totalSaved = files.reduce((acc, f) => acc + (f.saved ?? 0), 0)
  const doneCount = files.filter((f) => f.status === 'success').length

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-md">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide">ImageSqueezer</h1>
            <p className="text-[11px] text-slate-400">SEO Optimizer Pro</p>
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-0.5 px-3">
            {NAV.map(({ id, icon: Icon, label }) => (
              <li key={id}>
                <button
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    tab === id
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              tab === 'settings' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Cài đặt
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            {tab === 'compress' && <><UploadCloud className="w-5 h-5 text-indigo-600" /> Nén &amp; Tối ưu ảnh</>}
            {tab === 'watermark' && <><Type className="w-5 h-5 text-indigo-600" /> Watermark</>}
            {tab === 'seo' && <><FileCheck2 className="w-5 h-5 text-indigo-600" /> Tối ưu SEO</>}
            {tab === 'stats' && <><BarChart3 className="w-5 h-5 text-indigo-600" /> Thống kê</>}
            {tab === 'settings' && <><Settings className="w-5 h-5 text-indigo-600" /> Cài đặt</>}
          </h2>
          {totalSaved > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã tiết kiệm {formatBytes(totalSaved)}
            </span>
          )}
        </header>

        {/* COMPRESS TAB */}
        {tab === 'compress' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: dropzone + queue */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {uploadError && (
                <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{uploadError}</span>
                  <button onClick={() => setUploadError(null)}><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 overflow-hidden gap-4">
                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={openFilePicker}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shrink-0 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                      : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="bg-indigo-100 p-3.5 rounded-full mb-3">
                    <UploadCloud className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="font-bold text-slate-700 mb-1">Kéo thả tối đa {maxBatchFiles} ảnh vào đây</p>
                  <p className="text-slate-500 text-sm mb-3">hoặc click để chọn file</p>
                  <div className="flex gap-1.5">
                    {['JPEG', 'PNG', 'WebP', 'AVIF'].map((f) => (
                      <span key={f} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium text-slate-500">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Queue */}
                {files.length > 0 && (
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                      <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                        Hàng chờ
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{files.length}/{maxBatchFiles}</span>
                        {doneCount > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">✓ {doneCount}</span>}
                      </span>
                      <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa tất cả</button>
                    </div>

                    <div className="overflow-y-auto flex-1 scrollbar-thin">
                      {files.map((file) => (
                        <div key={file.id} className="group flex items-center px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg mr-3 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400 border border-slate-200">
                            <ImageIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {file.status === 'success' ? file.newName : file.name}
                              </p>
                              {file.status === 'success' && file.saved != null && file.size > 0 && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                                  -{Math.round((file.saved / file.size) * 100)}%
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{formatBytes(file.size)}</span>
                              {file.status === 'success' && file.newSize != null && (
                                <>
                                  <span>→</span>
                                  <span className="text-emerald-600 font-semibold">{formatBytes(file.newSize)}</span>
                                </>
                              )}
                              {file.status === 'processing' && <span className="text-indigo-500 animate-pulse">Đang nén...</span>}
                              {file.status === 'error' && <span className="text-red-500">{file.errorMsg}</span>}
                            </div>
                            {file.status === 'processing' && (
                              <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                                <div
                                  className="bg-indigo-500 h-1 rounded-full progress-bar"
                                  style={{ width: `${file.progress}%` }}
                                  role="progressbar"
                                  aria-valuenow={file.progress}
                                />
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 w-7 flex items-center justify-center">
                            {file.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {file.status === 'processing' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                            {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                            {file.status === 'pending' && (
                              <button onClick={() => removeFile(file.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: config panel */}
            <div className="w-72 border-l border-slate-200 bg-white flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Cấu hình đầu ra
                </h3>
              </div>

              <div className="p-4 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
                {/* Format */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Định dạng ảnh</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['webp', 'avif', 'jpeg', 'png'] as OutputFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          outputFormat === fmt
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {outputFormat === 'avif' && (
                    <p className="text-[11px] text-amber-600 mt-2 bg-amber-50 p-2 rounded-md border border-amber-100 flex gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> AVIF nén tốt nhưng chậm hơn.
                    </p>
                  )}
                </div>

                {/* Quality */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700">Chất lượng</label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{quality}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Nhỏ nhất</span><span>Cân bằng (82)</span><span>Nét nhất</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* SEO toggles */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Cài đặt SEO nhanh</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Đổi tên chuẩn SEO (slug)', desc: 'Xóa dấu, khoảng trắng → slug', checked: autoRenameSEO, set: setAutoRenameSEO },
                      { label: 'Xóa EXIF nhạy cảm', desc: 'GPS, thiết bị, phần mềm chỉnh sửa', checked: stripExif, set: setStripExif },
                      { label: 'Đóng Watermark', desc: 'Sử dụng cấu hình ở tab Watermark', checked: enableWatermark, set: setEnableWatermark },
                    ].map(({ label, desc, checked, set }) => (
                      <label key={label} className="flex items-start gap-2.5 cursor-pointer p-2.5 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-xl transition-colors">
                        <input
                          type="checkbox" checked={checked}
                          onChange={(e) => set(e.target.checked)}
                          className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-slate-700">{label}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">{desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Output dir */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Thư mục lưu</label>
                  <div className="flex gap-2">
                    <input
                      readOnly value={outputDir}
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 font-mono truncate"
                    />
                    <button
                      onClick={async () => {
                        const r = await window.electronAPI?.openFolder()
                        if (!r?.canceled && r?.filePaths[0]) setOutputDir(r.filePaths[0])
                      }}
                      className="shrink-0 border border-slate-200 hover:border-indigo-400 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={isProcessing ? cancelCompress : startCompress}
                  disabled={files.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${
                    files.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isProcessing
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {isProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />Hủy</>
                  ) : (
                    <><Zap className="w-4 h-4 fill-current" />Bắt đầu Squeeze {files.length > 0 && `(${files.length})`}</>
                  )}
                </button>

                {doneCount > 0 && !isProcessing && (
                  <button
                    onClick={() => window.electronAPI?.openInExplorer(outputDir)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Mở thư mục kết quả
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WATERMARK TAB */}
        {tab === 'watermark' && <WatermarkTab wmOptions={wmOptions} setWmOptions={setWmOptions} maxBatchFiles={maxBatchFiles} />}

        {/* SEO TAB */}
        {tab === 'seo' && <SeoTab seo={seoSettings} setSeo={setSeoSettings} />}

        {/* STATS TAB */}
        {tab === 'stats' && (() => {
          const totalSavedBytes = statsHistory.reduce((s, r) => s + r.totalSaved, 0)
          const totalFiles = statsHistory.reduce((s, r) => s + r.fileCount, 0)
          const relTime = (ts: number) => {
            const diff = Date.now() - ts
            if (diff < 60000) return 'Vừa xong'
            if (diff < 3600000) return `${Math.floor(diff/60000)} phút trước`
            if (diff < 86400000) return `${Math.floor(diff/3600000)} giờ trước`
            return new Date(ts).toLocaleDateString('vi-VN')
          }
          return (
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 scrollbar-thin">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Thống kê hiệu năng toàn cục</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Download className="w-16 h-16" /></div>
                    <p className="text-slate-500 text-sm font-medium">Dung lượng đã tiết kiệm</p>
                    <p className="text-4xl font-black text-emerald-600 mt-3 tracking-tight">{formatBytes(totalSavedBytes)}</p>
                    <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded mt-3 font-medium">{statsHistory.length} phiên xử lý</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ImageIcon className="w-16 h-16" /></div>
                    <p className="text-slate-500 text-sm font-medium">Tổng ảnh đã xử lý</p>
                    <p className="text-4xl font-black text-indigo-600 mt-3 tracking-tight">{totalFiles.toLocaleString()}</p>
                    <p className="text-xs text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded mt-3 font-medium">Toàn thời gian</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-16 h-16" /></div>
                    <p className="text-slate-500 text-sm font-medium">Phiên gần nhất</p>
                    <p className="text-2xl font-black text-amber-500 mt-3 tracking-tight">{statsHistory[0] ? relTime(statsHistory[0].timestamp) : '—'}</p>
                    <p className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded mt-3 font-medium">{statsHistory[0] ? statsHistory[0].label : 'Chưa có dữ liệu'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-800 mb-4">Lịch sử xử lý gần đây</h4>
                  {statsHistory.length === 0 ? (
                    <p className="text-slate-400 text-sm py-6 text-center">Chưa có lịch sử. Hãy nén ảnh để bắt đầu ghi nhận.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="pb-3 font-medium">Thời gian</th>
                          <th className="pb-3 font-medium">Số ảnh</th>
                          <th className="pb-3 font-medium">Dung lượng giảm</th>
                          <th className="pb-3 font-medium">Định dạng</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        {statsHistory.slice(0, 20).map((r, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            <td className="py-3">{relTime(r.timestamp)}</td>
                            <td className="py-3 font-medium text-slate-800">{r.label ?? `${r.fileCount} ảnh`}</td>
                            <td className="py-3 text-emerald-600 font-medium">{r.totalSaved > 0 ? `- ${formatBytes(r.totalSaved)}` : '—'}</td>
                            <td className="py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs uppercase">{r.outputFormat}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 scrollbar-thin">
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Lưu trữ & Thư mục */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Lưu trữ &amp; Thư mục</h3>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Thư mục xuất file mặc định</label>
                  <div className="flex gap-3">
                    <input
                      type="text" readOnly value={outputDir || 'Chưa chọn thư mục'}
                      className="flex-1 border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-600 font-mono text-sm outline-none cursor-default"
                    />
                    <button
                      onClick={async () => {
                        const r = await window.electronAPI?.openFolder()
                        if (!r?.canceled && r?.filePaths[0]) setOutputDir(r.filePaths[0])
                      }}
                      className="bg-white border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
                    >
                      Đổi thư mục
                    </button>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input type="checkbox" checked={askOutputDir} onChange={e => setAskOutputDir(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                    <span className="text-sm font-medium text-slate-700">Luôn hỏi thư mục lưu sau mỗi lần nén (Tắt lưu tự động)</span>
                  </label>
                </div>
              </div>


              {/* Hệ thống & Hiệu năng */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Hệ thống &amp; Hiệu năng</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-slate-700">Giới hạn luồng xử lý đồng thời (Concurrent Threads)</label>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{concurrentThreads} Luồng</span>
                    </div>
                    <input type="range" min="1" max="16" value={concurrentThreads} onChange={e => setConcurrentThreads(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      Tăng luồng giúp xử lý lô lớn nhanh hơn, nhưng sẽ tiêu tốn nhiều CPU hơn. Mặc định là số core của CPU hiện tại.
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={hardwareAcceleration} onChange={e => setHardwareAcceleration(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">Tăng tốc phần cứng (Hardware Acceleration)</span>
                      <span className="block text-[11px] text-slate-500 mt-1">Sử dụng GPU để xử lý UI và một số tác vụ nén ảnh nhất định, giúp ứng dụng mượt mà hơn.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Giới hạn batch */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Giới hạn tải lên mỗi batch</h3>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Số ảnh tối đa mỗi lần tải lên</label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{maxBatchFiles} ảnh</span>
                  </div>
                  <input
                    type="range" min="10" max="500" step="10" value={maxBatchFiles}
                    onChange={e => setMaxBatchFiles(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10</span><span>250</span><span>500</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Tăng giới hạn cho phép xử lý lô lớn hơn. Mặc định 20 ảnh/batch.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK TAB
// ─────────────────────────────────────────────────────────────────────────────
type WmFile = QueueFile & { newSize?: number }

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left',      label: '↖' },
  { id: 'top-center',    label: '↑' },
  { id: 'top-right',     label: '↗' },
  { id: 'center',        label: '⊙' },
  { id: 'bottom-left',   label: '↙' },
  { id: 'bottom-center', label: '↓' },
  { id: 'bottom-right',  label: '↘' },
]

function WatermarkTab({ wmOptions, setWmOptions, maxBatchFiles }: { wmOptions: WatermarkOptions, setWmOptions: React.Dispatch<React.SetStateAction<WatermarkOptions>>, maxBatchFiles: number }) {
  const [files, setFiles] = useState<WmFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [outputDir, setOutputDir] = useState('')

  // Watermark options derived from props
  const { mode, text: wmText, fontSize, fontColor, fontOpacity, logoPath, logoWidth, logoOpacity, position, margin, tile } = wmOptions

  const setMode = (mode: any) => setWmOptions(p => ({ ...p, mode }))
  const setWmText = (text: string) => setWmOptions(p => ({ ...p, text }))
  const setFontSize = (fontSize: number) => setWmOptions(p => ({ ...p, fontSize }))
  const setFontColor = (fontColor: string) => setWmOptions(p => ({ ...p, fontColor }))
  const setFontOpacity = (fontOpacity: number) => setWmOptions(p => ({ ...p, fontOpacity }))
  const setLogoPath = (logoPath: string) => setWmOptions(p => ({ ...p, logoPath }))
  const setLogoWidth = (logoWidth: number) => setWmOptions(p => ({ ...p, logoWidth }))
  const setLogoOpacity = (logoOpacity: number) => setWmOptions(p => ({ ...p, logoOpacity }))
  const setPosition = (position: any) => setWmOptions(p => ({ ...p, position }))
  const setMargin = (margin: number) => setWmOptions(p => ({ ...p, margin }))
  const setTile = (tile: boolean) => setWmOptions(p => ({ ...p, tile }))

  const doneCount = files.filter(f => f.status === 'success').length

  // Subscribe to watermark progress
  useEffect(() => {
    const unsub = window.electronAPI?.onWatermarkProgress((prog: WatermarkProgress) => {
      setFiles(prev => prev.map(f =>
        f.id === prog.id
          ? {
              ...f,
              status: prog.status,
              progress: prog.progress,
              newName: prog.newName ?? f.newName,
              newSize: prog.newSize ?? f.newSize,
              newPath: prog.newPath ?? f.newPath,
              errorMsg: prog.errorMsg ?? f.errorMsg,
            }
          : f
      ))
    })
    return () => unsub?.()
  }, [])

  const addFiles = useCallback((incoming: WmFile[]) => {
    setFiles(prev => {
      const combined = [...prev, ...incoming]
      return combined.slice(0, maxBatchFiles)
    })
  }, [maxBatchFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const newFiles: WmFile[] = Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith('image/'))
      .map((f, i) => ({
        id: `wm-${Date.now()}-${i}`,
        name: f.name,
        path: (f as File & { path?: string }).path ?? f.name,
        size: f.size,
        type: f.type,
        status: 'pending' as const,
        progress: 0,
      }))
    if (newFiles.length) addFiles(newFiles)
  }, [addFiles])

  const openFiles = async () => {
    const r = await window.electronAPI?.openFiles()
    if (!r || r.canceled) return
    const newFiles: WmFile[] = r.filePaths.map((p, i) => {
      const name = p.split(/[\\/]/).pop() ?? p
      return { id: `wm-${Date.now()}-${i}`, name, path: p, size: 0, type: 'image/jpeg', status: 'pending' as const, progress: 0 }
    })
    addFiles(newFiles)
  }

  const pickLogo = async () => {
    const r = await window.electronAPI?.openImageFile()
    if (!r || r.canceled || !r.filePaths[0]) return
    setLogoPath(r.filePaths[0])
  }

  const startWatermark = async () => {
    const pending = files.filter(f => f.status !== 'success')
    if (!pending.length) return
    setIsProcessing(true)

    const opts: WatermarkOptions = {
      mode,
      text: wmText,
      fontSize,
      fontColor,
      fontOpacity,
      logoPath: logoPath || undefined,
      logoWidth,
      logoOpacity,
      position,
      margin,
      tile,
    }

    try {
      await window.electronAPI.applyWatermark({
        files: pending.map(f => ({ id: f.id, path: f.path, name: f.name, size: f.size })),
        watermark: opts,
        outputDir,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelWatermark = () => { window.electronAPI?.cancelWatermark(); setIsProcessing(false) }
  const removeFile = (id: string) => setFiles(p => p.filter(f => f.id !== id))
  const clearAll = () => setFiles([])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: dropzone + queue */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 p-5 gap-4">
        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={openFiles}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shrink-0 ${
            isDragging
              ? 'border-violet-500 bg-violet-50 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-violet-400 hover:bg-slate-50/80'
          }`}
        >
          <div className="bg-violet-100 p-3.5 rounded-full mb-3">
            <Stamp className="w-8 h-8 text-violet-600" />
          </div>
          <p className="font-bold text-slate-700 mb-1">Kéo thả ảnh cần đóng watermark</p>
          <p className="text-slate-500 text-sm">hoặc click để chọn file (tối đa {maxBatchFiles})</p>
        </div>

        {/* Queue */}
        {files.length > 0 && (
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                Hàng chờ
                <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs">{files.length}/{maxBatchFiles}</span>
                {doneCount > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">✓ {doneCount}</span>}
              </span>
              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa tất cả</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {files.map(file => (
                <div key={file.id} className="group flex items-center px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg mr-3 flex items-center justify-center shrink-0 border border-slate-200">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {file.status === 'success' ? file.newName : file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      {file.size > 0 && <span>{formatBytes(file.size)}</span>}
                      {file.status === 'processing' && <span className="text-violet-500 animate-pulse">Đang xử lý...</span>}
                      {file.status === 'error' && <span className="text-red-500">{file.errorMsg}</span>}
                      {file.status === 'success' && <span className="text-emerald-600 font-semibold">✓ Xong</span>}
                    </div>
                    {file.status === 'processing' && (
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                        <div className="bg-violet-500 h-1 rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 w-7 flex items-center justify-center">
                    {file.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {file.status === 'processing' && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
                    {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {file.status === 'pending' && (
                      <button onClick={() => removeFile(file.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: config panel */}
      <div className="w-72 border-l border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-violet-600" /> Cài đặt Watermark
          </h3>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Mode switch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Loại watermark</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([['text', 'Chữ', Type], ['logo', 'Logo / Ảnh', ImagePlus]] as [string, string, React.ElementType][]).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setMode(id as 'text' | 'logo')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                    mode === id
                      ? 'bg-violet-50 border-violet-600 text-violet-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text options */}
          {mode === 'text' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung</label>
                <input
                  value={wmText}
                  onChange={e => setWmText(e.target.value)}
                  placeholder="© Tên thương hiệu"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Cỡ chữ</label>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{fontSize}px</span>
                </div>
                <input type="range" min="12" max="120" value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-violet-600 h-1.5 cursor-pointer" />
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Màu chữ</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
                    <span className="text-xs text-slate-500 font-mono">{fontColor}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Độ trong suốt</label>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{Math.round(fontOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={fontOpacity}
                  onChange={e => setFontOpacity(Number(e.target.value))}
                  className="w-full accent-violet-600 h-1.5 cursor-pointer" />
              </div>
            </>
          )}

          {/* Logo options */}
          {mode === 'logo' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">File logo (PNG / WebP)</label>
                <div className="flex gap-2">
                  <input readOnly value={logoPath ? logoPath.split(/[\\/]/).pop() : ''} placeholder="Chưa chọn file"
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 font-mono truncate" />
                  <button onClick={pickLogo}
                    className="shrink-0 border border-slate-200 hover:border-violet-400 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-violet-600 transition-colors">
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Chiều rộng logo</label>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{logoWidth}px</span>
                </div>
                <input type="range" min="40" max="600" step="10" value={logoWidth}
                  onChange={e => setLogoWidth(Number(e.target.value))}
                  className="w-full accent-violet-600 h-1.5 cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Độ trong suốt</label>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{Math.round(logoOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={logoOpacity}
                  onChange={e => setLogoOpacity(Number(e.target.value))}
                  className="w-full accent-violet-600 h-1.5 cursor-pointer" />
              </div>
            </>
          )}

          <hr className="border-slate-100" />

          {/* Position picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> Vị trí
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl">
              {POSITIONS.filter(p => p.id !== 'center').slice(0, 3).map(p => (
                <button key={p.id} onClick={() => setPosition(p.id)}
                  className={`py-2 text-sm rounded-lg font-bold transition-all ${position === p.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
                  {p.label}
                </button>
              ))}
              <button onClick={() => setPosition('center')}
                className={`col-span-3 py-2 text-sm rounded-lg font-bold transition-all ${position === 'center' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
                ⊙ Giữa
              </button>
              {POSITIONS.filter(p => p.id !== 'center').slice(3).map(p => (
                <button key={p.id} onClick={() => setPosition(p.id)}
                  className={`py-2 text-sm rounded-lg font-bold transition-all ${position === p.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Margin */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">Khoảng cách mép</label>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{margin}px</span>
            </div>
            <input type="range" min="0" max="100" value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="w-full accent-violet-600 h-1.5 cursor-pointer" />
          </div>

          {/* Tile */}
          <label className="flex items-start gap-2.5 cursor-pointer p-2.5 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 rounded-xl transition-colors">
            <input type="checkbox" checked={tile} onChange={e => setTile(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 text-violet-600 rounded" />
            <div>
              <span className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" /> Lặp lại (Tile)
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">Phủ watermark toàn bộ ảnh</span>
            </div>
          </label>

          {/* Output dir */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Thư mục lưu</label>
            <div className="flex gap-2">
              <input readOnly value={outputDir} placeholder="Mặc định: Pictures/ImageSqueezer_Export"
                className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 font-mono truncate" />
              <button
                onClick={async () => {
                  const r = await window.electronAPI?.openFolder()
                  if (!r?.canceled && r?.filePaths[0]) setOutputDir(r.filePaths[0])
                }}
                className="shrink-0 border border-slate-200 hover:border-violet-400 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-violet-600 transition-colors">
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={isProcessing ? cancelWatermark : startWatermark}
            disabled={files.length === 0 || (mode === 'logo' && !logoPath)}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${
              files.length === 0 || (mode === 'logo' && !logoPath)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isProcessing
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isProcessing ? (
              <><div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />Hủy</>
            ) : (
              <><Stamp className="w-4 h-4" />Đóng Watermark {files.length > 0 && `(${files.length})`}</>
            )}
          </button>

          {doneCount > 0 && !isProcessing && (
            <button
              onClick={() => window.electronAPI?.openInExplorer(outputDir)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-sm text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Mở thư mục kết quả
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
