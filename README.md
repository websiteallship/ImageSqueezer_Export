# 🖼️ ImageSqueezer
![Version 1.0](https://img.shields.io/badge/Version-1.0%20MVP-success) ![Electron](https://img.shields.io/badge/Electron-Desktop-blue)

Công cụ Desktop đa nền tảng tối ưu và nén ảnh hàng loạt chuẩn SEO cho Website. Nhanh, an toàn (xử lý local), và hoàn toàn miễn phí.

## ✨ Tính năng cốt lõi
- **Nén đa định dạng**: WebP, AVIF, JPEG, PNG (sử dụng Sharp, MozJPEG, pngquant).
- **SEO Renamer**: Tự động chuyển đổi tên file sang định dạng `slug` thân thiện với bộ máy tìm kiếm.
- **Quản lý Metadata**: Tự động xóa EXIF nhạy cảm, nhúng IPTC Copyright.
- **Đóng dấu bản quyền (Watermark)**: Text & Logo PNG với lưới neo 9 vị trí.
- **Xử lý lô lớn (Batch Processing)**: Kéo thả nhiều file, xử lý song song đa luồng.

## 🧱 Tech Stack
- **Framework**: Electron (Node.js) + React + Tailwind CSS
- **Core Processing**: Sharp (libvips)
- **Metadata**: exiftool-vendored
- **Icons**: lucide-react

## 🚀 Cài đặt & Phát triển

### Yêu cầu
- Node.js >= 18.x

### Khởi chạy
```bash
# Cài đặt dependencies
npm install

# Rebuild native modules (bắt buộc cho Sharp trên Electron)
npm run rebuild

# Chạy development server
npm run dev

# Đóng gói ứng dụng (Windows/macOS/Linux)
npm run build
```

## 📖 Tài liệu
Xem thư mục `/docs` hoặc `.agent/rules` để nắm rõ cấu trúc kiến trúc, tiêu chuẩn UI và chuẩn nén SEO.
