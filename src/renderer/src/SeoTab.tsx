import React, { useState, useCallback } from 'react'
import {
  FileCheck2, Tag, Info, CheckCircle2, Copy,
  RefreshCw, Globe, Shield, Type as TypeIcon
} from 'lucide-react'
import type { SeoSettings } from '@shared/types'

// ── Default SEO settings ──────────────────────────────────────────────────────
export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  renameTemplate: '{name}-{size}',
  stripExif: true,
  embedIptc: false,
  iptcAuthor: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function applyTemplate(template: string, name: string): string {
  const base = slugify(name.replace(/\.[^/.]+$/, ''))
  return template
    .replace('{name}', base || 'image')
    .replace('{size}', '800x600')
    .replace('{index}', '01')
    .replace('{date}', new Date().toISOString().slice(0, 10))
}

// ── Token button ──────────────────────────────────────────────────────────────
function TokenBtn({ token, onClick }: { token: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded-md cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors font-mono"
    >
      {token}
    </button>
  )
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({
  checked, onChange, title, desc, color = 'indigo'
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  desc: string
  color?: string
}) {
  const ring = color === 'indigo' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'
  return (
    <label className={`flex items-start gap-3 cursor-pointer p-3 border rounded-xl transition-colors
      ${checked
        ? `border-${color}-200 bg-${color}-50/40`
        : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20'
      }`}
    >
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className={`w-4 h-4 text-${color}-600 rounded border-slate-300 ${ring} focus:ring-2`}
        />
      </div>
      <div>
        <span className="block text-sm font-semibold text-slate-700">{title}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</span>
      </div>
    </label>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface SeoTabProps {
  seo: SeoSettings
  setSeo: React.Dispatch<React.SetStateAction<SeoSettings>>
}

const TOKENS = ['{name}', '{size}', '{index}', '{date}']
const TOKEN_DESCS: Record<string, string> = {
  '{name}': 'Tên gốc (slug)',
  '{size}': 'Độ phân giải',
  '{index}': 'Số thứ tự',
  '{date}': 'Ngày tháng',
}

const SAMPLE_ORIGINAL = 'Anh San Pham Moi 2024.JPG'

export default function SeoTab({ seo, setSeo }: SeoTabProps) {
  const [copied, setCopied] = useState(false)

  const setField = useCallback(<K extends keyof SeoSettings>(key: K, val: SeoSettings[K]) => {
    setSeo(prev => ({ ...prev, [key]: val }))
  }, [setSeo])

  const insertToken = (token: string) => {
    setField('renameTemplate', (seo.renameTemplate + token))
  }

  const previewName = applyTemplate(seo.renameTemplate, SAMPLE_ORIGINAL)

  const copyPreview = () => {
    navigator.clipboard.writeText(previewName).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const resetTemplate = () => setField('renameTemplate', DEFAULT_SEO_SETTINGS.renameTemplate)

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 scrollbar-thin">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Section: File Renamer ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="bg-indigo-100 p-1.5 rounded-lg">
              <TypeIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Quy tắc đặt tên (File Renamer)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Tự động đổi tên ảnh theo chuẩn SEO khi xử lý</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Template input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700">Template Tên File</label>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
              <input
                type="text"
                value={seo.renameTemplate}
                onChange={e => setField('renameTemplate', e.target.value)}
                placeholder="{name}-{size}"
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-sm text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>

            {/* Token chips */}
            <div>
              <p className="text-[11px] text-slate-500 mb-2 font-medium">Chèn biến nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {TOKENS.map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <TokenBtn token={t} onClick={() => insertToken(t)} />
                    <span className="text-[10px] text-slate-400">{TOKEN_DESCS[t]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Ví dụ trước / sau:
              </p>
              <p className="font-mono text-xs line-through text-slate-400">{SAMPLE_ORIGINAL}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="font-mono text-xs text-emerald-600 font-bold flex-1 break-all">
                  {previewName}.webp
                </p>
                <button
                  type="button"
                  onClick={copyPreview}
                  title="Copy preview"
                  className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {copied
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>

            {/* Info hint */}
            <p className="text-[11px] text-slate-500 flex items-start gap-1.5 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
              <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              Tên file sẽ được tự động loại bỏ dấu tiếng Việt, viết thường và thay khoảng trắng bằng dấu gạch ngang.
            </p>
          </div>
        </section>

        {/* ── Section: Metadata (EXIF / IPTC) ───────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="bg-emerald-100 p-1.5 rounded-lg">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Xử lý Metadata (EXIF / IPTC)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Bảo mật thông tin cá nhân và nhúng bản quyền ảnh</p>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <ToggleRow
              checked={seo.stripExif}
              onChange={v => setField('stripExif', v)}
              title="Loại bỏ toàn bộ EXIF nhạy cảm"
              desc="Xóa thông tin định vị GPS, thiết bị chụp ảnh, phần mềm chỉnh sửa. Giảm thêm 2–5 KB mỗi ảnh."
              color="indigo"
            />

            <ToggleRow
              checked={seo.embedIptc}
              onChange={v => setField('embedIptc', v)}
              title="Nhúng thông tin Bản quyền (IPTC)"
              desc="Thêm tên tác giả và website vào siêu dữ liệu ảnh để bảo vệ bản quyền."
              color="emerald"
            />

            {/* IPTC author input – shown only when enabled */}
            {seo.embedIptc && (
              <div className="mt-2 pl-7">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" /> Tên tác giả hoặc Website
                </label>
                <input
                  type="text"
                  value={seo.iptcAuthor}
                  onChange={e => setField('iptcAuthor', e.target.value)}
                  placeholder="Ví dụ: © 2025 example.com"
                  className="w-full max-w-sm border border-slate-300 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-shadow"
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Section: SEO Score tip ─────────────────────────────────── */}
        <section className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Tại sao cần tối ưu ảnh cho SEO?</h4>
              <ul className="text-[12px] text-white/80 space-y-1 list-disc pl-4 leading-relaxed">
                <li>Tên file là <strong className="text-white">tín hiệu xếp hạng</strong> quan trọng trong Google Image Search</li>
                <li>Ảnh WebP / AVIF cải thiện <strong className="text-white">Core Web Vitals</strong> (LCP, CLS)</li>
                <li>Xóa EXIF giảm dung lượng và <strong className="text-white">bảo vệ quyền riêng tư</strong></li>
                <li>IPTC giúp Google xác định tác giả, hỗ trợ <strong className="text-white">E-E-A-T</strong></li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
