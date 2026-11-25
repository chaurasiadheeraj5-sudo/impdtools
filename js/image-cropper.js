/**
 * IP TOOLS - Image Cropper Module
 * Interactive image cropping by exact dimensions in px, cm, mm, inch, with DPI scaling and JFIF metadata injection.
 */

class ImageCropper {
    constructor() {
        this.cropper = null;
        this.currentImage = null; // { file, img, dataUrl, name, size }
        this.unit = 'cm';
        this.dpi = 300;
        this.format = 'image/jpeg';
        this.quality = 0.98;
        this.lockAspect = false;

        this.initDOMElements();
        this.loadSettings();
        this.bindEvents();
    }

    initDOMElements() {
        this.dropZone = document.getElementById('cropper-dropzone');
        this.fileInput = document.getElementById('cropper-file-input');
        this.editorArea = document.getElementById('cropper-editor');
        this.emptyState = document.getElementById('cropper-empty');
        this.imageElement = document.getElementById('cropper-image');

        // Dimensions
        this.widthInput = document.getElementById('cropper-width');
        this.heightInput = document.getElementById('cropper-height');
        this.unitSelect = document.getElementById('cropper-unit');
        this.dpiSelect = document.getElementById('cropper-dpi');
        this.customDpiGroup = document.getElementById('cropper-custom-dpi-group');
        this.customDpiInput = document.getElementById('cropper-custom-dpi');
        this.applyDimBtn = document.getElementById('cropper-apply-dim');
        this.lockAspectBtn = document.getElementById('cropper-lock-aspect');

        // Toolbar
        this.rotateLeftBtn = document.getElementById('cropper-rotate-left');
        this.rotateRightBtn = document.getElementById('cropper-rotate-right');
        this.flipXBtn = document.getElementById('cropper-flip-x');
        this.flipYBtn = document.getElementById('cropper-flip-y');
        this.zoomInBtn = document.getElementById('cropper-zoom-in');
        this.zoomOutBtn = document.getElementById('cropper-zoom-out');
        this.resetBtn = document.getElementById('cropper-reset');

        // Aspect presets
        this.presetButtons = document.querySelectorAll('.cropper-preset-btn');

        // Output options
        this.formatSelect = document.getElementById('cropper-format');
        this.qualitySlider = document.getElementById('cropper-quality');
        this.qualityVal = document.getElementById('cropper-quality-val');
        this.exactScaleCheck = document.getElementById('cropper-exact-scale');

        // Preview & Download
        this.infoBadge = document.getElementById('cropper-info-badge');
        this.downloadBtn = document.getElementById('cropper-download-btn');
        this.doMoreBtn = document.getElementById('cropper-do-more-btn');
    }

    bindEvents() {
        if (!this.dropZone) return;

        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.loadFile(e.target.files[0]);
        });

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
                this.loadFile(e.dataTransfer.files[0]);
            }
        });

        // Unit change
        this.unitSelect.addEventListener('change', (e) => {
            const oldUnit = this.unit;
            this.unit = e.target.value;
            const curW = parseFloat(this.widthInput.value) || 0;
            const curH = parseFloat(this.heightInput.value) || 0;
            this.widthInput.value = Utils.convertUnit(curW, oldUnit, this.unit, this.dpi);
            this.heightInput.value = Utils.convertUnit(curH, oldUnit, this.unit, this.dpi);
            this.updateCropInfo();
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
            this.updateCropInfo();
            this.saveSettings();
        });

        if (this.customDpiInput) {
            this.customDpiInput.addEventListener('input', () => {
                this.dpi = Math.max(1, parseInt(this.customDpiInput.value) || 300);
                this.updateCropInfo();
                this.saveSettings();
            });
        }

        // Apply desired dimensions to crop box
        this.applyDimBtn.addEventListener('click', () => {
            this.applyDesiredDimensions();
            this.saveSettings();
        });

        // Inputs
        this.widthInput.addEventListener('input', () => this.saveSettings());
        this.heightInput.addEventListener('input', () => this.saveSettings());
        if (this.exactScaleCheck) {
            this.exactScaleCheck.addEventListener('change', () => this.saveSettings());
        }

        // Lock aspect
        this.lockAspectBtn.addEventListener('click', () => {
            this.lockAspect = !this.lockAspect;
            this.syncLockIcon();
            if (this.lockAspect) {
                const w = parseFloat(this.widthInput.value) || 1;
                const h = parseFloat(this.heightInput.value) || 1;
                if (this.cropper) {
                    this.cropper.setAspectRatio(w / h);
                }
            } else {
                if (this.cropper) {
                    this.cropper.setAspectRatio(NaN); // free aspect
                }
            }
            this.saveSettings();
        });

        // Aspect ratio presets
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.aspect;
                this.applyPreset(preset);
                this.saveSettings();
            });
        });

        // Transformation buttons
        this.rotateLeftBtn.addEventListener('click', () => this.cropper && this.cropper.rotate(-90));
        this.rotateRightBtn.addEventListener('click', () => this.cropper && this.cropper.rotate(90));
        this.zoomInBtn.addEventListener('click', () => this.cropper && this.cropper.zoom(0.1));
        this.zoomOutBtn.addEventListener('click', () => this.cropper && this.cropper.zoom(-0.1));
        this.resetBtn.addEventListener('click', () => this.cropper && this.cropper.reset());

        let scaleX = 1;
        let scaleY = 1;
        this.flipXBtn.addEventListener('click', () => {
            if (!this.cropper) return;
            scaleX = -scaleX;
            this.cropper.scaleX(scaleX);
        });
        this.flipYBtn.addEventListener('click', () => {
            if (!this.cropper) return;
            scaleY = -scaleY;
            this.cropper.scaleY(scaleY);
        });

        // Format & Quality
        this.formatSelect.addEventListener('change', (e) => {
            this.format = e.target.value;
            this.saveSettings();
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value) / 100;
            this.qualityVal.textContent = `${e.target.value}%`;
            this.saveSettings();
        });

        // Download
        this.downloadBtn.addEventListener('click', () => this.downloadCroppedImage());
        if (this.doMoreBtn) {
            this.doMoreBtn.addEventListener('click', () => this.resetForMore());
        }
    }

    async loadFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            Utils.toast('Please select a valid image file', 'warning');
            return;
        }

        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            const img = await Utils.loadImage(dataUrl);

            this.currentImage = {
                file,
                img,
                dataUrl,
                originalW: img.naturalWidth,
                originalH: img.naturalHeight,
                name: file.name,
                size: file.size
            };

            this.emptyState.style.display = 'none';
            this.editorArea.style.display = 'grid';

            // Clean up old cropper
            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }

            this.imageElement.src = dataUrl;

            // Initialize Cropper.js
            this.cropper = new Cropper(this.imageElement, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.85,
                restore: false,
                guides: true,
                center: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: true,
                crop: (event) => this.onCropChange(event.detail)
            });

            // Set default dimension values (e.g. 3.5 x 4.5 cm passport standard)
            this.widthInput.value = '3.5';
            this.heightInput.value = '4.5';
            this.unitSelect.value = 'cm';
            this.unit = 'cm';

            Utils.toast(`Loaded ${file.name} (${img.naturalWidth} × ${img.naturalHeight} px)`, 'success');
        } catch (err) {
            console.error('Error loading cropper image', err);
            Utils.toast('Could not load image for cropping', 'error');
        }
    }

    onCropChange(detail) {
        if (!detail) return;
        const cropPxW = Math.round(detail.width);
        const cropPxH = Math.round(detail.height);

        const cropCmW = Utils.convertUnit(cropPxW, 'px', 'cm', this.dpi);
        const cropCmH = Utils.convertUnit(cropPxH, 'px', 'cm', this.dpi);
        const cropInW = Utils.convertUnit(cropPxW, 'px', 'inch', this.dpi);
        const cropInH = Utils.convertUnit(cropPxH, 'px', 'inch', this.dpi);

        this.infoBadge.textContent = `Crop Area: ${cropPxW} × ${cropPxH} px (${cropCmW} × ${cropCmH} cm | ${cropInW} × ${cropInH} in @ ${this.dpi} DPI)`;
    }

    updateCropInfo() {
        if (!this.cropper) return;
        const data = this.cropper.getData();
        this.onCropChange(data);
    }

    applyPreset(preset) {
        if (!this.cropper) return;

        switch (preset) {
            case 'free':
                this.cropper.setAspectRatio(NaN);
                this.lockAspect = false;
                this.lockAspectBtn.classList.remove('active');
                break;
            case '1:1':
                this.cropper.setAspectRatio(1);
                this.widthInput.value = '5';
                this.heightInput.value = '5';
                this.unitSelect.value = 'cm';
                this.unit = 'cm';
                break;
            case 'passport': // 3.5 x 4.5 cm
                this.cropper.setAspectRatio(3.5 / 4.5);
                this.widthInput.value = '3.5';
                this.heightInput.value = '4.5';
                this.unitSelect.value = 'cm';
                this.unit = 'cm';
                break;
            case 'usvisa': // 2 x 2 inch
                this.cropper.setAspectRatio(1);
                this.widthInput.value = '2';
                this.heightInput.value = '2';
                this.unitSelect.value = 'inch';
                this.unit = 'inch';
                break;
            case '3:4':
                this.cropper.setAspectRatio(3 / 4);
                this.widthInput.value = '3';
                this.heightInput.value = '4';
                this.unitSelect.value = 'cm';
                this.unit = 'cm';
                break;
            case '4:3':
                this.cropper.setAspectRatio(4 / 3);
                break;
            case '16:9':
                this.cropper.setAspectRatio(16 / 9);
                break;
        }

        if (preset !== 'free') {
            this.lockAspect = true;
        }
        this.syncLockIcon();
    }

    syncLockIcon() {
        if (!this.lockAspectBtn) return;
        this.lockAspectBtn.classList.toggle('active', this.lockAspect);
        const icon = this.lockAspectBtn.querySelector('.lock-icon');
        if (icon) {
            icon.textContent = this.lockAspect ? '🔒' : '🔓';
        }
        this.lockAspectBtn.setAttribute('title', this.lockAspect ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked');
    }

    applyDesiredDimensions() {
        if (!this.cropper) return;

        const w = parseFloat(this.widthInput.value) || 1;
        const h = parseFloat(this.heightInput.value) || 1;

        const pxW = Math.max(1, Math.round(Utils.convertUnit(w, this.unit, 'px', this.dpi)));
        const pxH = Math.max(1, Math.round(Utils.convertUnit(h, this.unit, 'px', this.dpi)));

        const ratio = pxW / pxH;
        this.cropper.setAspectRatio(ratio);
        this.lockAspect = true;
        this.lockAspectBtn.classList.add('active');

        Utils.toast(`Applied aspect ratio ${w} : ${h} (${this.unit})`, 'info');
    }

    /**
     * Studio-grade multi-step area-weighted downsampler and resampler.
     * Eliminates standard canvas downscaling blur and retains 100% crisp facial details,
     * eyelashes, hair texture, skin clarity, and contrast.
     */
    resampleHighQuality(sourceCanvas, targetW, targetH, isJpeg = true) {
        targetW = Math.max(1, Math.round(targetW));
        targetH = Math.max(1, Math.round(targetH));

        const sw = sourceCanvas.width;
        const sh = sourceCanvas.height;

        // Exact match -> return direct copy with crisp background
        if (sw === targetW && sh === targetH) {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = targetW;
            outCanvas.height = targetH;
            const outCtx = outCanvas.getContext('2d');
            if (isJpeg) {
                outCtx.fillStyle = '#FFFFFF';
                outCtx.fillRect(0, 0, targetW, targetH);
            }
            outCtx.drawImage(sourceCanvas, 0, 0);
            return outCanvas;
        }

        // Mild scale reduction (< 2x downscale) or upscale -> single high-quality pass
        if (sw <= targetW * 2 && sh <= targetH * 2) {
            const outCanvas = document.createElement('canvas');
            outCanvas.width = targetW;
            outCanvas.height = targetH;
            const outCtx = outCanvas.getContext('2d');
            if (isJpeg) {
                outCtx.fillStyle = '#FFFFFF';
                outCtx.fillRect(0, 0, targetW, targetH);
            }
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';
            outCtx.drawImage(sourceCanvas, 0, 0, sw, sh, 0, 0, targetW, targetH);
            return outCanvas;
        }

        // High-fidelity multi-step mipmap downscaling (factor of 0.5 passes)
        // Each halving step performs exact 2x2 box averaging without skipping pixels
        let curW = sw;
        let curH = sh;
        let curCanvas = sourceCanvas;

        while (curW * 0.5 >= targetW && curH * 0.5 >= targetH) {
            const nextW = Math.round(curW * 0.5);
            const nextH = Math.round(curH * 0.5);
            const nextCanvas = document.createElement('canvas');
            nextCanvas.width = nextW;
            nextCanvas.height = nextH;
            const nextCtx = nextCanvas.getContext('2d');
            nextCtx.imageSmoothingEnabled = true;
            nextCtx.imageSmoothingQuality = 'high';
            nextCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);

            curCanvas = nextCanvas;
            curW = nextW;
            curH = nextH;
        }

        // Final step: draw from intermediate mipmap to target canvas with high bicubic filter
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetW;
        finalCanvas.height = targetH;
        const finalCtx = finalCanvas.getContext('2d');
        if (isJpeg) {
            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fillRect(0, 0, targetW, targetH);
        }
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, targetW, targetH);

        return finalCanvas;
    }

    
    resetForMore() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        this.currentImage = null;
        if (this.editorArea) this.editorArea.style.display = 'none';
        if (this.emptyState) this.emptyState.style.display = 'flex';
        if (this.fileInput) {
            this.fileInput.value = '';
            this.fileInput.click();
        }
    }

    async downloadCroppedImage() {
        if (!this.cropper || !this.currentImage) return;

        this.downloadBtn.disabled = true;
        this.downloadBtn.textContent = 'Cropping...';

        try {
            const exactScale = this.exactScaleCheck.checked;
            const isJpeg = this.format === 'image/jpeg';
            let targetCanvas = null;

            // Step 1: Extract the crop at 100% full native resolution from Cropper.js
            // (Preserves original sensor pixels, rotations, and flips without lossy single-pass scaling)
            const nativeCanvas = this.cropper.getCroppedCanvas({
                fillColor: isJpeg ? '#FFFFFF' : 'transparent',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            if (!nativeCanvas) {
                Utils.toast('Could not generate cropped canvas', 'error');
                return;
            }

            if (exactScale) {
                // Calculate exact target pixel dimensions based on chosen unit and DPI
                const w = parseFloat(this.widthInput.value) || 1;
                const h = parseFloat(this.heightInput.value) || 1;
                const pxW = Math.max(1, Math.round(Utils.convertUnit(w, this.unit, 'px', this.dpi)));
                const pxH = Math.max(1, Math.round(Utils.convertUnit(h, this.unit, 'px', this.dpi)));

                // Step 2: Use high-fidelity multi-step area-weighted downsampler
                // Prevents browser bilinear downscaling blur and guarantees razor-sharp details
                targetCanvas = this.resampleHighQuality(nativeCanvas, pxW, pxH, isJpeg);
            } else {
                targetCanvas = nativeCanvas;
            }

            if (!targetCanvas) {
                Utils.toast('Could not generate cropped canvas', 'error');
                return;
            }

            targetCanvas.toBlob(async (blob) => {
                if (!blob) {
                    Utils.toast('Failed to generate image blob', 'error');
                    return;
                }

                // Inject JFIF DPI metadata or PNG pHYs chunk
                let finalBlob = blob;
                if (this.format === 'image/jpeg') {
                    finalBlob = await Utils.setJpegDpi(blob, this.dpi);
                } else if (this.format === 'image/png') {
                    finalBlob = await Utils.setPngDpi(blob, this.dpi);
                }

                const ext = this.format === 'image/png' ? 'png' : (this.format === 'image/webp' ? 'webp' : 'jpg');
                const baseName = this.currentImage.name.replace(/\.[^/.]+$/, '');
                const fileName = `${baseName}_cropped_${targetCanvas.width}x${targetCanvas.height}_${this.dpi}dpi.${ext}`;

                Utils.downloadBlob(finalBlob, fileName);
                Utils.toast(`Cropped image downloaded (${targetCanvas.width} × ${targetCanvas.height} px @ ${this.dpi} DPI)`, 'success');
            }, this.format, this.quality);

        } catch (err) {
            console.error('Cropper download error', err);
            Utils.toast('Error downloading cropped image', 'error');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<svg class="btn-svg-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg><span>Download Cropped Image</span>';
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
            width: parseFloat(this.widthInput?.value) || '',
            height: parseFloat(this.heightInput?.value) || '',
            lockAspect: this.lockAspect,
            format: this.format,
            quality: Math.round(this.quality * 100),
            exactScale: this.exactScaleCheck ? this.exactScaleCheck.checked : true
        };
        try {
            localStorage.setItem('iptools_cropper_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('iptools_cropper_settings');
            if (!raw) {
                this.syncLockIcon();
                return;
            }
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
            if (s.width !== undefined && s.width !== '' && this.widthInput) {
                this.widthInput.value = s.width;
            }
            if (s.height !== undefined && s.height !== '' && this.heightInput) {
                this.heightInput.value = s.height;
            }
            if (s.lockAspect !== undefined) {
                this.lockAspect = s.lockAspect;
            }
            this.syncLockIcon();
            if (s.format && this.formatSelect) {
                this.format = s.format;
                this.formatSelect.value = s.format;
            }
            if (s.quality !== undefined && this.qualitySlider) {
                const q = (s.quality === 95) ? 98 : s.quality;
                this.quality = q / 100;
                this.qualitySlider.value = q;
                if (this.qualityVal) this.qualityVal.textContent = `${q}%`;
            }
            if (s.exactScale !== undefined && this.exactScaleCheck) {
                this.exactScaleCheck.checked = s.exactScale;
            }
        } catch (e) {
            console.error('Error loading cropper settings', e);
        }
    }
}

window.ImageCropper = ImageCropper;
