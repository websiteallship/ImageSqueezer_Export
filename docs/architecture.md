# Architecture — ImageSqueezer

## Stack

| Layer | Tech | Ghi chú |
|---|---|---|
| Desktop shell | **Electron** | Main + Renderer process |
| UI | **React + Tailwind CSS** | Renderer process |
| Icons | **lucide-react** | Dùng trong `frontend.jsx` |
| Nén ảnh | **Sharp** (libvips) | Main process — rebuild cho đúng Electron ABI |
| Batch | **p-limit + worker_threads** | Xử lý song song |
| Metadata | **exiftool-vendored** | Đọc/ghi EXIF/IPTC |
| Storage | **electron-store** | Lưu preset, settings |

---

## Process Model

```
┌──────────────────────────────────────────┐
│  Main Process (Node.js)                  │
│  ipc-handlers.ts / compressor/ / store   │
└───────────────┬──────────────────────────┘
                │ IPC (invoke / handle)
        ┌───────┴────────┐
        │ Preload Script │  contextBridge — whitelist channels
        └───────┬────────┘
                │
┌───────────────┴──────────────────────────┐
│  Renderer Process (React)                │
│  frontend.jsx → tabs: compress / wm /    │
│  seo / stats / settings                  │
└──────────────────────────────────────────┘
```

**Quy tắc bắt buộc (security):**
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Mọi giao tiếp Main ↔ Renderer qua `ipcMain.handle` / `ipcRenderer.invoke`
- Validate tất cả args trong main process — không tin renderer

---

## Cấu trúc thư mục

```
toolnenanh/
├── src/
│   ├── main/
│   │   ├── main.ts              # App entry, BrowserWindow
│   │   ├── ipc-handlers.ts      # IPC channels
│   │   └── compressor/
│   │       ├── sharp-engine.ts  # Core compress logic
│   │       ├── watermark.ts     # Text + Logo watermark
│   │       ├── seo-optimizer.ts # Rename slug, EXIF strip
│   │       └── batch.ts         # Queue + p-limit
│   ├── preload/
│   │   └── preload.ts           # contextBridge
│   ├── renderer/
│   │   ├── App.jsx / frontend.jsx
│   │   └── components/
│   └── shared/
│       ├── constants.ts         # IPC channel names
│       └── types.ts             # Shared interfaces
├── docs/                        # Tài liệu dự án
├── electron-builder.yml
└── package.json
```

---

## IPC Channels

| Channel | Direction | Mô tả |
|---|---|---|
| `image:compress` | Renderer → Main | Nén batch, trả progress |
| `image:watermark` | Renderer → Main | Áp watermark |
| `image:seo-rename` | Renderer → Main | Đổi tên slug |
| `dialog:open-files` | Renderer → Main | Mở file picker |
| `dialog:open-folder` | Renderer → Main | Chọn output folder |
| `settings:get` | Renderer → Main | Lấy config |
| `settings:set` | Renderer → Main | Lưu config |
| `compress:progress` | Main → Renderer | Push progress từng file |

---

## Sharp — Rebuild Electron

```bash
# Sau npm install, rebuild Sharp cho đúng Electron version
npx electron-rebuild -f -w sharp
# hoặc
npm run rebuild
```

Sharp chạy trong **Main process** — không bao giờ import vào renderer.

---

## Build & Dev

```bash
npm run dev        # Concurrently: Vite renderer + Electron main
npm run build      # electron-builder → dist/
npm run rebuild    # Rebuild native modules
```

**electron-builder.yml** targets: `nsis` (Windows x64/arm64), `dmg` (macOS), `AppImage` (Linux).
