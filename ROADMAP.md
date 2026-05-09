# Roadmap — ImageSqueezer

Dự án chia làm 3 giai đoạn chính.

## 🎯 v1.0 — MVP (Hoàn thành)
- [x] Thiết kế UI / UX tĩnh (React + Tailwind).
- [x] Tích hợp Electron Main ↔ Renderer IPC.
- [x] Core: Kéo thả, xử lý Batch Queue (max 20 file).
- [x] Core: Nén JPEG, PNG, WebP với Sharp.
- [x] Watermark: Text & Logo cơ bản.
- [x] SEO: Đổi tên slug, xóa EXIF nhạy cảm.
- [x] Thống kê: Dashboard tính dung lượng tiết kiệm.

## 🚀 v1.5 — SEO Pro (Current Focus)
- [x] Tích hợp nén AVIF.
- [ ] Trình tạo tự động Responsive `srcset` (1920/1024/768/300px).
- [ ] Chế độ "Watch Folder" - tự động nén khi có file mới ném vào.
- [ ] Giao diện dòng lệnh (CLI interface).
- [ ] AI Alt-Text Generator (Gợi ý mô tả ảnh tự động).

## ⚡ v2.0 — Power Features
- [ ] Xóa phông nền tự động (Remove background AI).
- [ ] Smart Crop (Tự động crop giữ khuôn mặt / chủ thể).
- [ ] Hệ thống Cloud Sync cho Preset cá nhân/Team.
- [ ] Plugin xuất trực tiếp từ Figma / Photoshop.
