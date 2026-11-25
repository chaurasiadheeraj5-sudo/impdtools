/**
 * IP TOOLS - Image Resizer Module
 * Resizes images by width, height, unit (px, cm, mm, inch), DPI, quality, and output format (JPG, JPEG, PNG, WEBP).
 * Injects true JFIF DPI metadata for printing.
 */

class ImageResizer {
    constructor() {
        this.currentFiles = [];
        this.activeImageIndex = 0;
        this.loadedImages = []; // { file, img, originalW, originalH, name, size }
        this.aspectRatioLocked = true;
        this.originalRatio = 1;
        this.unit = 'px';
        this.dpi = 300;
        this.format = 'image/jpeg';
        this.quality = 0.92;
        this.enableTargetSize = false;
        this.targetSizeValue = 100;
        this.targetSizeUnit = 'KB';

        this.initDOMElements();
        this.loadSettings();
        this.bindEvents();
    }

    initDOMElements() {
        this.dropZone = document.getElementById('resizer-dropzone');
        this.fileInput = document.getElementById('resizer-file-input');
        this.editorArea = document.getElementById('resizer-editor');
        this.emptyState = document.getElementById('resizer-empty');

        this.widthInput = document.getElementById('resizer-width');
        this.heightInput = document.getElementById('resizer-height');
        this.unitSelect = document.getElementById('resizer-unit');
        this.dpiSelect = document.getElementById('resizer-dpi');
        this.customDpiGroup = document.getElementById('resizer-custom-dpi-group');
        this.customDpiInput = document.getElementById('resizer-custom-dpi');
        this.lockAspectBtn = document.getElementById('resizer-lock-aspect');
        this.formatSelect = document.getElementById('resizer-format');
        this.qualitySlider = document.getElementById('resizer-quality');
        this.qualityValDisplay = document.getElementById('resizer-quality-val');
        this.qualityGroup = document.getElementById('resizer-quality-group');

        // Dedicated / Target File Size controls
        this.enableTargetSizeCheck = document.getElementById('resizer-enable-target-size');
        this.targetSizeControls = document.getElementById('resizer-target-size-controls');
        this.targetSizeInput = document.getElementById('resizer-target-size');
        this.targetSizeUnitSelect = document.getElementById('resizer-target-size-unit');
        this.sizePresetBtns = document.querySelectorAll('.resizer-size-preset');

        this.previewCanvas = document.getElementById('resizer-canvas');
        this.origInfoBadge = document.getElementById('resizer-orig-info');
        this.targetInfoBadge = document.getElementById('resizer-target-info');
        this.downloadBtn = document.getElementById('resizer-download-btn');
        this.batchDownloadBtn = document.getElementById('resizer-batch-download-btn');
        this.doMoreBtn = document.getElementById('resizer-do-more-btn');
        this.fileTabsList = document.getElementById('resizer-file-tabs');
    }

    bindEvents() {
        if (!this.dropZone) return;

        // File drop & select
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                this.handleFiles(e.dataTransfer.files);
            }
        });

        // Unit change
        this.unitSelect.addEventListener('change', (e) => {
            const oldUnit = this.unit;
            this.unit = e.target.value;
            this.convertInputsToUnit(oldUnit, this.unit);
            this.updatePreview();
            this.saveSettings();
        });

        // DPI change
        this.dpiSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.customDpiGroup.style.display = 'block';
                this.dpi = parseInt(this.customDpiInput.value) || 300;
            } else {
                this.customDpiGroup.style.display = 'none';
                this.dpi = parseInt(e.target.value) || 300;
            }
            // Recalculate dimensions if unit is physical
            if (this.unit !== 'px') {
                this.syncInputsFromPixels();
            }
            this.updatePreview();
            this.saveSettings();
        });

        if (this.customDpiInput) {
            this.customDpiInput.addEventListener('input', () => {
                this.dpi = Math.max(1, parseInt(this.customDpiInput.value) || 300);
                if (this.unit !== 'px') {
                    this.syncInputsFromPixels();
                }
                this.updatePreview();
                this.saveSettings();
            });
        }

        // Lock aspect ratio toggle
        this.lockAspectBtn.addEventListener('click', () => {
            this.aspectRatioLocked = !this.aspectRatioLocked;
            this.lockAspectBtn.classList.toggle('active', this.aspectRatioLocked);
            const icon = this.lockAspectBtn.querySelector('.lock-icon');
            if (icon) {
                icon.textContent = this.aspectRatioLocked ? '🔒' : '🔓';
            }
            this.saveSettings();
        });

        // Width & Height inputs
        this.widthInput.addEventListener('input', () => {
            if (this.aspectRatioLocked && this.originalRatio) {
                const w = parseFloat(this.widthInput.value) || 0;
                const h = w / this.originalRatio;
                this.heightInput.value = this.unit === 'px' ? Math.round(h) : parseFloat(h.toFixed(2));
            }
            this.updatePreview();
        });

        this.heightInput.addEventListener('input', () => {
            if (this.aspectRatioLocked && this.originalRatio) {
                const h = parseFloat(this.heightInput.value) || 0;
                const w = h * this.originalRatio;
                this.widthInput.value = this.unit === 'px' ? Math.round(w) : parseFloat(w.toFixed(2));
            }
            this.updatePreview();
        });

        // Format and quality
        this.formatSelect.addEventListener('change', (e) => {
            this.format = e.target.value;
            this.qualityGroup.style.display = (this.format === 'image/png') ? 'none' : 'block';
            this.updatePreview();
            this.saveSettings();
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value) / 100;
            this.qualityValDisplay.textContent = `${e.target.value}%`;
            this.updatePreview();
            this.saveSettings();
        });

        // Target / Dedicated File Size events
        if (this.enableTargetSizeCheck) {
            this.enableTargetSizeCheck.addEventListener('change', (e) => {
                this.enableTargetSize = e.target.checked;
                this.syncTargetSizeUI();
                this.updatePreview();
                this.saveSettings();
            });
        }

        if (this.targetSizeInput) {
            this.targetSizeInput.addEventListener('input', () => {
                this.targetSizeValue = Math.max(1, parseFloat(this.targetSizeInput.value) || 100);
                this.updatePreview();
                this.saveSettings();
            });
        }

        if (this.targetSizeUnitSelect) {
            this.targetSizeUnitSelect.addEventListener('change', (e) => {
                this.targetSizeUnit = e.target.value;
                this.updatePreview();
                this.saveSettings();
            });
        }

        if (this.sizePresetBtns) {
            this.sizePresetBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const size = parseFloat(e.currentTarget.dataset.size) || 100;
                    const unit = e.currentTarget.dataset.unit || 'KB';
                    this.targetSizeValue = size;
                    this.targetSizeUnit = unit;
                    if (this.targetSizeInput) this.targetSizeInput.value = size;
                    if (this.targetSizeUnitSelect) this.targetSizeUnitSelect.value = unit;
                    this.updatePreview();
                    this.saveSettings();
                });
            });
        }

        // Presets buttons
        document.querySelectorAll('.resizer-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.preset;
                this.applyPreset(action);
            });
        });

        // Download actions
        this.downloadBtn.addEventListener('click', () => this.downloadActiveImage());
        if (this.batchDownloadBtn) {
            this.batchDownloadBtn.addEventListener('click', () => this.downloadAllImagesZip());
        }
    }

    async handleFiles(files) {
        if (!files || files.length === 0) return;
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
            Utils.toast('Please select valid image files (JPG, PNG, WEBP, etc.)', 'warning');
            return;
        }

        this.loadedImages = [];
        for (const file of validFiles) {
            try {
                const dataUrl = await Utils.readFileAsDataURL(file);
                const img = await Utils.loadImage(dataUrl);
                this.loadedImages.push({
                    file,
                    img,
                    dataUrl,
                    originalW: img.naturalWidth,
                    originalH: img.naturalHeight,
                    name: file.name,
                    size: file.size
                });
            } catch (err) {
                console.error('Error loading image', err);
            }
        }

        if (this.loadedImages.length > 0) {
            this.activeImageIndex = 0;
            this.emptyState.style.display = 'none';
            this.editorArea.style.display = 'grid';
            this.renderFileTabs();
            this.loadActiveImageToControls();
            Utils.toast(`Loaded ${this.loadedImages.length} image(s)`, 'success');
        }
    }

    renderFileTabs() {
        if (!this.fileTabsList) return;
        this.fileTabsList.innerHTML = '';
        if (this.loadedImages.length <= 1) {
            this.fileTabsList.style.display = 'none';
            if (this.batchDownloadBtn) this.batchDownloadBtn.style.display = 'none';
            return;
        }

        this.fileTabsList.style.display = 'flex';
        if (this.batchDownloadBtn) this.batchDownloadBtn.style.display = 'inline-flex';

        this.loadedImages.forEach((item, index) => {
            const tab = document.createElement('button');
            tab.className = `file-tab-btn ${index === this.activeImageIndex ? 'active' : ''}`;
            tab.innerHTML = `<span class="tab-name">${item.name}</span><span class="tab-close" data-index="${index}">&times;</span>`;
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    e.stopPropagation();
                    this.removeImage(index);
                } else {
                    this.activeImageIndex = index;
                    this.renderFileTabs();
                    this.loadActiveImageToControls();
                }
            });
            this.fileTabsList.appendChild(tab);
        });
    }

    removeImage(index) {
        this.loadedImages.splice(index, 1);
        if (this.loadedImages.length === 0) {
            this.editorArea.style.display = 'none';
            this.emptyState.style.display = 'flex';
            this.fileInput.value = '';
        } else {
            if (this.activeImageIndex >= this.loadedImages.length) {
                this.activeImageIndex = this.loadedImages.length - 1;
            }
            this.renderFileTabs();
            this.loadActiveImageToControls();
        }
    }

    loadActiveImageToControls() {
        const item = this.loadedImages[this.activeImageIndex];
        if (!item) return;

        this.originalRatio = item.originalW / item.originalH;

        // Reset units to px initially or maintain current
        const targetW = Utils.convertUnit(item.originalW, 'px', this.unit, this.dpi);
        const targetH = Utils.convertUnit(item.originalH, 'px', this.unit, this.dpi);

        this.widthInput.value = targetW;
        this.heightInput.value = targetH;

        this.origInfoBadge.textContent = `Original: ${item.originalW} × ${item.originalH} px (${Utils.formatBytes(item.size)})`;

        this.updatePreview();
    }

    convertInputsToUnit(oldUnit, newUnit) {
        const currentW = parseFloat(this.widthInput.value) || 0;
        const currentH = parseFloat(this.heightInput.value) || 0;

        const convertedW = Utils.convertUnit(currentW, oldUnit, newUnit, this.dpi);
        const convertedH = Utils.convertUnit(currentH, oldUnit, newUnit, this.dpi);

        this.widthInput.value = convertedW;
        this.heightInput.value = convertedH;
    }

    syncInputsFromPixels() {
        const item = this.loadedImages[this.activeImageIndex];
        if (!item) return;
        const currentPxW = this.getTargetPixelWidth();
        const currentPxH = this.getTargetPixelHeight();
        this.widthInput.value = Utils.convertUnit(currentPxW, 'px', this.unit, this.dpi);
        this.heightInput.value = Utils.convertUnit(currentPxH, 'px', this.unit, this.dpi);
    }

    getTargetPixelWidth() {
        const val = parseFloat(this.widthInput.value) || 1;
        return Math.max(1, Math.round(Utils.convertUnit(val, this.unit, 'px', this.dpi)));
    }

    getTargetPixelHeight() {
        const val = parseFloat(this.heightInput.value) || 1;
        return Math.max(1, Math.round(Utils.convertUnit(val, this.unit, 'px', this.dpi)));
    }

    applyPreset(preset) {
        const item = this.loadedImages[this.activeImageIndex];
        if (!item) return;

        let targetPxW = item.originalW;
        let targetPxH = item.originalH;

        switch (preset) {
            case '25%':
                targetPxW = Math.round(item.originalW * 0.25);
                targetPxH = Math.round(item.originalH * 0.25);
                break;
            case '50%':
                targetPxW = Math.round(item.originalW * 0.5);
                targetPxH = Math.round(item.originalH * 0.5);
                break;
            case '75%':
                targetPxW = Math.round(item.originalW * 0.75);
                targetPxH = Math.round(item.originalH * 0.75);
                break;
            case '100%':
                targetPxW = item.originalW;
                targetPxH = item.originalH;
                break;
            case '150%':
                targetPxW = Math.round(item.originalW * 1.5);
                targetPxH = Math.round(item.originalH * 1.5);
                break;
            case '200%':
                targetPxW = Math.round(item.originalW * 2.0);
                targetPxH = Math.round(item.originalH * 2.0);
                break;
            case 'fhd': // 1920x1080
                targetPxW = 1920;
                targetPxH = 1080;
                break;
            case '4k': // 3840x2160
                targetPxW = 3840;
                targetPxH = 2160;
                break;
            case 'square': // 1080x1080
                targetPxW = 1080;
                targetPxH = 1080;
                break;
            case 'passport': // 3.5cm x 4.5cm @ 300 DPI
                targetPxW = Math.round(Utils.convertUnit(3.5, 'cm', 'px', this.dpi));
                targetPxH = Math.round(Utils.convertUnit(4.5, 'cm', 'px', this.dpi));
                break;
            case 'usvisa': // 2in x 2in @ 300 DPI
                targetPxW = Math.round(Utils.convertUnit(2, 'inch', 'px', this.dpi));
                targetPxH = Math.round(Utils.convertUnit(2, 'inch', 'px', this.dpi));
                break;
        }

        this.widthInput.value = Utils.convertUnit(targetPxW, 'px', this.unit, this.dpi);
        this.heightInput.value = Utils.convertUnit(targetPxH, 'px', this.unit, this.dpi);
        this.updatePreview();
    }

    updatePreview() {
        const item = this.loadedImages[this.activeImageIndex];
        if (!item || !this.previewCanvas) return;

        const targetPxW = this.getTargetPixelWidth();
        const targetPxH = this.getTargetPixelHeight();

        const ctx = this.previewCanvas.getContext('2d');
        this.previewCanvas.width = targetPxW;
        this.previewCanvas.height = targetPxH;

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw background white if JPEG and source has transparency
        if (this.format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetPxW, targetPxH);
        } else {
            ctx.clearRect(0, 0, targetPxW, targetPxH);
        }

        ctx.drawImage(item.img, 0, 0, targetPxW, targetPxH);

        // Update badge info
        const cmW = Utils.convertUnit(targetPxW, 'px', 'cm', this.dpi);
        const cmH = Utils.convertUnit(targetPxH, 'px', 'cm', this.dpi);
        const inW = Utils.convertUnit(targetPxW, 'px', 'inch', this.dpi);
        const inH = Utils.convertUnit(targetPxH, 'px', 'inch', this.dpi);
        const targetSizeStr = this.enableTargetSize ? ` | Max: ${this.targetSizeValue} ${this.targetSizeUnit}` : '';

        this.targetInfoBadge.textContent = `Output: ${targetPxW} × ${targetPxH} px (${cmW} × ${cmH} cm | ${inW} × ${inH} in @ ${this.dpi} DPI${targetSizeStr})`;
    }

    syncTargetSizeUI() {
        if (this.targetSizeControls) {
            this.targetSizeControls.style.display = this.enableTargetSize ? 'flex' : 'none';
        }
        if (this.qualityGroup) {
            this.qualityGroup.classList.toggle('slider-disabled', this.enableTargetSize);
        }
    }

    getTargetSizeBytes() {
        const val = Math.max(1, parseFloat(this.targetSizeValue) || 100);
        return this.targetSizeUnit === 'MB' ? Math.round(val * 1024 * 1024) : Math.round(val * 1024);
    }

    async generateBlob(item) {
        const targetPxW = this.getTargetPixelWidth();
        const targetPxH = this.getTargetPixelHeight();

        const offscreen = document.createElement('canvas');
        offscreen.width = targetPxW;
        offscreen.height = targetPxH;
        const ctx = offscreen.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (this.format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetPxW, targetPxH);
        }

        ctx.drawImage(item.img, 0, 0, targetPxW, targetPxH);

        if (this.enableTargetSize) {
            const targetBytes = this.getTargetSizeBytes();
            const res = await Utils.canvasToTargetSizeBlob(offscreen, this.format, targetBytes, this.dpi);
            return res ? res.blob : null;
        }

        return Utils.canvasToDpiBlob(offscreen, this.format, this.quality, this.dpi);
    }

    async downloadActiveImage() {
        const item = this.loadedImages[this.activeImageIndex];
        if (!item) return;

        this.downloadBtn.disabled = true;
        this.downloadBtn.textContent = this.enableTargetSize ? 'Optimizing File Size...' : 'Processing...';

        try {
            const blob = await this.generateBlob(item);
            if (blob) {
                const ext = this.format === 'image/png' ? 'png' : (this.format === 'image/webp' ? 'webp' : 'jpg');
                const baseName = item.name.replace(/\.[^/.]+$/, '');
                const targetW = this.getTargetPixelWidth();
                const targetH = this.getTargetPixelHeight();
                const sizeTag = this.enableTargetSize ? `_${this.targetSizeValue}${this.targetSizeUnit}` : '';
                const fileName = `${baseName}_resized_${targetW}x${targetH}_${this.dpi}dpi${sizeTag}.${ext}`;
                Utils.downloadBlob(blob, fileName);
                const msg = this.enableTargetSize
                    ? `Downloaded ${fileName} (${Utils.formatBytes(blob.size)} / target ${this.targetSizeValue} ${this.targetSizeUnit}) @ ${this.dpi} DPI`
                    : `Downloaded ${fileName} (${Utils.formatBytes(blob.size)}) with ${this.dpi} DPI`;
                Utils.toast(msg, 'success');
            }
        } catch (err) {
            console.error(err);
            Utils.toast('Failed to generate resized image', 'error');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<span>⬇️</span> Download Resized Image';
        }
    }

    async downloadAllImagesZip() {
        if (!this.loadedImages.length || typeof JSZip === 'undefined') {
            Utils.toast('JSZip library not available or no images to download', 'warning');
            return;
        }

        this.batchDownloadBtn.disabled = true;
        this.batchDownloadBtn.textContent = 'Zipping...';

        try {
            const zip = new JSZip();
            const ext = this.format === 'image/png' ? 'png' : (this.format === 'image/webp' ? 'webp' : 'jpg');

            for (let i = 0; i < this.loadedImages.length; i++) {
                const item = this.loadedImages[i];
                const blob = await this.generateBlob(item);
                const baseName = item.name.replace(/\.[^/.]+$/, '');
                const targetW = this.getTargetPixelWidth();
                const targetH = this.getTargetPixelHeight();
                zip.file(`${baseName}_resized_${targetW}x${targetH}.${ext}`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            Utils.downloadBlob(zipBlob, `resized_images_${this.dpi}dpi.zip`);
            Utils.toast(`Downloaded all ${this.loadedImages.length} images in ZIP!`, 'success');
        } catch (err) {
            console.error('Batch download error', err);
            Utils.toast('Error creating ZIP archive', 'error');
        } finally {
            this.batchDownloadBtn.disabled = false;
            this.batchDownloadBtn.innerHTML = '<span>📦</span> Download All (ZIP)';
        }
    }
    /* =========================================================================
       SETTINGS PERSISTENCE (REMEMBERED ON PAGE RELOAD)
       ========================================================================= */

    saveSettings() {
        const settings = {
            unit: this.unit,
            dpi: this.dpiSelect?.value || '300',
            customDpi: parseInt(this.customDpiInput?.value) || 300,
            aspectRatioLocked: this.aspectRatioLocked,
            format: this.format,
            quality: Math.round(this.quality * 100),
            enableTargetSize: this.enableTargetSize,
            targetSizeValue: this.targetSizeValue,
            targetSizeUnit: this.targetSizeUnit
        };
        try {
            localStorage.setItem('iptools_resizer_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('iptools_resizer_settings');
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.unit && this.unitSelect) {
                this.unit = s.unit;
                this.unitSelect.value = s.unit;
            }
            if (s.dpi && this.dpiSelect) {
                this.dpiSelect.value = s.dpi;
                if (s.dpi === 'custom') {
                    if (this.customDpiGroup) this.customDpiGroup.style.display = 'block';
                    if (this.customDpiInput) this.customDpiInput.value = s.customDpi || 300;
                    this.dpi = parseInt(s.customDpi) || 300;
                } else {
                    if (this.customDpiGroup) this.customDpiGroup.style.display = 'none';
                    this.dpi = parseInt(s.dpi) || 300;
                }
            }
            if (s.aspectRatioLocked !== undefined && this.lockAspectBtn) {
                this.aspectRatioLocked = s.aspectRatioLocked;
                this.lockAspectBtn.classList.toggle('active', this.aspectRatioLocked);
                const icon = this.lockAspectBtn.querySelector('.lock-icon');
                if (icon) icon.textContent = this.aspectRatioLocked ? '🔒' : '🔓';
            }
            if (s.format && this.formatSelect) {
                this.format = s.format;
                this.formatSelect.value = s.format;
                if (this.qualityGroup) {
                    this.qualityGroup.style.display = (this.format === 'image/png') ? 'none' : 'block';
                }
            }
            if (s.quality !== undefined && this.qualitySlider) {
                this.quality = s.quality / 100;
                this.qualitySlider.value = s.quality;
                if (this.qualityValDisplay) this.qualityValDisplay.textContent = `${s.quality}%`;
            }
            if (s.enableTargetSize !== undefined) {
                this.enableTargetSize = s.enableTargetSize;
                if (this.enableTargetSizeCheck) this.enableTargetSizeCheck.checked = s.enableTargetSize;
            }
            if (s.targetSizeValue !== undefined) {
                this.targetSizeValue = s.targetSizeValue;
                if (this.targetSizeInput) this.targetSizeInput.value = s.targetSizeValue;
            }
            if (s.targetSizeUnit) {
                this.targetSizeUnit = s.targetSizeUnit;
                if (this.targetSizeUnitSelect) this.targetSizeUnitSelect.value = s.targetSizeUnit;
            }
            this.syncTargetSizeUI();
        } catch (e) {
            console.error('Error loading resizer settings', e);
        }
    }
}

window.ImageResizer = ImageResizer;
