# UI Components — ImageSqueezer

## Design System

- **Framework**: React (JSX) + Tailwind CSS
- **Icons**: lucide-react
- **Font**: system-ui / sans (slate color scale)
- **Color accent**: `indigo-600` (primary), `emerald-500` (success), `amber-500` (warning)

---

## Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar (w-64, bg-slate-900)               │
│  - Logo + App name                          │
│  - Nav items (compress/wm/seo/stats)        │
│  - Settings button (bottom)                 │
├─────────────────────────────────────────────┤
│  Header (h-16, bg-white)                    │
│  - Tab title + icon                         │
│  - "Tiết kiệm X MB" badge (khi có kết quả) │
├─────────────────────────────────────────────┤
│  Main content area (flex-1, overflow-y-auto)│
│  Compress: flex-row → WorkArea + ConfigPanel│
│  Other tabs: centered max-w container       │
└─────────────────────────────────────────────┘
```

---

## Component Inventory

### DropZone
```jsx
// Kéo thả file — handles drag over/leave/drop
// Click → file picker (addMockFile trong prototype)
// States: idle | dragging (border-indigo-500, scale-[1.01])
// Hiển thị badges định dạng: JPEG / PNG / WebP / AVIF
```

**Props:** `onFiles(files[])`, `isDragging`

---

### QueueList
```jsx
// Danh sách file chờ xử lý
// Header: "Danh sách chờ X/20" + nút "Xóa tất cả"
// Item:
//   - Thumbnail placeholder (ImageIcon)
//   - Tên file (truncate) + reduction badge (-XX%)
//   - Size before → after
//   - Progress bar (pending/processing)
//   - Status icon: pending→Trash | processing→spinner | success→CheckCircle2
```

**States per file:** `pending` | `processing` | `success` | `error`

---

### ConfigPanel (Right sidebar — Compress tab)
```jsx
// Format picker: grid 4 cols (WEBP/AVIF/JPEG/PNG)
// Quality slider: range 10-100, accent-indigo-600
// SEO toggles: checkbox + label
// Action button: "Bắt đầu Squeeze (N)"
// Download button: "Lưu toàn bộ" (khi có success)
```

---

### StatsCard
```jsx
// bg-white rounded-2xl shadow-sm
// Background watermark icon (opacity-10, absolute)
// Big number (font-black) + badge label
// Colors: emerald (savings), indigo (count), amber (time)
```

---

### WatermarkPositionPicker
```jsx
// Grid 3×3 buttons
// Active = bg-indigo-500
// Default active index = 8 (bottom-right)
```

---

### Toggle Switch (inline)
```jsx
// Tailwind peer pattern
// sr-only checkbox + visual div
// peer-checked:bg-indigo-600
```

---

## State (App-level — frontend.jsx)

| State | Type | Mô tả |
|---|---|---|
| `activeTab` | string | Tab hiện tại |
| `files` | FileItem[] | Queue list (max 20) |
| `isDragging` | boolean | Drop zone highlight |
| `isProcessing` | boolean | Đang chạy batch |
| `uploadError` | string\|null | Lỗi vượt 20 files |
| `outputFormat` | 'webp'\|'avif'\|'jpeg'\|'png' | Format đầu ra |
| `quality` | number | 10–100 |
| `autoRenameSEO` | boolean | Slug rename toggle |

### FileItem shape

```typescript
interface FileItem {
  id: number;
  name: string;
  size: number;        // bytes gốc
  type: string;        // MIME
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;    // 0-100
  // Sau khi xử lý:
  newSize?: number;
  newName?: string;
  saved?: number;      // size - newSize
}
```

---

## React Patterns áp dụng

| Pattern | Nơi dùng |
|---|---|
| Controlled state | format picker, quality slider, toggles |
| Derived state | `totalSaved = files.reduce(...)` |
| Conditional render | `activeTab === 'compress' && <...>` |
| setTimeout/setInterval | Mock processing — thay bằng IPC thật |
| Functional update | `setFiles(prev => [...prev, ...newFiles])` |

---

## Naming Convention

- Component files: `PascalCase.jsx`
- CSS classes: Tailwind utility — không dùng custom class
- State vars: `camelCase`
- IPC channels: `namespace:action` (vd: `image:compress`)

---

## Accessibility Checklist

- [ ] Tất cả button có text hoặc `aria-label`
- [ ] Input có `<label>` liên kết
- [ ] Focus ring hiển thị (`focus:ring-indigo-500`)
- [ ] Màu contrast đủ (slate-700 trên white = AA)
- [ ] Progress bar có `role="progressbar"` + `aria-valuenow`
