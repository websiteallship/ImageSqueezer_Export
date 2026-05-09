# Features — ImageSqueezer

## Tabs hiện tại (frontend.jsx)

| Tab | Route state | Mô tả |
|---|---|---|
| **Nén Ảnh** | `compress` | Drop zone + queue list + config panel |
| **Watermark** | `watermark` | Text/Logo WM + position picker |
| **Tối ưu SEO** | `seo` | File renamer + EXIF handler |
| **Thống kê** | `stats` | Stats cards + history table |
| **Cài đặt** | `settings` | Output folder, theme, threads |

---

## 1. Compress Tab

- Drag & Drop tối đa **20 ảnh/batch**
- Hỗ trợ: JPEG, PNG, WebP, AVIF
- Config panel (right sidebar):
  - **Output format**: WebP / AVIF / JPEG / PNG
  - **Quality slider**: 10–100 (default 82)
  - **SEO rename toggle**: tự động slug hóa tên file
  - **Strip EXIF toggle**: xóa metadata nhạy cảm
- Queue list: hiển thị progress bar, trạng thái, before/after size
- Button **"Bắt đầu Squeeze"** → trigger `startProcessing()`
- Button **"Lưu toàn bộ"** → download tất cả file đã nén

### Compression targets

| Format | Encoder | Quality default | Ghi chú |
|---|---|---|---|
| JPEG | MozJPEG | 82 | Progressive, chroma 4:2:0 |
| PNG | pngquant | lossy level 2 | Kết hợp oxipng |
| WebP | libvips method 6 | 80 | Lossless cho logo/icon |
| AVIF | libavif | 60 | Nhỏ hơn WebP 20-30% |

---

## 2. Watermark Tab

- Loại: **Text** hoặc **Logo PNG**
- Text WM: nội dung, màu (white/black/indigo), opacity slider
- Position picker: grid 3×3 (9 điểm neo), default = bottom-right
- Padding từ mép: 20px default
- Toggle enable/disable

---

## 3. SEO Tab

### File Renamer
- Template: `{name}-{size}` (có thể dùng `{index}`, `{date}`)
- Auto-slug: `"Ảnh Sản Phẩm Mới.JPG"` → `"anh-san-pham-moi-800x600.webp"`

### EXIF Handler
- Strip tất cả EXIF nhạy cảm (GPS, thiết bị, phần mềm)
- Nhúng IPTC Copyright (tên tác giả / website)

---

## 4. Stats Tab

| Metric | Mô tả |
|---|---|
| Dung lượng tiết kiệm | Tổng bytes giảm được |
| Tổng ảnh đã xử lý | Session + history |
| Ước tính load time | Cải thiện PageSpeed |

Bảng lịch sử: Thời gian, Số file, Dung lượng giảm, Định dạng.

---

## 5. Settings Tab

| Setting | Mặc định |
|---|---|
| Output folder | `~/Pictures/ImageSqueezer_Export` |
| Hỏi folder mỗi lần | Off |
| Theme | Light / Dark / System |
| Concurrent threads | 4 (slider 1–16) |
| Hardware acceleration | On |
| Anonymous error reporting | On |

---

## Roadmap

### v1.0 MVP ✅
- [x] Drag & Drop compress JPEG/PNG/WebP
- [x] Batch queue (max 20)
- [x] Watermark text + logo
- [x] SEO rename slug
- [x] Strip EXIF
- [x] Stats dashboard

### v1.5 SEO Pro
- [ ] AVIF output
- [ ] Responsive srcset generator (1920/1024/768/300px)
- [ ] Alt text AI suggestion
- [ ] Watch folder mode
- [ ] CLI interface

### v2.0 Power
- [ ] Remove background (AI)
- [ ] Smart crop với face detection
- [ ] Plugin system
- [ ] Cloud preset sync
