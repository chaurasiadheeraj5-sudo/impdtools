/**
 * IP TOOLS - Image Combiner Module
 * Appends two images together horizontally or vertically, asking width and height for both images, DPI, spacing, and output JPG/JPEG.
 */

class ImageCombiner {
    constructor() {
        this.img1 = null; // { file, img, originalW, originalH, name }
        this.img2 = null; // { file, img, originalW, originalH, name }

        this.unit1 = 'px';
        this.unit2 = 'px';
        this.dpi = 300;
        this.direction = 'horizontal'; // 'horizontal' | 'vertical'
        this.alignment = 'center';     // 'center' | 'start' | 'end'
        this.gap = 0;                  // in px
        this.bgColor = '#FFFFFF';
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
        // Upload boxes
        this.dropZone1 = document.getElementById('combiner-drop1');
        this.dropZone2 = document.getElementById('combiner-drop2');
        this.fileInput1 = document.getElementById('combiner-file1');
        this.fileInput2 = document.getElementById('combiner-file2');

        // Image 1 controls
        this.w1Input = document.getElementById('combiner-w1');
        this.h1Input = document.getElementById('combiner-h1');
        this.unit1Select = document.getElementById('combiner-unit1');
        this.fit1Select = document.getElementById('combiner-fit1');
        this.info1 = document.getElementById('combiner-info1');

        // Image 2 controls
        this.w2Input = document.getElementById('combiner-w2');
        this.h2Input = document.getElementById('combiner-h2');
        this.unit2Select = document.getElementById('combiner-unit2');
        this.fit2Select = document.getElementById('combiner-fit2');
        this.info2 = document.getElementById('combiner-info2');

        // Overall layout controls
        this.directionRadios = document.querySelectorAll('input[name="combiner-direction"]');
        this.alignSelect = document.getElementById('combiner-align');
        this.gapInput = document.getElementById('combiner-gap');
        this.gapUnitSelect = document.getElementById('combiner-gap-unit');
        this.bgColorPicker = document.getElementById('combiner-bgcolor');
        this.bgColorLabel = document.getElementById('combiner-bgcolor-label');
        this.dpiSelect = document.getElementById('combiner-dpi');
        this.customDpiGroup = document.getElementById('combiner-custom-dpi-group');
        this.customDpiInput = document.getElementById('combiner-custom-dpi');
        this.formatSelect = document.getElementById('combiner-format');
        this.qualitySlider = document.getElementById('combiner-quality');
        this.qualityVal = document.getElementById('combiner-quality-val');
        this.qualityGroup = document.getElementById('combiner-quality-group');

        // Dedicated / Target File Size controls
        this.enableTargetSizeCheck = document.getElementById('combiner-enable-target-size');
        this.targetSizeControls = document.getElementById('combiner-target-size-controls');
        this.targetSizeInput = document.getElementById('combiner-target-size');
        this.targetSizeUnitSelect = document.getElementById('combiner-target-size-unit');
        this.sizePresetBtns = document.querySelectorAll('.combiner-size-preset');

        // Preview & actions
        this.previewCanvas = document.getElementById('combiner-canvas');
        this.canvasInfo = document.getElementById('combiner-canvas-info');
        this.swapBtn = document.getElementById('combiner-swap-btn');
        this.downloadBtn = document.getElementById('combiner-download-btn');
        this.doMoreBtn = document.getElementById('combiner-do-more-btn');
        this.initialDropZone1HTML = this.dropZone1 ? this.dropZone1.innerHTML : '';
        this.initialDropZone2HTML = this.dropZone2 ? this.dropZone2.innerHTML : '';
    }

    bindEvents() {
        if (!this.dropZone1 || !this.dropZone2) return;

        // Image 1 upload
        this.dropZone1.addEventListener('click', () => this.fileInput1.click());
        this.fileInput1.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0], 1));
        this.setupDragDrop(this.dropZone1, (file) => this.handleImageUpload(file, 1));

        // Image 2 upload
        this.dropZone2.addEventListener('click', () => this.fileInput2.click());
        this.fileInput2.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0], 2));
        this.setupDragDrop(this.dropZone2, (file) => this.handleImageUpload(file, 2));

        // Units
        this.unit1Select.addEventListener('change', (e) => {
            const oldUnit = this.unit1;
            this.unit1 = e.target.value;
            const curW = parseFloat(this.w1Input.value) || 0;
            const curH = parseFloat(this.h1Input.value) || 0;
            this.w1Input.value = Utils.convertUnit(curW, oldUnit, this.unit1, this.dpi);
            this.h1Input.value = Utils.convertUnit(curH, oldUnit, this.unit1, this.dpi);
            this.renderCombinedCanvas();
            this.saveSettings();
        });

        this.unit2Select.addEventListener('change', (e) => {
            const oldUnit = this.unit2;
            this.unit2 = e.target.value;
            const curW = parseFloat(this.w2Input.value) || 0;
            const curH = parseFloat(this.h2Input.value) || 0;
            this.w2Input.value = Utils.convertUnit(curW, oldUnit, this.unit2, this.dpi);
            this.h2Input.value = Utils.convertUnit(curH, oldUnit, this.unit2, this.dpi);
            this.renderCombinedCanvas();
            this.saveSettings();
        });

        // Numerical inputs
        [this.w1Input, this.h1Input, this.w2Input, this.h2Input, this.gapInput].forEach(inp => {
            inp.addEventListener('input', () => {
                this.renderCombinedCanvas();
                this.saveSettings();
            });
        });

        [this.fit1Select, this.fit2Select, this.alignSelect, this.gapUnitSelect].forEach(sel => {
            sel.addEventListener('change', () => {
                this.renderCombinedCanvas();
                this.saveSettings();
            });
        });

        // Direction radios
        this.directionRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.direction = e.target.value;
                    this.renderCombinedCanvas();
                    this.saveSettings();
                }
            });
        });

        // Background color
        this.bgColorPicker.addEventListener('input', (e) => {
            this.bgColor = e.target.value;
            this.renderCombinedCanvas();
            this.saveSettings();
        });

        // DPI
        this.dpiSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.customDpiGroup.style.display = 'block';
                this.dpi = parseInt(this.customDpiInput.value) || 300;
            } else {
                this.customDpiGroup.style.display = 'none';
                this.dpi = parseInt(e.target.value) || 300;
            }
            this.renderCombinedCanvas();
            this.saveSettings();
        });

        if (this.customDpiInput) {
            this.customDpiInput.addEventListener('input', () => {
                this.dpi = Math.max(1, parseInt(this.customDpiInput.value) || 300);
                this.renderCombinedCanvas();
                this.saveSettings();
            });
        }

        // Format & Quality
        this.formatSelect.addEventListener('change', (e) => {
            this.format = e.target.value;
            this.renderCombinedCanvas();
            this.saveSettings();
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = parseInt(e.target.value) / 100;
            this.qualityVal.textContent = `${e.target.value}%`;
            this.saveSettings();
        });

        // Target / Dedicated File Size events
        if (this.enableTargetSizeCheck) {
            this.enableTargetSizeCheck.addEventListener('change', (e) => {
                this.enableTargetSize = e.target.checked;
                this.syncTargetSizeUI();
                this.renderCombinedCanvas();
                this.saveSettings();
            });
        }

        if (this.targetSizeInput) {
            this.targetSizeInput.addEventListener('input', () => {
                this.targetSizeValue = Math.max(1, parseFloat(this.targetSizeInput.value) || 100);
                this.renderCombinedCanvas();
                this.saveSettings();
            });
        }

        if (this.targetSizeUnitSelect) {
            this.targetSizeUnitSelect.addEventListener('change', (e) => {
                this.targetSizeUnit = e.target.value;
                this.renderCombinedCanvas();
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
                    this.renderCombinedCanvas();
                    this.saveSettings();
                });
            });
        }

        // Swap button
        if (this.swapBtn) {
            this.swapBtn.addEventListener('click', () => this.swapImages());
        }

        // Download
        this.downloadBtn.addEventListener('click', () => this.downloadCombinedImage());
        if (this.doMoreBtn) {
            this.doMoreBtn.addEventListener('click', () => this.resetForMore());
        }
    }

    setupDragDrop(element, onFileDrop) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });
        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                onFileDrop(e.dataTransfer.files[0]);
            }
        });
    }

    async handleImageUpload(file, index) {
        if (!file || !file.type.startsWith('image/')) {
            Utils.toast('Please select a valid image file', 'warning');
            return;
        }

        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            const img = await Utils.loadImage(dataUrl);

            const item = {
                file,
                img,
                dataUrl,
                originalW: img.naturalWidth,
                originalH: img.naturalHeight,
                name: file.name,
                size: file.size
            };

            if (index === 1) {
                this.img1 = item;
                this.dropZone1.innerHTML = `
                    <img src="${dataUrl}" class="combiner-thumb" alt="Image 1">
                    <div class="thumb-overlay">Click to change</div>
                `;
                this.info1.textContent = `${item.originalW} × ${item.originalH} px (${Utils.formatBytes(item.size)})`;
                this.w1Input.value = Utils.convertUnit(item.originalW, 'px', this.unit1, this.dpi);
                this.h1Input.value = Utils.convertUnit(item.originalH, 'px', this.unit1, this.dpi);
            } else {
                this.img2 = item;
                this.dropZone2.innerHTML = `
                    <img src="${dataUrl}" class="combiner-thumb" alt="Image 2">
                    <div class="thumb-overlay">Click to change</div>
                `;
                this.info2.textContent = `${item.originalW} × ${item.originalH} px (${Utils.formatBytes(item.size)})`;
                this.w2Input.value = Utils.convertUnit(item.originalW, 'px', this.unit2, this.dpi);
                this.h2Input.value = Utils.convertUnit(item.originalH, 'px', this.unit2, this.dpi);
            }

            Utils.toast(`Image ${index} loaded: ${item.name}`, 'info');
            this.renderCombinedCanvas();
        } catch (err) {
            console.error('Failed to load combiner image', err);
            Utils.toast(`Could not load Image ${index}`, 'error');
        }
    }

    swapImages() {
        if (!this.img1 && !this.img2) return;
        const temp = this.img1;
        this.img1 = this.img2;
        this.img2 = temp;

        // Swap UI inputs
        const tempW = this.w1Input.value;
        const tempH = this.h1Input.value;
        const tempUnit = this.unit1Select.value;
        this.w1Input.value = this.w2Input.value;
        this.h1Input.value = this.h2Input.value;
        this.unit1Select.value = this.unit2Select.value;
        this.w2Input.value = tempW;
        this.h2Input.value = tempH;
        this.unit2Select.value = tempUnit;
        this.unit1 = this.unit1Select.value;
        this.unit2 = this.unit2Select.value;

        // Re-render dropzones
        if (this.img1) {
            this.dropZone1.innerHTML = `<img src="${this.img1.dataUrl}" class="combiner-thumb"><div class="thumb-overlay">Click to change</div>`;
            this.info1.textContent = `${this.img1.originalW} × ${this.img1.originalH} px`;
        } else {
            this.dropZone1.innerHTML = `<span>+ Upload Image 1</span>`;
            this.info1.textContent = ``;
        }

        if (this.img2) {
            this.dropZone2.innerHTML = `<img src="${this.img2.dataUrl}" class="combiner-thumb"><div class="thumb-overlay">Click to change</div>`;
            this.info2.textContent = `${this.img2.originalW} × ${this.img2.originalH} px`;
        } else {
            this.dropZone2.innerHTML = `<span>+ Upload Image 2</span>`;
            this.info2.textContent = ``;
        }

        this.renderCombinedCanvas();
        Utils.toast('Swapped Image 1 and Image 2', 'info');
    }

    getPx1() {
        const w = Utils.convertUnit(parseFloat(this.w1Input.value) || 0, this.unit1, 'px', this.dpi);
        const h = Utils.convertUnit(parseFloat(this.h1Input.value) || 0, this.unit1, 'px', this.dpi);
        return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    }

    getPx2() {
        const w = Utils.convertUnit(parseFloat(this.w2Input.value) || 0, this.unit2, 'px', this.dpi);
        const h = Utils.convertUnit(parseFloat(this.h2Input.value) || 0, this.unit2, 'px', this.dpi);
        return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    }

    getGapPx() {
        const val = parseFloat(this.gapInput.value) || 0;
        const unit = this.gapUnitSelect.value;
        return Math.max(0, Math.round(Utils.convertUnit(val, unit, 'px', this.dpi)));
    }

    renderCombinedCanvas() {
        if (!this.img1 && !this.img2) {
            this.canvasInfo.textContent = 'Upload Image 1 and Image 2 to preview combined image';
            return;
        }

        const size1 = this.img1 ? this.getPx1() : { w: 0, h: 0 };
        const size2 = this.img2 ? this.getPx2() : { w: 0, h: 0 };
        const gap = (this.img1 && this.img2) ? this.getGapPx() : 0;

        let totalW = 0;
        let totalH = 0;

        if (this.direction === 'horizontal') {
            totalW = size1.w + size2.w + (this.img1 && this.img2 ? gap : 0);
            totalH = Math.max(size1.h, size2.h);
        } else { // vertical
            totalW = Math.max(size1.w, size2.w);
            totalH = size1.h + size2.h + (this.img1 && this.img2 ? gap : 0);
        }

        if (totalW === 0 || totalH === 0) return;

        this.previewCanvas.width = totalW;
        this.previewCanvas.height = totalH;
        const ctx = this.previewCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, totalW, totalH);

        // Calculate positions
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

        if (this.direction === 'horizontal') {
            x1 = 0;
            x2 = size1.w + gap;

            // Alignment along Y
            if (this.alignment === 'center') {
                y1 = (totalH - size1.h) / 2;
                y2 = (totalH - size2.h) / 2;
            } else if (this.alignment === 'end') {
                y1 = totalH - size1.h;
                y2 = totalH - size2.h;
            } else {
                y1 = 0;
                y2 = 0;
            }
        } else { // vertical
            y1 = 0;
            y2 = size1.h + gap;

            // Alignment along X
            if (this.alignment === 'center') {
                x1 = (totalW - size1.w) / 2;
                x2 = (totalW - size2.w) / 2;
            } else if (this.alignment === 'end') {
                x1 = totalW - size1.w;
                x2 = totalW - size2.w;
            } else {
                x1 = 0;
                x2 = 0;
            }
        }

        // Draw Image 1
        if (this.img1) {
            this.drawImageWithFit(ctx, this.img1.img, x1, y1, size1.w, size1.h, this.fit1Select.value);
        }

        // Draw Image 2
        if (this.img2) {
            this.drawImageWithFit(ctx, this.img2.img, x2, y2, size2.w, size2.h, this.fit2Select.value);
        }

        // Update info badge
        const totalCmW = Utils.convertUnit(totalW, 'px', 'cm', this.dpi);
        const totalCmH = Utils.convertUnit(totalH, 'px', 'cm', this.dpi);
        const totalInW = Utils.convertUnit(totalW, 'px', 'inch', this.dpi);
        const totalInH = Utils.convertUnit(totalH, 'px', 'inch', this.dpi);
        const targetSizeStr = this.enableTargetSize ? ` | Max: ${this.targetSizeValue} ${this.targetSizeUnit}` : '';

        this.canvasInfo.textContent = `Combined: ${totalW} × ${totalH} px (${totalCmW} × ${totalCmH} cm | ${totalInW} × ${totalInH} in @ ${this.dpi} DPI${targetSizeStr})`;
        this.downloadBtn.disabled = !(this.img1 || this.img2);
    }

    syncTargetSizeUI() {
        if (this.targetSizeControls) {
            this.targetSizeControls.style.display = this.enableTargetSize ? 'block' : 'none';
        }
        if (this.qualityGroup) {
            this.qualityGroup.classList.toggle('slider-disabled', this.enableTargetSize);
        }
    }

    getTargetSizeBytes() {
        const val = Math.max(1, parseFloat(this.targetSizeValue) || 100);
        return this.targetSizeUnit === 'MB' ? Math.round(val * 1024 * 1024) : Math.round(val * 1024);
    }

    drawImageWithFit(ctx, img, targetX, targetY, targetW, targetH, fitMode) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(targetX, targetY, targetW, targetH);
        ctx.clip();

        if (fitMode === 'stretch') {
            ctx.drawImage(img, targetX, targetY, targetW, targetH);
        } else if (fitMode === 'contain') {
            const hRatio = targetW / img.naturalWidth;
            const vRatio = targetH / img.naturalHeight;
            const ratio = Math.min(hRatio, vRatio);
            const w = img.naturalWidth * ratio;
            const h = img.naturalHeight * ratio;
            const x = targetX + (targetW - w) / 2;
            const y = targetY + (targetH - h) / 2;
            ctx.drawImage(img, x, y, w, h);
        } else { // 'cover'
            const hRatio = targetW / img.naturalWidth;
            const vRatio = targetH / img.naturalHeight;
            const ratio = Math.max(hRatio, vRatio);
            const w = img.naturalWidth * ratio;
            const h = img.naturalHeight * ratio;
            const x = targetX + (targetW - w) / 2;
            const y = targetY + (targetH - h) / 2;
            ctx.drawImage(img, x, y, w, h);
        }

        ctx.restore();
    }

    resetForMore() {
        this.img1 = null;
        this.img2 = null;
        if (this.dropZone1 && this.initialDropZone1HTML) this.dropZone1.innerHTML = this.initialDropZone1HTML;
        if (this.dropZone2 && this.initialDropZone2HTML) this.dropZone2.innerHTML = this.initialDropZone2HTML;
        if (this.fileInput1) this.fileInput1.value = '';
        if (this.fileInput2) this.fileInput2.value = '';
        if (this.info1) this.info1.textContent = '';
        if (this.info2) this.info2.textContent = '';
        if (this.w1Input) this.w1Input.value = '';
        if (this.h1Input) this.h1Input.value = '';
        if (this.w2Input) this.w2Input.value = '';
        if (this.h2Input) this.h2Input.value = '';
        if (this.previewCanvas) {
            const ctx = this.previewCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        if (this.canvasInfo) this.canvasInfo.textContent = 'Combined: -';
        if (this.downloadBtn) this.downloadBtn.disabled = true;
        if (this.fileInput1) this.fileInput1.click();
    }

    async downloadCombinedImage() {
        if (!this.img1 && !this.img2) {
            Utils.toast('Please upload at least one image', 'warning');
            return;
        }

        const ext = this.format === 'image/png' ? 'png' : 'jpg';
        const name1 = this.img1 ? this.img1.name.replace(/\.[^/.]+$/, '') : 'img1';
        const name2 = this.img2 ? this.img2.name.replace(/\.[^/.]+$/, '') : 'img2';
        const sizeTag = this.enableTargetSize ? `_${this.targetSizeValue}${this.targetSizeUnit}` : '';
        const defaultBaseName = `combined_${name1}_${name2}_${this.dpi}dpi${sizeTag}`;

        const fileName = await Utils.promptFilename(defaultBaseName, ext, 'Save Combined Image As');
        if (!fileName) return; // User cancelled

        this.downloadBtn.disabled = true;
        this.downloadBtn.textContent = this.enableTargetSize ? 'Optimizing File Size...' : 'Generating...';

        try {
            let finalBlob = null;

            if (this.enableTargetSize) {
                const targetBytes = this.getTargetSizeBytes();
                const res = await Utils.canvasToTargetSizeBlob(this.previewCanvas, this.format, targetBytes, this.dpi);
                finalBlob = res ? res.blob : null;
            } else {
                finalBlob = await Utils.canvasToDpiBlob(this.previewCanvas, this.format, this.quality, this.dpi);
            }

            if (!finalBlob) {
                Utils.toast('Failed to generate image', 'error');
                return;
            }

            Utils.downloadBlob(finalBlob, fileName);
            const msg = this.enableTargetSize
                ? `Downloaded "${fileName}" (${Utils.formatBytes(finalBlob.size)} / target ${this.targetSizeValue} ${this.targetSizeUnit}) @ ${this.dpi} DPI`
                : `Downloaded "${fileName}" (${Utils.formatBytes(finalBlob.size)})`;
            Utils.toast(msg, 'success');
        } catch (err) {
            console.error('Download combined error', err);
            Utils.toast('Error generating combined image', 'error');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<span>⬇️</span> Download Combined Image';
        }
    }
    /* =========================================================================
       SETTINGS PERSISTENCE (REMEMBERED ON PAGE RELOAD)
       ========================================================================= */

    saveSettings() {
        const settings = {
            unit1: this.unit1,
            unit2: this.unit2,
            direction: this.direction,
            align: this.alignSelect?.value || 'center',
            gap: parseFloat(this.gapInput?.value) || 0,
            gapUnit: this.gapUnitSelect?.value || 'px',
            bgColor: this.bgColor,
            dpi: this.dpiSelect?.value || '300',
            customDpi: parseInt(this.customDpiInput?.value) || 300,
            format: this.format,
            quality: Math.round(this.quality * 100),
            fit1: this.fit1Select?.value || 'contain',
            fit2: this.fit2Select?.value || 'contain',
            enableTargetSize: this.enableTargetSize,
            targetSizeValue: this.targetSizeValue,
            targetSizeUnit: this.targetSizeUnit
        };
        try {
            localStorage.setItem('iptools_combiner_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('iptools_combiner_settings');
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.unit1 && this.unit1Select) {
                this.unit1 = s.unit1;
                this.unit1Select.value = s.unit1;
            }
            if (s.unit2 && this.unit2Select) {
                this.unit2 = s.unit2;
                this.unit2Select.value = s.unit2;
            }
            if (s.direction) {
                this.direction = s.direction;
                this.directionRadios.forEach(r => {
                    r.checked = (r.value === s.direction);
                });
            }
            if (s.align && this.alignSelect) this.alignSelect.value = s.align;
            if (s.gap !== undefined && this.gapInput) this.gapInput.value = s.gap;
            if (s.gapUnit && this.gapUnitSelect) this.gapUnitSelect.value = s.gapUnit;
            if (s.bgColor) {
                this.bgColor = s.bgColor;
                if (this.bgColorPicker) this.bgColorPicker.value = s.bgColor;
            if (this.bgColorLabel) this.bgColorLabel.textContent = s.bgColor.toUpperCase();
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
            if (s.format && this.formatSelect) {
                this.format = s.format;
                this.formatSelect.value = s.format;
            }
            if (s.quality !== undefined && this.qualitySlider) {
                this.quality = s.quality / 100;
                this.qualitySlider.value = s.quality;
                if (this.qualityVal) this.qualityVal.textContent = `${s.quality}%`;
            }
            if (s.fit1 && this.fit1Select) this.fit1Select.value = s.fit1;
            if (s.fit2 && this.fit2Select) this.fit2Select.value = s.fit2;
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
            console.error('Error loading combiner settings', e);
        }
    }
}

window.ImageCombiner = ImageCombiner;
