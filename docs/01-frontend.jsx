import React, { useState } from 'react';
import {
    UploadCloud,
    Image as ImageIcon,
    Settings,
    FileCheck2,
    Type,
    Play,
    Trash2,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    SlidersHorizontal,
    Download,
    Info,
    LayoutGrid,
    Copyright,
    Clock,
    Zap,
    FolderOpen,
    Cpu,
    RefreshCw,
    Moon,
    Monitor
} from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function App() {
    const [activeTab, setActiveTab] = useState('compress');
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Settings state
    const [outputFormat, setOutputFormat] = useState('webp');
    const [quality, setQuality] = useState(82);
    const [autoRenameSEO, setAutoRenameSEO] = useState(true);

    // File Handling with 20 items limit
    const handleAddFiles = (newFiles) => {
        setUploadError(null);
        setFiles(prev => {
            const combined = [...prev, ...newFiles];
            if (combined.length > 20) {
                setUploadError('Chỉ được phép xử lý tối đa 20 ảnh một lần. Danh sách đã được tự động cắt giảm.');
                return combined.slice(0, 20);
            }
            return combined;
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).map((file, i) => ({
                id: Date.now() + i,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'pending',
                progress: 0
            }));
            handleAddFiles(droppedFiles);
        } else {
            // Mock data nếu kéo thả element không phải file thật (để test prototype)
            addMockFile(5);
        }
    };

    const addMockFile = (count = 1) => {
        const mocks = Array.from({ length: count }).map((_, i) => ({
            id: Date.now() + i + Math.random(),
            name: `image_test_${Math.floor(Math.random() * 1000)}.jpg`,
            size: Math.floor(Math.random() * 5000000) + 500000,
            type: 'image/jpeg',
            status: 'pending',
            progress: 0
        }));
        handleAddFiles(mocks);
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
        setUploadError(null);
    };

    const clearAll = () => {
        setFiles([]);
        setUploadError(null);
    };

    // Mock processing logic
    const startProcessing = () => {
        if (files.length === 0) return;
        setIsProcessing(true);

        let currentFiles = [...files];
        let processedCount = 0;

        currentFiles.forEach((file, index) => {
            if (file.status === 'success') {
                processedCount++;
                return;
            }

            setTimeout(() => {
                const updateProgress = setInterval(() => {
                    setFiles(prev => prev.map(f => {
                        if (f.id === file.id && f.progress < 100) {
                            return { ...f, progress: f.progress + 20, status: 'processing' };
                        }
                        return f;
                    }));
                }, 100);

                setTimeout(() => {
                    clearInterval(updateProgress);
                    setFiles(prev => prev.map(f => {
                        if (f.id === file.id) {
                            const reduction = (Math.random() * 0.25) + 0.60;
                            const newSize = Math.floor(f.size * (1 - reduction));

                            let newName = f.name;
                            if (autoRenameSEO) {
                                newName = newName.toLowerCase().replace(/ /g, '-').replace('.jpg', `.${outputFormat}`).replace('.png', `.${outputFormat}`);
                            } else {
                                newName = newName.replace(/\.[^/.]+$/, "") + `.${outputFormat}`;
                            }

                            return {
                                ...f,
                                status: 'success',
                                progress: 100,
                                newSize: newSize,
                                newName: newName,
                                saved: f.size - newSize
                            };
                        }
                        return f;
                    }));
                    processedCount++;
                    if (processedCount === currentFiles.length) {
                        setIsProcessing(false);
                    }
                }, 600 + (index * 200));

            }, index * 400);
        });
    };

    const totalSaved = files.reduce((acc, f) => acc + (f.saved || 0), 0);

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">

            {/* SIDEBAR LFT */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10">
                <div className="p-5 flex items-center gap-3 border-b border-slate-800">
                    <div className="bg-indigo-500 p-2 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-lg tracking-wide">ImageSqueezer</h1>
                        <p className="text-xs text-slate-400">SEO Optimizer Pro</p>
                    </div>
                </div>

                <nav className="flex-1 py-4">
                    <ul className="space-y-1 px-3">
                        {[
                            { id: 'compress', icon: UploadCloud, label: 'Nén Ảnh' },
                            { id: 'watermark', icon: Type, label: 'Watermark' },
                            { id: 'seo', icon: FileCheck2, label: 'Tối ưu SEO' },
                            { id: 'stats', icon: BarChart3, label: 'Thống kê' },
                        ].map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === item.id
                                            ? 'bg-indigo-600 text-white font-medium shadow-md'
                                            : 'hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'settings'
                                ? 'bg-indigo-600 text-white font-medium shadow-md'
                                : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Cài đặt chung
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        {activeTab === 'compress' && <><UploadCloud className="w-6 h-6 text-indigo-600" /> Nén & Tối ưu ảnh</>}
                        {activeTab === 'watermark' && <><Type className="w-6 h-6 text-indigo-600" /> Đóng dấu bản quyền</>}
                        {activeTab === 'seo' && <><FileCheck2 className="w-6 h-6 text-indigo-600" /> Cấu hình SEO</>}
                        {activeTab === 'stats' && <><BarChart3 className="w-6 h-6 text-indigo-600" /> Thống kê hiệu quả</>}
                        {activeTab === 'settings' && <><Settings className="w-6 h-6 text-indigo-600" /> Cài đặt hệ thống</>}
                    </h2>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                        {totalSaved > 0 && (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Tiết kiệm được {formatBytes(totalSaved)}
                            </span>
                        )}
                    </div>
                </header>

                {/* 1. VIEW: NÉN ẢNH */}
                {activeTab === 'compress' && (
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        {/* Vùng làm việc chính */}
                        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">

                            {uploadError && (
                                <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <span className="text-sm font-medium">{uploadError}</span>
                                    </div>
                                    <button onClick={() => setUploadError(null)} className="text-amber-500 hover:text-amber-700">✕</button>
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col">
                                {/* Dropzone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => addMockFile(3)}
                                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isDragging
                                            ? 'border-indigo-500 bg-indigo-50 scale-[1.01] shadow-inner'
                                            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="bg-indigo-100 p-4 rounded-full mb-4">
                                        <UploadCloud className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">Kéo thả tối đa 20 ảnh vào đây</h3>
                                    <p className="text-slate-500 text-sm mb-4">hoặc click để chọn file từ máy tính</p>
                                    <div className="flex gap-2 text-xs font-medium text-slate-500">
                                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">JPEG</span>
                                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">PNG</span>
                                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">WebP</span>
                                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">AVIF</span>
                                    </div>
                                </div>

                                {/* Queue List */}
                                {files.length > 0 && (
                                    <div className="mt-6 flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                                Danh sách chờ <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{files.length}/20</span>
                                            </h4>
                                            <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700 font-medium">Xóa tất cả</button>
                                        </div>

                                        <div className="overflow-y-auto flex-1 p-2">
                                            {files.map(file => (
                                                <div key={file.id} className="group flex items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">

                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg mr-4 flex items-center justify-center shrink-0 border border-slate-200">
                                                        <ImageIcon className="w-6 h-6 text-slate-400" />
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-baseline justify-between mb-1">
                                                            <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>
                                                                {file.status === 'success' ? file.newName : file.name}
                                                            </p>
                                                            {file.status === 'success' && (
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">
                                                                    -{Math.round((file.saved / file.size) * 100)}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                <span>{formatBytes(file.size)}</span>
                                                                {file.status === 'success' && (
                                                                    <>
                                                                        <span className="text-slate-300">→</span>
                                                                        <span className="font-semibold text-emerald-600">{formatBytes(file.newSize)}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {file.status === 'processing' && <span className="text-indigo-500 font-medium animate-pulse">Đang nén...</span>}
                                                        </div>

                                                        {/* Progress Bar */}
                                                        {(file.status === 'processing' || file.status === 'pending') && (
                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                                                <div
                                                                    className={`h-1.5 rounded-full transition-all duration-300 ease-out ${file.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                    style={{ width: `${file.progress}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="shrink-0 flex items-center justify-center w-8">
                                                        {file.status === 'success' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        ) : file.status === 'processing' ? (
                                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

                        {/* Panel Cấu hình bên phải */}
                        <div className="w-full lg:w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)] z-0">
                            <div className="p-5 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Cấu hình đầu ra
                                </h3>
                            </div>

                            <div className="p-5 space-y-6 overflow-y-auto flex-1">

                                {/* Format selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Định dạng ảnh</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['webp', 'avif', 'jpeg', 'png'].map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => setOutputFormat(fmt)}
                                                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${outputFormat === fmt
                                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                    }`}
                                            >
                                                {fmt.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    {outputFormat === 'avif' && (
                                        <p className="text-[11px] text-amber-600 mt-2 flex items-start gap-1.5 bg-amber-50 p-2 rounded-md border border-amber-100">
                                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> AVIF nén tốt nhất nhưng tốn nhiều thời gian xử lý hơn.
                                        </p>
                                    )}
                                    {outputFormat === 'png' && (
                                        <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Sẽ sử dụng pngquant để tối ưu Lossy PNG (giảm 60-80%).
                                        </p>
                                    )}
                                </div>

                                {/* Quality slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-slate-700">Chất lượng (Quality)</label>
                                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{quality}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value)}
                                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
                                        <span>Nhỏ nhất (Mờ)</span>
                                        <span>Cân bằng (82%)</span>
                                        <span>Nét nhất (Nặng)</span>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* SEO Toggles */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        Cài đặt SEO nhanh
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-xl transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={autoRenameSEO}
                                                onChange={(e) => setAutoRenameSEO(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-slate-700">Đổi tên file chuẩn SEO</span>
                                                <span className="block text-[11px] text-slate-500 mt-1">Xóa dấu, khoảng trắng. Đổi thành `slug`.</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-xl transition-colors">
                                            <input
                                                type="checkbox"
                                                defaultChecked={true}
                                                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-slate-700">Xóa siêu dữ liệu (EXIF)</span>
                                                <span className="block text-[11px] text-slate-500 mt-1">Xóa thông tin Camera, GPS để bảo mật.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                            </div>

                            {/* Action Button */}
                            <div className="p-5 border-t border-slate-100 bg-white z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]">
                                <button
                                    onClick={startProcessing}
                                    disabled={files.length === 0 || isProcessing}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white transition-all ${files.length === 0
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : isProcessing
                                                ? 'bg-indigo-400 cursor-wait'
                                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                                            Đang ép ảnh...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 fill-current" />
                                            Bắt đầu Squeeze {files.length > 0 ? `(${files.length})` : ''}
                                        </>
                                    )}
                                </button>

                                {files.some(f => f.status === 'success') && !isProcessing && (
                                    <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors">
                                        <Download className="w-4 h-4" />
                                        Lưu toàn bộ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. VIEW: WATERMARK */}
                {activeTab === 'watermark' && (
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Cấu hình Watermark</h3>
                                        <p className="text-sm text-slate-500">Chèn logo hoặc đoạn văn bản hàng loạt vào ảnh</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-700">Kích hoạt</span>
                                    </label>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Loại Watermark</label>
                                            <select className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow">
                                                <option>Văn bản (Text)</option>
                                                <option>Hình ảnh (Logo PNG)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung văn bản</label>
                                            <input
                                                type="text"
                                                defaultValue="© 2024 Bản quyền Website"
                                                className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Màu sắc</label>
                                                <div className="flex gap-2">
                                                    <button className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 focus:ring-2 ring-offset-2 ring-indigo-500"></button>
                                                    <button className="w-8 h-8 rounded-full bg-black border-2 border-transparent focus:ring-2 ring-offset-2 ring-indigo-500"></button>
                                                    <button className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-transparent focus:ring-2 ring-offset-2 ring-indigo-500"></button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Độ trong suốt</label>
                                                <input type="range" className="w-full accent-indigo-600 mt-1" defaultValue="70" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center">
                                        <label className="block text-sm font-bold text-slate-700 mb-4 self-start flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4" /> Vị trí neo (Position)
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 w-48 aspect-square bg-slate-200 p-2 rounded-xl border border-slate-300">
                                            {[...Array(9)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`rounded-lg transition-all ${i === 8
                                                            ? 'bg-indigo-500 shadow-inner'
                                                            : 'bg-white hover:bg-slate-100 border border-slate-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-6 text-center">
                                            Mặc định hiển thị ở góc dưới cùng bên phải. <br />Cách mép ảnh 20px.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. VIEW: SEO */}
                {activeTab === 'seo' && (
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800">Quy tắc đặt tên (File Renamer)</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Template Tên File</label>
                                        <input
                                            type="text"
                                            defaultValue="{name}-{size}"
                                            className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-sm text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-200">`{"{name}"}`: tên gốc slug</span>
                                            <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-200">`{"{size}"}`: độ phân giải</span>
                                            <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-200">`{"{index}"}`: số thứ tự</span>
                                            <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-200">`{"{date}"}`: ngày tháng</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <p className="text-sm text-slate-600 mb-1">Ví dụ trước/sau:</p>
                                        <p className="font-mono text-xs line-through text-slate-400">Anh San Pham Moi 2024.JPG</p>
                                        <p className="font-mono text-xs text-emerald-600 font-bold mt-1">anh-san-pham-moi-2024-800x600.webp</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800">Xử lý Metadata (EXIF)</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-700">Loại bỏ toàn bộ EXIF nhạy cảm</span>
                                            <span className="block text-xs text-slate-500 mt-0.5">Xóa thông tin định vị GPS, thiết bị chụp ảnh, phần mềm chỉnh sửa (Giảm thiểu thêm 2-5KB mỗi ảnh).</span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                                        <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-700">Nhúng thông tin Bản quyền (IPTC)</span>
                                            <span className="block text-xs text-slate-500 mt-0.5 mb-2">Thêm tên tác giả và website vào siêu dữ liệu ảnh để bảo vệ bản quyền.</span>
                                            <input type="text" placeholder="Tên tác giả hoặc Website" className="w-full max-w-sm border border-slate-300 rounded-md p-1.5 text-sm outline-none" />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. VIEW: THỐNG KÊ */}
                {activeTab === 'stats' && (
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
                        <div className="max-w-5xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                Thống kê hiệu năng toàn cục
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Download className="w-16 h-16" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Dung lượng đã tiết kiệm</p>
                                    <p className="text-4xl font-black text-emerald-600 mt-3 tracking-tight">1.84 <span className="text-xl">GB</span></p>
                                    <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded mt-3 font-medium">Tương đương 38% băng thông</p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ImageIcon className="w-16 h-16" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Tổng ảnh đã xử lý</p>
                                    <p className="text-4xl font-black text-indigo-600 mt-3 tracking-tight">2,450</p>
                                    <p className="text-xs text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded mt-3 font-medium">Trong tháng này</p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Clock className="w-16 h-16" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Thời gian Load web (Ước tính)</p>
                                    <p className="text-4xl font-black text-amber-500 mt-3 tracking-tight">-1.2<span className="text-xl">s</span></p>
                                    <p className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded mt-3 font-medium">Cải thiện điểm Google PageSpeed</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h4 className="font-bold text-slate-800 mb-4">Lịch sử xử lý gần đây</h4>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100">
                                            <th className="pb-3 font-medium">Thời gian</th>
                                            <th className="pb-3 font-medium">Tệp tải lên</th>
                                            <th className="pb-3 font-medium">Dung lượng giảm</th>
                                            <th className="pb-3 font-medium">Định dạng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-600">
                                        <tr className="border-b border-slate-50">
                                            <td className="py-3">10 phút trước</td>
                                            <td className="py-3 font-medium text-slate-800">12 ảnh sản phẩm</td>
                                            <td className="py-3 text-emerald-600 font-medium">- 4.2 MB (65%)</td>
                                            <td className="py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">WEBP</span></td>
                                        </tr>
                                        <tr className="border-b border-slate-50">
                                            <td className="py-3">Hôm qua</td>
                                            <td className="py-3 font-medium text-slate-800">Banner Homepage</td>
                                            <td className="py-3 text-emerald-600 font-medium">- 1.8 MB (82%)</td>
                                            <td className="py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">AVIF</span></td>
                                        </tr>
                                        <tr>
                                            <td className="py-3">22/10/2023</td>
                                            <td className="py-3 font-medium text-slate-800">5 ảnh bài viết Blog</td>
                                            <td className="py-3 text-emerald-600 font-medium">- 2.1 MB (55%)</td>
                                            <td className="py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">PNG</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. VIEW: CÀI ĐẶT CHUNG (SETTINGS) */}
                {activeTab === 'settings' && (
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
                        <div className="max-w-3xl mx-auto space-y-6">

                            {/* Thư mục lưu mặc định */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-slate-800">Lưu trữ & Thư mục</h3>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Thư mục xuất file mặc định</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            readOnly
                                            value="C:\Users\Admin\Pictures\ImageSqueezer_Export"
                                            className="flex-1 border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-600 font-mono text-sm outline-none cursor-default"
                                        />
                                        <button className="bg-white border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm">
                                            Đổi thư mục
                                        </button>
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer mt-4">
                                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                        <span className="text-sm font-medium text-slate-700">Luôn hỏi thư mục lưu sau mỗi lần nén (Tắt lưu tự động)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Tùy chỉnh Giao diện */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                    <Monitor className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-slate-800">Cá nhân hóa giao diện</h3>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Chế độ hiển thị (Theme)</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 text-indigo-700 font-medium">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm mb-2">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            Sáng (Light)
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition-colors">
                                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-300">
                                                <Moon className="w-5 h-5" />
                                            </div>
                                            Tối (Dark)
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition-colors">
                                            <div className="w-10 h-10 bg-gradient-to-br from-white to-slate-800 rounded-full flex items-center justify-center shadow-sm mb-2 border">
                                                <RefreshCw className="w-5 h-5 text-slate-600" />
                                            </div>
                                            Theo hệ thống
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Hệ thống & Hiệu năng */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                    <Cpu className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-slate-800">Hệ thống & Hiệu năng</h3>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-bold text-slate-700">Giới hạn luồng xử lý đồng thời (Concurrent Threads)</label>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">4 Luồng</span>
                                        </div>
                                        <input type="range" min="1" max="16" defaultValue="4" className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1">
                                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            Tăng luồng giúp xử lý lô lớn nhanh hơn, nhưng sẽ tiêu tốn nhiều CPU hơn. Mặc định là số core của CPU hiện tại.
                                        </p>
                                    </div>

                                    <hr className="border-slate-100" />

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-700">Tăng tốc phần cứng (Hardware Acceleration)</span>
                                            <span className="block text-[11px] text-slate-500 mt-1">Sử dụng GPU để xử lý UI và một số tác vụ nén ảnh nhất định, giúp ứng dụng mượt mà hơn.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-700">Tự động báo cáo lỗi ẩn danh</span>
                                            <span className="block text-[11px] text-slate-500 mt-1">Gửi log lỗi về server để giúp lập trình viên cải thiện ứng dụng (Không gửi bất kỳ dữ liệu ảnh nào).</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}