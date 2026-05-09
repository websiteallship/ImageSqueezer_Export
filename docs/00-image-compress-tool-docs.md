# 🖼️ ImageSqueezer — Tool Nén Ảnh Chuẩn SEO Cho Website

> Công cụ desktop miễn phí để nén ảnh, gắn watermark và tối ưu hóa ảnh cho website — lấy cảm hứng từ TinyPNG.

---

## 📌 Tổng Quan

**ImageSqueezer** là ứng dụng desktop đa nền tảng (Windows / macOS / Linux) giúp nén ảnh thông minh, tối ưu kích thước file mà vẫn giữ chất lượng hình ảnh cao nhất có thể. Đặc biệt tập trung vào chuẩn SEO cho website: đúng định dạng, đúng kích thước, đúng tên file, đúng metadata.

---

## 🧱 Kiến Trúc & Công Nghệ

### Stack đề xuất

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework UI | **Electron.js** hoặc **Tauri** | Cross-platform, giao diện web-based |
| Ngôn ngữ chính | **Node.js** (Electron) hoặc **Rust + JS** (Tauri) | Hiệu năng + hệ sinh thái npm |
| Nén ảnh | **Sharp** (libvips) | Nhanh nhất, miễn phí, hỗ trợ nhiều format |
| Xử lý metadata | **ExifTool** (via exiftool-vendored) | Chuẩn công nghiệp |
| Watermark | **Sharp** + **Canvas API** | Tích hợp sẵn trong Sharp |
| Batch processing | **p-limit** + **worker_threads** | Xử lý song song |
| UI Framework | **React** + **Tailwind CSS** | Developer-friendly |
| Icon Library | **lucide-react** | Hệ sinh thái icon hiện đại, nhẹ |

### Thư viện miễn phí chính

```
sharp             # Nén/resize/convert ảnh (MIT License)
imagemin          # Pipeline nén ảnh
imagemin-mozjpeg  # JPEG optimizer (Mozilla)
imagemin-pngquant # PNG optimizer (lossy, rất hiệu quả)
imagemin-svgo     # SVG optimizer
imagemin-webp     # WebP converter
exiftool-vendored # Đọc/ghi metadata EXIF
jimp              # Pure JS image processing (fallback)
p-limit           # Giới hạn concurrent tasks
chokidar          # Watch thư mục (auto-compress)
```

---

## ✨ Tính Năng Chính

### 1. 🗜️ Nén Ảnh Thông Minh (Core Feature)

- **Thuật toán tự động**: Phân tích ảnh và chọn mức nén tối ưu
- **Lossy + Lossless**: Cho phép chọn chế độ hoặc để tự động
- **Định dạng hỗ trợ**: JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF
- **Mục tiêu**: Giảm 60–80% kích thước, mắt người không nhận ra sự khác biệt
- **So sánh trực quan**: Slider before/after ngay trong app
- **Preview real-time**: Xem trước kết quả trước khi lưu

```
Ví dụ kết quả điển hình:
  photo.jpg      2.4 MB  →  340 KB  (−85%)   ✅
  banner.png     1.1 MB  →  210 KB  (−81%)   ✅
  icon.svg        48 KB  →    8 KB  (−83%)   ✅
```

### 2. 🌐 Tối Ưu SEO (SEO Optimizer)

#### Đổi tên file chuẩn SEO
- Chuyển tên file sang slug: `Ảnh Sản Phẩm 1.jpg` → `anh-san-pham-1.jpg`
- Loại bỏ ký tự đặc biệt, khoảng trắng
- Tự động đánh số thứ tự nếu trùng tên
- Template đặt tên tùy chỉnh: `{category}-{name}-{size}-{index}`

#### Metadata & Alt Text
- Điền **Alt Text** hàng loạt hoặc từng ảnh
- Ghi **Title**, **Description**, **Copyright** vào EXIF/IPTC
- Xóa metadata nhạy cảm (GPS, thiết bị chụp) trước khi publish
- Xuất file `image-seo-report.csv` với tên file + alt text gợi ý

#### Định dạng chuẩn Web
- Tự động chuyển sang **WebP** (Google khuyến nghị)
- Tạo **AVIF** cho trình duyệt hiện đại
- Giữ **JPEG/PNG** làm fallback
- Xuất cùng lúc nhiều định dạng (multi-format export)

#### Responsive Images
- Tự động tạo nhiều kích thước từ 1 ảnh gốc:
  ```
  image.jpg         (1920px - desktop)
  image-md.jpg      (1024px - tablet)
  image-sm.jpg      (768px  - mobile)
  image-thumb.jpg   (300px  - thumbnail)
  ```
- Sinh code HTML `<picture>` + `srcset` tự động

### 3. 🏷️ Watermark

#### Watermark Văn Bản
- Font tùy chọn, kích thước, màu sắc, opacity
- Vị trí: 9 điểm neo (góc, cạnh, trung tâm)
- Tile mode: lặp watermark toàn ảnh
- Hỗ trợ Unicode / Tiếng Việt

#### Watermark Logo/Ảnh
- Chèn logo PNG (có alpha channel) lên ảnh
- Điều chỉnh kích thước logo theo % ảnh gốc
- Blend mode: normal, multiply, screen, overlay
- Padding từ cạnh ảnh tùy chỉnh

#### Watermark Hàng Loạt
- Áp dụng 1 preset watermark cho toàn bộ batch
- Lưu nhiều preset (website A, website B, social media...)

### 4. 📐 Resize & Crop Thông Minh

- **Smart Crop**: Tự động crop giữ vùng quan trọng (face detection optional)
- **Aspect Ratio Lock**: Giữ tỷ lệ khi resize
- **Canvas Extend**: Thêm viền/nền để đạt kích thước chuẩn
- **Preset sizes**: 
  - OG Image (1200×630)
  - Facebook Cover (820×312)
  - Twitter Card (1200×675)
  - Product Thumbnail (800×800)
  - Favicon (16/32/48/64px)

### 5. ⚡ Xử Lý Hàng Loạt (Batch Processing)

- Drag & Drop thư mục hoặc nhiều file cùng lúc
- Queue hiển thị tiến độ từng file
- Xử lý song song (multi-thread, tận dụng CPU đa nhân)
- Dừng/tiếp tục/hủy bất kỳ lúc nào
- **Watch Mode**: Theo dõi thư mục, tự động nén ảnh mới

### 6. 🎨 Điều Chỉnh Ảnh Cơ Bản

- Brightness / Contrast / Saturation / Sharpness
- Rotate / Flip (ngang, dọc)
- Grayscale / Sepia / Blur
- Remove background (tích hợp API miễn phí tùy chọn)

### 7. 📊 Thống Kê & Báo Cáo

- Dashboard tổng quan: tổng dung lượng tiết kiệm, số ảnh đã xử lý
- Biểu đồ so sánh before/after
- Xuất báo cáo CSV/JSON để tích hợp CMS
- Lịch sử xử lý (có thể undo về ảnh gốc)

### 8. 🔧 Cài Đặt & Preset

- Lưu profile cấu hình: "Nén nhanh", "Chất lượng cao", "SEO chuẩn"
- Config per file type: JPEG dùng quality 82, PNG dùng pngquant level 2...
- Import/Export preset để chia sẻ team
- CLI mode: chạy qua terminal cho CI/CD pipeline

---

## 📁 Cấu Trúc Dự Án

```
imagesqueezer/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js
│   │   ├── ipc-handlers.js      # IPC giữa main và renderer
│   │   └── compressor/
│   │       ├── sharp-engine.js  # Core compression (Sharp)
│   │       ├── imagemin.js      # Imagemin pipeline
│   │       ├── watermark.js     # Watermark logic
│   │       ├── seo-optimizer.js # Rename, metadata, WebP
│   │       └── batch.js         # Queue & worker threads
│   ├── renderer/                # React UI
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Compress.jsx
│   │   │   ├── Watermark.jsx
│   │   │   ├── SEO.jsx
│   │   │   ├── Batch.jsx
│   │   │   └── Settings.jsx
│   │   └── components/
│   │       ├── DropZone.jsx
│   │       ├── ImagePreview.jsx
│   │       ├── BeforeAfterSlider.jsx
│   │       ├── QueueList.jsx
│   │       └── StatsCard.jsx
│   └── shared/
│       ├── constants.js
│       └── utils.js
├── assets/
├── build/
├── package.json
└── electron-builder.yml
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn
- Windows 10+, macOS 11+, Ubuntu 20.04+

### Cài đặt dependencies

```bash
# Clone project
git clone https://github.com/yourname/imagesqueezer.git
cd imagesqueezer

# Cài dependencies
npm install

# Build native modules (Sharp cần build cho đúng Electron version)
npm run rebuild

# Chạy development
npm run dev

# Build production
npm run build
```

### Cài đặt Sharp (lưu ý)

```bash
# Sharp cần được build đúng platform
npm install sharp

# Nếu dùng Electron, rebuild cho đúng ABI
./node_modules/.bin/electron-rebuild -f -w sharp
```

---

## 💡 Thuật Toán Nén

### JPEG
```
- Sử dụng MozJPEG encoder (tốt hơn libjpeg chuẩn ~10%)
- Quality mặc định: 82 (ngưỡng vàng: mắt người không phân biệt)
- Progressive JPEG: enable (load nhanh hơn trên web)
- Chroma subsampling: 4:2:0 cho ảnh tự nhiên, 4:4:4 cho text/logo
```

### PNG
```
- pngquant: lossy reduction (256 màu, dùng dithering)
- Giảm bit depth nếu ảnh chỉ dùng ít màu
- Kết hợp oxipng để tối ưu lossless thêm
- Mục tiêu: 60-80% reduction
```

### WebP
```
- Method 6 (chậm nhất nhưng nén tốt nhất)
- Quality 80 cho ảnh tự nhiên
- Lossless mode cho logo/icon
- Luôn nhỏ hơn JPEG/PNG tương đương 25-35%
```

### AVIF
```
- Encoder: libavif (qua Sharp)
- Quality 60 (tương đương WebP 80)
- Nhỏ hơn WebP thêm 20-30%
- Hỗ trợ: Chrome 85+, Firefox 93+, Safari 16+
```

---

## 📋 Roadmap

### v1.0 — MVP
- [x] Giao diện Drag & Drop cơ bản
- [x] Nén JPEG, PNG, WebP
- [x] Batch processing
- [x] Watermark văn bản và logo
- [x] Đổi tên file chuẩn SEO
- [x] Xuất báo cáo CSV

### v1.5 — SEO Pro
- [ ] Chuyển đổi sang AVIF
- [ ] Tạo responsive srcset tự động
- [ ] Alt text generator (AI-assisted)
- [ ] Watch folder mode
- [ ] CLI interface

### v2.0 — Power Features
- [ ] Remove background (AI)
- [ ] Face detection cho smart crop
- [ ] Plugin system
- [ ] Cloud sync preset
- [ ] Figma/Photoshop plugin

---

## 📊 So Sánh Với TinyPNG

| Tính năng | TinyPNG (web) | **ImageSqueezer** |
|---|---|---|
| Miễn phí | 20 ảnh/tháng | ✅ Không giới hạn |
| Offline | ❌ | ✅ |
| Batch | Giới hạn | ✅ Không giới hạn |
| Watermark | ❌ | ✅ |
| SEO rename | ❌ | ✅ |
| AVIF | ❌ | ✅ |
| Metadata | ❌ | ✅ |
| CLI | ❌ | ✅ |
| Responsive export | ❌ | ✅ |
| Bảo mật (ảnh private) | ❌ Upload lên server | ✅ Xử lý local |

---

## 📜 License

MIT License — Miễn phí sử dụng, chỉnh sửa và phân phối.

---

> **"Ảnh nhỏ hơn = Website nhanh hơn = SEO tốt hơn = Nhiều khách hàng hơn."**
