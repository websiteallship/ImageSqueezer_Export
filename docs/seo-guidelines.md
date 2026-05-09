# SEO Guidelines — ImageSqueezer

## 1. File Naming (Slug Rules)

### Quy tắc slug

```
Input:  "Ảnh Sản Phẩm Mới 2024.JPG"
Output: "anh-san-pham-moi-2024.webp"
```

- Lowercase toàn bộ
- Bỏ dấu tiếng Việt (unicode → ASCII)
- Thay khoảng trắng và ký tự đặc biệt → `-`
- Không có `--` (double dash)
- Không bắt đầu/kết thúc bằng `-`
- Đổi extension theo output format

### Template variables

| Variable | Ví dụ | Ghi chú |
|---|---|---|
| `{name}` | `anh-san-pham` | Tên gốc đã slug |
| `{size}` | `1920x1080` | Kích thước pixel |
| `{index}` | `001`, `002` | Số thứ tự (3 digits) |
| `{date}` | `2024-05` | YYYY-MM |

**Default template:** `{name}-{size}`

---

## 2. Output Formats (SEO Priority)

| Format | Khuyến nghị | Use case |
|---|---|---|
| **WebP** | ✅ Ưu tiên | Ảnh tự nhiên, hero images |
| **AVIF** | ✅ Modern browsers | Nén tốt nhất, Chrome 85+ |
| **JPEG** | Fallback | Tương thích rộng |
| **PNG** | Logo/icon có alpha | Lossless quality |

> **Google khuyến nghị WebP** cho tất cả ảnh web. AVIF nhỏ hơn WebP 20-30% nhưng encode chậm hơn.

---

## 3. Compression Quality Targets

| Format | Quality | Lý do |
|---|---|---|
| JPEG | **82** | Ngưỡng vàng — mắt không phân biệt vs 100 |
| WebP | **80** | Tương đương JPEG 82, nhỏ hơn 25-35% |
| AVIF | **60** | Tương đương WebP 80 |
| PNG | pngquant level 2 | Giảm 60-80% |

**Mục tiêu giảm kích thước:** 60–80% so với gốc.

---

## 4. EXIF / Metadata

### Strip (mặc định ON)
Xóa để giảm file size và bảo mật:
- GPS coordinates
- Camera model, firmware
- Software editor (Photoshop, Lightroom)
- Thumbnail embedded
- Date/time chụp

### Giữ lại (SEO-relevant)
- `ImageDescription` / Alt text equivalent
- `Copyright` / `CopyrightNotice`
- `Artist` / Author

### Nhúng IPTC Copyright
```
Copyright: © 2024 YourWebsite.com
Creator: Your Name
Rights: All rights reserved
```

---

## 5. Responsive Images

Output cho mỗi ảnh gốc (v1.5):

```
original.jpg          (1920px — desktop)
original-md.jpg       (1024px — tablet)
original-sm.jpg       (768px  — mobile)
original-thumb.jpg    (300px  — thumbnail)
```

Generated `<picture>` HTML:
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg"
       srcset="image-sm.jpg 768w, image-md.jpg 1024w, image.jpg 1920w"
       sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
       alt="Mô tả ảnh"
       loading="lazy"
       width="1920" height="1080">
</picture>
```

---

## 6. Alt Text Best Practices

- Mô tả nội dung ảnh, không phải decorative
- Bao gồm từ khóa tự nhiên
- Dưới 125 ký tự
- Không bắt đầu bằng "image of" hay "photo of"
- Ảnh decorative: `alt=""`

**Ví dụ:**
```
❌ alt="IMG_20241015_123456.jpg"
❌ alt="ảnh sản phẩm"
✅ alt="Giày thể thao Nike Air Max 90 màu trắng, size 42"
```

---

## 7. Core Web Vitals — Image Impact

| Metric | Image rule |
|---|---|
| **LCP** | Preload hero image, dùng `fetchpriority="high"` |
| **CLS** | Luôn khai báo `width` + `height` attribute |
| **INP** | Không block render bằng large images |

**Lazy loading:** `loading="lazy"` cho tất cả ảnh below-the-fold. Không dùng lazy cho LCP image.

---

## 8. CSV Export Schema

File `image-seo-report.csv`:

```csv
original_name,new_name,original_size_kb,new_size_kb,reduction_pct,format,alt_text_suggestion,width,height
banner.jpg,banner-1920x630.webp,1200,180,85,webp,"Banner website giới thiệu dịch vụ SEO",1920,630
```

---

## 9. Checklist trước khi publish ảnh

- [ ] File size < 200KB cho ảnh nội dung, < 100KB cho thumbnail
- [ ] Tên file là slug (lowercase, no space, no special chars)
- [ ] Định dạng WebP hoặc AVIF
- [ ] EXIF nhạy cảm đã xóa
- [ ] Alt text điền đầy đủ
- [ ] Width + height khai báo trong HTML
- [ ] `loading="lazy"` (trừ LCP image)
