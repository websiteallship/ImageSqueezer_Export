# Changelog

Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong tệp này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/).

## [Unreleased]

## [1.0.0] - 2026-05-09
### Added
- Hoàn thiện tính năng nén ảnh cốt lõi bằng **Sharp** chạy trong Main process (không block UI).
- Hỗ trợ nén ra các định dạng: **WebP**, **AVIF**, **JPEG**, **PNG**.
- Tích hợp **Electron IPC** (contextBridge) an toàn và typed.
- Giao diện **React + Tailwind** hoàn chỉnh cho chức năng nén ảnh:
  - Hỗ trợ Drag & Drop và File picker.
  - Hàng đợi (Queue) hiển thị trạng thái realtime.
  - Điều chỉnh cấu hình nén (format, quality).
- Xử lý Batch Compression có tính năng concurrency limit.
- Tính năng SEO: Tự động đổi tên file sang slug, xóa EXIF data nhạy cảm và thêm IPTC Copyright.
- Giao diện Watermark: Hỗ trợ chèn logo hoặc text với cấu hình font, độ mờ, vị trí và tính năng neo lưới (grid-anchored).
- Dashboard Thống kê (Stats): Theo dõi dữ liệu lịch sử các phiên xử lý (số ảnh, dung lượng tiết kiệm) và lưu trữ qua `electron-store`.
- Tab Cài đặt (Settings): Cho phép tùy chỉnh luồng xử lý đồng thời (Concurrent Threads), thư mục xuất, phần cứng (Hardware Acceleration) và tự động ghi nhớ trạng thái.
- Persistent App Settings lưu lại cấu hình qua `electron-store`.
- Setup dự án đa tiến trình (main, preload, renderer) hoàn thiện qua **electron-vite**.
- Setup hệ thống tài liệu ban đầu (`/docs` và `.agent/rules`).
- Lên cấu trúc Architecture (Electron + React).
- Định nghĩa chuẩn SEO (Naming slug, WebP ưu tiên, EXIF rules).
- Cấu trúc UI Component tĩnh với `lucide-react` và TailwindCSS.

### Changed
- Cập nhật thư viện Icon từ `@radix-ui/react-icons` sang `lucide-react` để đồng bộ thực tế code hiện tại.
- Thay thế thư viện `p-limit` (ESM) bằng giải pháp native concurrency semaphore tự custom để tương thích Main Process (CommonJS).

### Fixed
- Lỗi import alias (`@shared`) giữa main, preload và renderer thông qua vite config.
- Fix API WebP Sharp update từ `method` thành `effort` cho version 0.33.
