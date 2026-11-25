/**
 * IP TOOLS - Utility Functions
 * Unit conversions, DPI manipulation, file helpers, and formatters
 */

const Utils = {
    // Standard conversion factors relative to 1 inch
    MM_PER_INCH: 25.4,
    CM_PER_INCH: 2.54,
    POINTS_PER_INCH: 72,

    /**
     * Convert value between units (px, cm, mm, inch) based on DPI
     */
    convertUnit(value, fromUnit, toUnit, dpi = 300) {
        if (value === null || value === undefined || isNaN(value)) return 0;
        const val = parseFloat(value);
        if (fromUnit === toUnit) return val;

        // Convert to inches first
        let inches = 0;
        switch (fromUnit) {
            case 'px':
                inches = val / dpi;
                break;
            case 'cm':
                inches = val / this.CM_PER_INCH;
                break;
            case 'mm':
                inches = val / this.MM_PER_INCH;
                break;
            case 'inch':
            case 'in':
                inches = val;
                break;
            case 'pt':
                inches = val / this.POINTS_PER_INCH;
                break;
            default:
                inches = val / dpi;
        }

        // Convert from inches to target unit
        let result = 0;
        switch (toUnit) {
            case 'px':
                result = Math.round(inches * dpi);
                break;
            case 'cm':
                result = inches * this.CM_PER_INCH;
                break;
            case 'mm':
                result = inches * this.MM_PER_INCH;
                break;
            case 'inch':
            case 'in':
                result = inches;
                break;
            case 'pt':
                result = inches * this.POINTS_PER_INCH;
                break;
            default:
                result = inches * dpi;
        }

        // Round physical units to 2 decimals, px to integers
        if (toUnit === 'px') {
            return Math.max(1, Math.round(result));
        } else {
            return parseFloat(result.toFixed(2));
        }
    },

    /**
     * Format byte sizes into readable string
     */
    formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Read a File as Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    },

    /**
     * Read a File as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Load an Image element from a source URL or Data URL
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
            img.src = src;
        });
    },

    /**
     * Trigger browser download for a Blob
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * Trigger browser download for a DataURL
     */
    downloadDataUrl(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    },

    /**
     * Inject JFIF APP0 DPI metadata into JPEG binary ArrayBuffer / Blob.
     * Guarantees file headers have the specified DPI (e.g. 300 DPI) for Photoshop, printers, and Windows Explorer.
     */
    async setJpegDpi(blob, dpi = 300) {
        const buffer = await blob.arrayBuffer();
        const view = new DataView(buffer);

        // Verify JPEG SOI marker 0xFFD8
        if (view.getUint16(0) !== 0xFFD8) {
            return blob; // Not a valid JPEG, return unmodified
        }

        dpi = Math.round(dpi);
        const xDensity = dpi;
        const yDensity = dpi;

        // Check if there is an existing APP0 marker (0xFFE0) immediately after SOI
        let offset = 2;
        let hasApp0 = false;
        let app0Length = 0;

        while (offset < buffer.byteLength - 4) {
            const marker = view.getUint16(offset);
            if (marker === 0xFFE0) {
                // Found existing APP0
                hasApp0 = true;
                app0Length = view.getUint16(offset + 2);
                break;
            } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
                // Another marker encountered
                break;
            }
            offset++;
        }

        if (hasApp0 && offset === 2 && app0Length >= 14) {
            // Check for JFIF identifier "JFIF\0"
            const isJfif = 
                view.getUint8(offset + 4) === 0x4A && // J
                view.getUint8(offset + 5) === 0x46 && // F
                view.getUint8(offset + 6) === 0x49 && // I
                view.getUint8(offset + 7) === 0x46 && // F
                view.getUint8(offset + 8) === 0x00;   // \0

            if (isJfif) {
                // Update in place!
                // Units: 1 = dots per inch
                view.setUint8(offset + 11, 1);
                // Xdensity (2 bytes)
                view.setUint16(offset + 12, xDensity, false);
                // Ydensity (2 bytes)
                view.setUint16(offset + 14, yDensity, false);
                return new Blob([buffer], { type: 'image/jpeg' });
            }
        }

        // If no JFIF APP0, insert a fresh 18-byte JFIF APP0 marker right after SOI (0xFFD8)
        // APP0 structure:
        // 0xFF, 0xE0, (Length: 0x00, 0x10), 'J','F','I','F',0x00, 0x01, 0x02, (units: 0x01), (xdensity 2 bytes), (ydensity 2 bytes), 0x00, 0x00
        const jfifMarker = new Uint8Array([
            0xFF, 0xE0, // APP0 marker
            0x00, 0x10, // Length: 16 bytes
            0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
            0x01, 0x02, // Version 1.2
            0x01,       // Density unit: 1 = DPI
            (xDensity >> 8) & 0xFF, xDensity & 0xFF, // X Density
            (yDensity >> 8) & 0xFF, yDensity & 0xFF, // Y Density
            0x00,       // Thumbnail width
            0x00        // Thumbnail height
        ]);

        const newLength = 2 + jfifMarker.length + (buffer.byteLength - 2);
        const newArray = new Uint8Array(newLength);
        newArray.set(new Uint8Array(buffer, 0, 2), 0); // SOI
        newArray.set(jfifMarker, 2); // JFIF header
        newArray.set(new Uint8Array(buffer, 2), 2 + jfifMarker.length); // Rest of image

        return new Blob([newArray], { type: 'image/jpeg' });
    },

    /**
     * Inject pHYs chunk into PNG for DPI embedding
     */
    async setPngDpi(blob, dpi = 300) {
        const buffer = await blob.arrayBuffer();
        const view = new DataView(buffer);

        // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
            return blob; // Not PNG
        }

        // Pixels per meter: 1 inch = 0.0254 m
        const ppm = Math.round(dpi / 0.0254);

        // Find IHDR chunk length and position
        const ihdrLength = view.getUint32(8);
        const ihdrEnd = 8 + 4 + ihdrLength + 4 + 4; // length(4) + type(4) + data(ihdrLength) + crc(4)

        // Build pHYs chunk:
        // Length: 9 bytes
        // Type: "pHYs" (0x70 0x48 0x59 0x73)
        // Data: 4 bytes X ppm, 4 bytes Y ppm, 1 byte unit specifier (1 = meter)
        // CRC: 4 bytes
        const physData = new Uint8Array(13);
        const physView = new DataView(physData.buffer);
        physView.setUint8(0, 0x70); // 'p'
        physView.setUint8(1, 0x48); // 'H'
        physView.setUint8(2, 0x59); // 'Y'
        physView.setUint8(3, 0x73); // 's'
        physView.setUint32(4, ppm, false);
        physView.setUint32(8, ppm, false);
        physView.setUint8(12, 1); // unit: meter

        const crc = this.crc32(physData);

        const physChunk = new Uint8Array(21);
        const chunkView = new DataView(physChunk.buffer);
        chunkView.setUint32(0, 9, false); // chunk data length: 9 bytes
        physChunk.set(physData, 4);
        chunkView.setUint32(17, crc, false); // CRC

        // Create new PNG with pHYs chunk inserted right after IHDR
        const result = new Uint8Array(buffer.byteLength + physChunk.length);
        result.set(new Uint8Array(buffer, 0, ihdrEnd), 0);
        result.set(physChunk, ihdrEnd);
        result.set(new Uint8Array(buffer, ihdrEnd), ihdrEnd + physChunk.length);

        return new Blob([result], { type: 'image/png' });
    },

    /**
     * Convert canvas to Blob with DPI metadata injected
     */
    canvasToDpiBlob(canvas, format = 'image/jpeg', quality = 0.92, dpi = 300) {
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                let finalBlob = blob;
                if (format === 'image/jpeg') {
                    finalBlob = await this.setJpegDpi(blob, dpi);
                } else if (format === 'image/png') {
                    finalBlob = await this.setPngDpi(blob, dpi);
                }
                resolve(finalBlob);
            }, format, quality);
        });
    },

    /**
     * Export a canvas under a dedicated / target file size in bytes.
     * Uses binary search on compression quality first (preserving exact dimensions),
     * and only scales down dimensions if minimum quality still exceeds the target size.
     */
    async canvasToTargetSizeBlob(canvas, format = 'image/jpeg', targetBytes = 102400, dpi = 300) {
        targetBytes = Math.max(1024, Math.round(targetBytes));
        const isLossy = (format === 'image/jpeg' || format === 'image/webp');

        const binarySearchQuality = async (cvs) => {
            // Check high quality first
            const maxBlob = await this.canvasToDpiBlob(cvs, format, 0.98, dpi);
            if (!maxBlob) return null;
            if (maxBlob.size <= targetBytes) {
                return { blob: maxBlob, quality: 0.98, fits: true };
            }

            if (!isLossy) {
                return { blob: maxBlob, quality: 1.0, fits: false };
            }

            // Check lowest readable quality
            const minQ = 0.04;
            const minBlob = await this.canvasToDpiBlob(cvs, format, minQ, dpi);
            if (!minBlob) return null;
            if (minBlob.size > targetBytes) {
                return { blob: minBlob, quality: minQ, fits: false };
            }

            // Binary search between minQ and 0.98 for highest quality <= targetBytes
            let low = minQ;
            let high = 0.98;
            let bestBlob = minBlob;
            let bestQuality = minQ;

            for (let i = 0; i < 10; i++) {
                const mid = (low + high) / 2;
                const midBlob = await this.canvasToDpiBlob(cvs, format, mid, dpi);
                if (!midBlob) break;

                if (midBlob.size <= targetBytes) {
                    bestBlob = midBlob;
                    bestQuality = mid;
                    low = mid;
                } else {
                    high = mid;
                }

                // Stop early if within 1.5% of target size
                if (bestBlob.size <= targetBytes && (targetBytes - bestBlob.size) / targetBytes < 0.015) {
                    break;
                }
            }

            return { blob: bestBlob, quality: bestQuality, fits: true };
        };

        // Pass 1: Keep exact canvas dimensions
        let attempt = await binarySearchQuality(canvas);
        if (!attempt) return null;
        if (attempt.fits) {
            return {
                blob: attempt.blob,
                quality: attempt.quality,
                width: canvas.width,
                height: canvas.height,
                scaled: false
            };
        }

        // Pass 2: Progressively downscale if even min quality (or lossless PNG) exceeds targetBytes
        let curW = canvas.width;
        let curH = canvas.height;
        let lastBlob = attempt.blob;
        let lastQuality = attempt.quality;

        for (let step = 0; step < 8; step++) {
            const ratio = Math.sqrt(targetBytes / lastBlob.size) * 0.92;
            const factor = Math.max(0.35, Math.min(0.88, ratio));
            curW = Math.max(16, Math.round(curW * factor));
            curH = Math.max(16, Math.round(curH * factor));

            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = curW;
            scaledCanvas.height = curH;
            const sctx = scaledCanvas.getContext('2d');
            sctx.imageSmoothingEnabled = true;
            sctx.imageSmoothingQuality = 'high';
            if (format === 'image/jpeg') {
                sctx.fillStyle = '#FFFFFF';
                sctx.fillRect(0, 0, curW, curH);
            }
            sctx.drawImage(canvas, 0, 0, curW, curH);

            attempt = await binarySearchQuality(scaledCanvas);
            if (!attempt) break;
            lastBlob = attempt.blob;
            lastQuality = attempt.quality;

            if (attempt.fits) {
                return {
                    blob: lastBlob,
                    quality: lastQuality,
                    width: curW,
                    height: curH,
                    scaled: true
                };
            }
        }

        return {
            blob: lastBlob,
            quality: lastQuality,
            width: curW,
            height: curH,
            scaled: true
        };
    },

    /**
     * Simple CRC32 for PNG chunks
     */
    crc32(buf) {
        let crc = -1;
        for (let i = 0; i < buf.length; i++) {
            crc ^= buf[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
            }
        }
        return (crc ^ (-1)) >>> 0;
    },

    /**
     * Standard Toast Notification UI
     */
    toast(message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="toast-text">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Prompt user for a file name via sleek modal before downloading.
     * Returns full filename with extension (e.g. "custom.jpg") or null if cancelled.
     */
    promptFilename(defaultBaseName = 'output', ext = 'jpg', title = 'Save File As') {
        const cleanExt = ext.replace(/^\./, '');
        const sanitize = (rawName) => {
            let name = (rawName || '').trim();
            // Strip matching extension if user typed it
            name = name.replace(/\.(jpe?g|png|webp|pdf)$/i, '').trim();
            // Remove invalid filesystem characters
            name = name.replace(/[\\/:*?"<>|]+/g, '_');
            return (name || defaultBaseName) + '.' + cleanExt;
        };

        const modal = document.getElementById('filename-modal');
        const titleEl = document.getElementById('filename-modal-title');
        const inputEl = document.getElementById('filename-modal-input');
        const extEl = document.getElementById('filename-modal-ext');
        const confirmBtn = document.getElementById('filename-modal-confirm');
        const cancelBtn = document.getElementById('filename-modal-cancel');
        const closeBtn = document.getElementById('filename-modal-close');

        if (!modal || !inputEl || !confirmBtn) {
            const entered = window.prompt(`${title} (.${cleanExt}):`, defaultBaseName);
            if (entered === null) return Promise.resolve(null);
            return Promise.resolve(sanitize(entered));
        }

        return new Promise((resolve) => {
            if (titleEl) titleEl.textContent = title;
            if (extEl) extEl.textContent = `.${cleanExt}`;
            inputEl.value = defaultBaseName;
            modal.classList.add('show');

            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 30);

            const cleanup = () => {
                modal.classList.remove('show');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdrop);
                inputEl.removeEventListener('keydown', onKeyDown);
            };

            const onConfirm = () => {
                const finalName = sanitize(inputEl.value);
                cleanup();
                resolve(finalName);
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };

            const onBackdrop = (e) => {
                if (e.target === modal) onCancel();
            };

            const onKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdrop);
            inputEl.addEventListener('keydown', onKeyDown);
        });
    }
};

window.Utils = Utils;
