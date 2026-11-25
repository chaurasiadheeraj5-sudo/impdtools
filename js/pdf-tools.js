/**
 * IP TOOLS - PDF Tools Module
 * Complete suite for PDF operations: Resize, Split, Merge, and Edit (rotate, delete, reorder, watermark, stamp).
 * Powered by pdf-lib and PDF.js.
 */

class PDFTools {
    constructor() {
        this.activeTab = 'resize'; // 'resize' | 'split' | 'merge' | 'edit'

        // Resize state
        this.resizePdfFile = null;
        this.resizePdfDoc = null;

        // Split state
        this.splitPdfFile = null;
        this.splitPdfDoc = null;
        this.splitPagesMeta = []; // { pageNum, thumbnailDataUrl }

        // Merge state
        this.mergePdfFiles = []; // array of { file, name, size, pageCount }

        // Edit state
        this.editPdfFile = null;
        this.editPdfDoc = null;
        this.editPages = []; // array of { pageIndex, rotation, deleted, thumbnailDataUrl }
        this.editStampImage = null; // { file, img, buffer }

        this.initDOMElements();
        this.loadSettings();
        this.bindEvents();
        this.setupPdfJsWorker();
    }

    setupPdfJsWorker() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
        }
    }

    initDOMElements() {
        // Sub-tabs navigation
        this.tabButtons = document.querySelectorAll('.pdf-subtab-btn');
        this.tabPanels = document.querySelectorAll('.pdf-subtab-panel');

        // RESIZE ELEMENTS
        this.resizeDrop = document.getElementById('pdf-resize-drop');
        this.resizeInput = document.getElementById('pdf-resize-input');
        this.resizeControls = document.getElementById('pdf-resize-controls');
        this.resizeInfo = document.getElementById('pdf-resize-info');
        this.resizeTargetSelect = document.getElementById('pdf-resize-target');
        this.resizeCustomGroup = document.getElementById('pdf-resize-custom-group');
        this.resizeCustomW = document.getElementById('pdf-resize-custom-w');
        this.resizeCustomH = document.getElementById('pdf-resize-custom-h');
        this.resizeOrientSelect = document.getElementById('pdf-resize-orient');
        this.resizeFitSelect = document.getElementById('pdf-resize-fit');
        this.resizeEnableTargetSize = document.getElementById('pdf-resize-enable-target-size');
        this.resizeTargetSizeControls = document.getElementById('pdf-resize-target-size-controls');
        this.resizeTargetSizeInput = document.getElementById('pdf-resize-target-size');
        this.resizeTargetSizeUnit = document.getElementById('pdf-resize-target-size-unit');
        this.resizeSizePresetBtns = document.querySelectorAll('.pdf-resize-size-preset');
        this.resizeBtn = document.getElementById('pdf-resize-action-btn');
        this.resizeDoMoreBtn = document.getElementById('pdf-resize-do-more-btn');
        this.splitDoMoreBtn = document.getElementById('pdf-split-do-more-btn');
        this.mergeDoMoreBtn = document.getElementById('pdf-merge-do-more-btn');
        this.editDoMoreBtn = document.getElementById('pdf-edit-do-more-btn');
        this.imgToPdfDoMoreBtn = document.getElementById('img-to-pdf-do-more-btn');
        this.pdfToImgDoMoreBtn = document.getElementById('pdf-to-img-do-more-btn');

        // SPLIT ELEMENTS
        this.splitDrop = document.getElementById('pdf-split-drop');
        this.splitInput = document.getElementById('pdf-split-input');
        this.splitControls = document.getElementById('pdf-split-controls');
        this.splitInfo = document.getElementById('pdf-split-info');
        this.splitThumbsContainer = document.getElementById('pdf-split-thumbs');
        this.splitModeRadios = document.querySelectorAll('input[name="pdf-split-mode"]');
        this.splitRangeInput = document.getElementById('pdf-split-range');
        this.splitIntervalInput = document.getElementById('pdf-split-interval');
        this.splitRangeGroup = document.getElementById('pdf-split-range-group');
        this.splitIntervalGroup = document.getElementById('pdf-split-interval-group');
        this.splitBtn = document.getElementById('pdf-split-action-btn');

        // MERGE ELEMENTS
        this.mergeDrop = document.getElementById('pdf-merge-drop');
        this.mergeInput = document.getElementById('pdf-merge-input');
        this.mergeListContainer = document.getElementById('pdf-merge-list');
        this.mergeControls = document.getElementById('pdf-merge-controls');
        this.mergeBtn = document.getElementById('pdf-merge-action-btn');
        this.clearMergeBtn = document.getElementById('pdf-merge-clear-btn');

        // EDIT ELEMENTS
        this.editDrop = document.getElementById('pdf-edit-drop');
        this.editInput = document.getElementById('pdf-edit-input');
        this.editControls = document.getElementById('pdf-edit-controls');
        this.editInfo = document.getElementById('pdf-edit-info');
        this.editPagesGrid = document.getElementById('pdf-edit-pages-grid');

        this.rotateAllBtn = document.getElementById('pdf-edit-rotate-all');
        this.resetEditBtn = document.getElementById('pdf-edit-reset');

        // Watermark
        this.wmText = document.getElementById('pdf-edit-wm-text');
        this.wmSize = document.getElementById('pdf-edit-wm-size');
        this.wmColor = document.getElementById('pdf-edit-wm-color');
        this.wmOpacity = document.getElementById('pdf-edit-wm-opacity');
        this.wmAngle = document.getElementById('pdf-edit-wm-angle');

        // Stamp
        this.stampInput = document.getElementById('pdf-edit-stamp-input');
        this.stampPageSelect = document.getElementById('pdf-edit-stamp-page');
        this.stampPosSelect = document.getElementById('pdf-edit-stamp-pos');
        this.stampScaleInput = document.getElementById('pdf-edit-stamp-scale');

        // IMAGE TO PDF ELEMENTS
        this.imgToPdfDrop = document.getElementById('pdf-img-to-pdf-drop');
        this.imgToPdfInput = document.getElementById('pdf-img-to-pdf-input');
        this.imgToPdfControls = document.getElementById('pdf-img-to-pdf-controls');
        this.imgToPdfInfo = document.getElementById('pdf-img-to-pdf-info');
        this.imgToPdfCount = document.getElementById('img-to-pdf-count');
        this.imgToPdfThumbs = document.getElementById('img-to-pdf-thumbs');
        this.imgToPdfPageSize = document.getElementById('img-to-pdf-page-size');
        this.imgToPdfOrientation = document.getElementById('img-to-pdf-orientation');
        this.imgToPdfMargin = document.getElementById('img-to-pdf-margin');
        this.imgToPdfActionBtn = document.getElementById('img-to-pdf-action-btn');
        this.imgToPdfClearBtn = document.getElementById('img-to-pdf-clear-btn');
        this.imgToPdfList = []; // { file, img, buffer, dataUrl }

        // PDF TO IMAGE ELEMENTS
        this.pdfToImgDrop = document.getElementById('pdf-to-img-drop');
        this.pdfToImgInput = document.getElementById('pdf-to-img-input');
        this.pdfToImgControls = document.getElementById('pdf-to-img-controls');
        this.pdfToImgInfo = document.getElementById('pdf-to-img-info');
        this.pdfToImgPagesGrid = document.getElementById('pdf-to-img-pages-grid');
        this.pdfToImgFormat = document.getElementById('pdf-to-img-format');
        this.pdfToImgDpi = document.getElementById('pdf-to-img-dpi');
        this.pdfToImgQuality = document.getElementById('pdf-to-img-quality');
        this.pdfToImgQualityVal = document.getElementById('pdf-to-img-quality-val');
        this.pdfToImgQualityGroup = document.getElementById('pdf-to-img-quality-group');
        this.pdfToImgActionBtn = document.getElementById('pdf-to-img-action-btn');
        this.pdfToImgResetBtn = document.getElementById('pdf-to-img-reset-btn');
        this.pdfToImgFile = null;
        this.pdfToImgDoc = null;
        this.pdfToImgSelectedPages = [];

        this.editSaveBtn = document.getElementById('pdf-edit-save-btn');
    }

    bindEvents() {
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                this.switchTab(targetTab);
                this.saveSettings();
            });
        });

        // 1. RESIZE EVENTS
        if (this.resizeDrop) {
            this.resizeDrop.addEventListener('click', () => this.resizeInput.click());
            this.resizeInput.addEventListener('change', (e) => this.handleResizeFile(e.target.files[0]));
            this.setupDragDrop(this.resizeDrop, (f) => this.handleResizeFile(f));

            this.resizeTargetSelect.addEventListener('change', (e) => {
                this.resizeCustomGroup.style.display = (e.target.value === 'custom') ? 'grid' : 'none';
                this.saveSettings();
            });

            if (this.resizeCustomW) this.resizeCustomW.addEventListener('input', () => this.saveSettings());
            if (this.resizeCustomH) this.resizeCustomH.addEventListener('input', () => this.saveSettings());
            if (this.resizeOrientSelect) this.resizeOrientSelect.addEventListener('change', () => this.saveSettings());
            if (this.resizeFitSelect) this.resizeFitSelect.addEventListener('change', () => this.saveSettings());

            if (this.resizeEnableTargetSize) {
                this.resizeEnableTargetSize.addEventListener('change', (e) => {
                    if (this.resizeTargetSizeControls) {
                        this.resizeTargetSizeControls.style.display = e.target.checked ? 'flex' : 'none';
                    }
                    this.saveSettings();
                });
            }
            if (this.resizeTargetSizeInput) {
                this.resizeTargetSizeInput.addEventListener('input', () => this.saveSettings());
            }
            if (this.resizeTargetSizeUnit) {
                this.resizeTargetSizeUnit.addEventListener('change', () => this.saveSettings());
            }
            if (this.resizeSizePresetBtns) {
                this.resizeSizePresetBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const size = parseFloat(e.currentTarget.dataset.size) || 200;
                        const unit = e.currentTarget.dataset.unit || 'KB';
                        if (this.resizeTargetSizeInput) this.resizeTargetSizeInput.value = size;
                        if (this.resizeTargetSizeUnit) this.resizeTargetSizeUnit.value = unit;
                        this.saveSettings();
                    });
                });
            }

            this.resizeBtn.addEventListener('click', () => this.executeResize());
        }

        // 2. SPLIT EVENTS
        if (this.splitDrop) {
            this.splitDrop.addEventListener('click', () => this.splitInput.click());
            this.splitInput.addEventListener('change', (e) => this.handleSplitFile(e.target.files[0]));
            this.setupDragDrop(this.splitDrop, (f) => this.handleSplitFile(f));

            this.splitModeRadios.forEach(r => {
                r.addEventListener('change', (e) => {
                    const mode = e.target.value;
                    this.splitRangeGroup.style.display = (mode === 'range') ? 'block' : 'none';
                    this.splitIntervalGroup.style.display = (mode === 'interval') ? 'block' : 'none';
                    this.saveSettings();
                });
            });

            if (this.splitRangeInput) this.splitRangeInput.addEventListener('input', () => this.saveSettings());
            if (this.splitIntervalInput) this.splitIntervalInput.addEventListener('input', () => this.saveSettings());

            this.splitBtn.addEventListener('click', () => this.executeSplit());
        }

        // 3. MERGE EVENTS
        if (this.mergeDrop) {
            this.mergeDrop.addEventListener('click', () => this.mergeInput.click());
            this.mergeInput.addEventListener('change', (e) => this.handleMergeFiles(e.target.files));
            this.setupDragDrop(this.mergeDrop, (f) => this.handleMergeFiles([f]));

            this.mergeBtn.addEventListener('click', () => this.executeMerge());
            this.clearMergeBtn.addEventListener('click', () => {
                this.mergePdfFiles = [];
                this.renderMergeList();
            });
        }

        // 4. EDIT EVENTS
        if (this.editDrop) {
            this.editDrop.addEventListener('click', () => this.editInput.click());
            this.editInput.addEventListener('change', (e) => this.handleEditFile(e.target.files[0]));
            this.setupDragDrop(this.editDrop, (f) => this.handleEditFile(f));

            this.rotateAllBtn.addEventListener('click', () => this.rotateAllEditPages());
            this.resetEditBtn.addEventListener('click', () => this.resetEditPages());

            // Watermark inputs
            [this.wmText, this.wmSize, this.wmColor, this.wmOpacity, this.wmAngle].forEach(el => {
                if (el) el.addEventListener('input', () => this.saveSettings());
            });

            // Stamp inputs
            if (this.stampInput) {
                this.stampInput.addEventListener('change', (e) => this.handleStampUpload(e.target.files[0]));
            }
            if (this.stampPosSelect) this.stampPosSelect.addEventListener('change', () => this.saveSettings());
            if (this.stampScaleInput) this.stampScaleInput.addEventListener('input', () => this.saveSettings());

            this.editSaveBtn.addEventListener('click', () => this.executeEditSave());
        }
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        this.tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        this.tabPanels.forEach(p => p.classList.toggle('active', p.id === `pdf-${tabId}-panel`));
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

    /* =========================================================================
       1. RESIZE PDF IMPLEMENTATION
       ========================================================================= */

    async handleResizeFile(file) {
        if (!file || file.type !== 'application/pdf') {
            Utils.toast('Please select a valid PDF file', 'warning');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            this.resizePdfFile = file;
            this.resizePdfDoc = pdfDoc;

            const pageCount = pdfDoc.getPageCount();
            const firstPage = pdfDoc.getPage(0);
            const { width, height } = firstPage.getSize();

            const wMm = (width / 72) * 25.4;
            const hMm = (height / 72) * 25.4;

            this.resizeInfo.textContent = `${file.name} (${pageCount} page${pageCount > 1 ? 's' : ''}, Page 1: ${wMm.toFixed(1)} × ${hMm.toFixed(1)} mm / ${Math.round(width)} × ${Math.round(height)} pt)`;
            this.resizeControls.style.display = 'block';
            Utils.toast(`Loaded PDF with ${pageCount} pages`, 'success');
        } catch (err) {
            console.error(err);
            Utils.toast('Could not load PDF for resizing', 'error');
        }
    }

    async executeResize() {
        if (!this.resizePdfDoc || !this.resizePdfFile) return;

        this.resizeBtn.disabled = true;
        this.resizeBtn.textContent = 'Resizing PDF...';

        try {
            const buffer = await this.resizePdfFile.arrayBuffer();
            const srcDoc = await PDFLib.PDFDocument.load(buffer);

            const targetVal = this.resizeTargetSelect.value;
            const orient = this.resizeOrientSelect.value;
            const fitMode = this.resizeFitSelect.value;

            // Dimensions in mm
            let targetW_mm = 210;
            let targetH_mm = 297;

            switch (targetVal) {
                case 'a4': targetW_mm = 210; targetH_mm = 297; break;
                case 'a3': targetW_mm = 297; targetH_mm = 420; break;
                case 'a5': targetW_mm = 148; targetH_mm = 210; break;
                case 'letter': targetW_mm = 215.9; targetH_mm = 279.4; break;
                case 'legal': targetW_mm = 215.9; targetH_mm = 355.6; break;
                case 'custom':
                    targetW_mm = parseFloat(this.resizeCustomW.value) || 210;
                    targetH_mm = parseFloat(this.resizeCustomH.value) || 297;
                    break;
            }

            const mmToPt = 72 / 25.4;
            let targetW_pt = targetW_mm * mmToPt;
            let targetH_pt = targetH_mm * mmToPt;

            const pageCount = srcDoc.getPageCount();

            // Check Target File Size option
            const enableTargetSize = !!(this.resizeEnableTargetSize && this.resizeEnableTargetSize.checked);
            let targetBytes = 0;
            if (enableTargetSize) {
                const rawVal = parseFloat(this.resizeTargetSizeInput?.value) || 200;
                const unit = this.resizeTargetSizeUnit?.value || 'KB';
                targetBytes = (unit === 'MB' ? rawVal * 1024 * 1024 : rawVal * 1024);
                targetBytes = Math.max(10240, Math.round(targetBytes));
            }

            // Build standard vector resized document first
            const outDoc = await PDFLib.PDFDocument.create();

            for (let i = 0; i < pageCount; i++) {
                const srcPage = srcDoc.getPage(i);
                const { width: srcW, height: srcH } = srcPage.getSize();
                const srcIsLandscape = srcW > srcH;

                let pageTargetW = targetW_pt;
                let pageTargetH = targetH_pt;

                if (orient === 'auto') {
                    if (srcIsLandscape) {
                        pageTargetW = Math.max(targetW_pt, targetH_pt);
                        pageTargetH = Math.min(targetW_pt, targetH_pt);
                    } else {
                        pageTargetW = Math.min(targetW_pt, targetH_pt);
                        pageTargetH = Math.max(targetW_pt, targetH_pt);
                    }
                } else if (orient === 'landscape') {
                    pageTargetW = Math.max(targetW_pt, targetH_pt);
                    pageTargetH = Math.min(targetW_pt, targetH_pt);
                } else {
                    pageTargetW = Math.min(targetW_pt, targetH_pt);
                    pageTargetH = Math.max(targetW_pt, targetH_pt);
                }

                const [embeddedPage] = await outDoc.embedPages([srcPage]);
                const newPage = outDoc.addPage([pageTargetW, pageTargetH]);

                let scaleX = pageTargetW / srcW;
                let scaleY = pageTargetH / srcH;

                if (fitMode === 'contain') {
                    const scale = Math.min(scaleX, scaleY);
                    const drawW = srcW * scale;
                    const drawH = srcH * scale;
                    const x = (pageTargetW - drawW) / 2;
                    const y = (pageTargetH - drawH) / 2;
                    newPage.drawPage(embeddedPage, {
                        x,
                        y,
                        width: drawW,
                        height: drawH
                    });
                } else { // 'stretch'
                    newPage.drawPage(embeddedPage, {
                        x: 0,
                        y: 0,
                        width: pageTargetW,
                        height: pageTargetH
                    });
                }
            }

            const vectorBytes = await outDoc.save({ useObjectStreams: true });
            let outBytes = null;

            if (!enableTargetSize || vectorBytes.length <= targetBytes) {
                // Either target size wasn't checked, or vector-resized PDF already satisfies target size
                outBytes = vectorBytes;
            } else if (typeof pdfjsLib !== 'undefined') {
                // Vector PDF exceeds target size: rasterize pages & compress with budget targeting
                this.resizeBtn.textContent = 'Optimizing & compressing PDF...';

                const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                const compressedDoc = await PDFLib.PDFDocument.create();

                // Structural overhead (PDF catalog, xref, font/page dictionaries, object streams)
                const structuralOverhead = 2500 + (pageCount * 650);
                let remainingBudget = Math.max(pageCount * 1024, Math.floor((targetBytes - structuralOverhead) * 0.94));

                for (let i = 1; i <= pageCount; i++) {
                    this.resizeBtn.textContent = `Compressing page ${i}/${pageCount}...`;

                    const pagesLeft = (pageCount - i + 1);
                    const currentPageBudget = Math.max(1024, Math.floor(remainingBudget / pagesLeft));

                    const pdfJsPage = await pdfjsDoc.getPage(i);
                    // Render at scale 2.0 (approx 150 DPI) for clarity
                    const viewport = pdfJsPage.getViewport({ scale: 2.0 });

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(viewport.width);
                    canvas.height = Math.round(viewport.height);
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    await pdfJsPage.render({ canvasContext: ctx, viewport }).promise;

                    // Compress canvas using binary search quality + adaptive downscaling to fit currentPageBudget
                    const compressedResult = await Utils.canvasToTargetSizeBlob(canvas, 'image/jpeg', currentPageBudget, 150);
                    let imgBytes;
                    if (compressedResult && compressedResult.blob) {
                        imgBytes = await compressedResult.blob.arrayBuffer();
                    } else {
                        const fallbackBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.5));
                        imgBytes = await fallbackBlob.arrayBuffer();
                    }

                    // Update remaining budget for subsequent pages
                    remainingBudget = Math.max(0, remainingBudget - imgBytes.byteLength);

                    const embeddedJpg = await compressedDoc.embedJpg(imgBytes);

                    // Determine page orientation and dimensions
                    const srcIsLandscape = viewport.width > viewport.height;
                    let pageTargetW = targetW_pt;
                    let pageTargetH = targetH_pt;

                    if (orient === 'auto') {
                        if (srcIsLandscape) {
                            pageTargetW = Math.max(targetW_pt, targetH_pt);
                            pageTargetH = Math.min(targetW_pt, targetH_pt);
                        } else {
                            pageTargetW = Math.min(targetW_pt, targetH_pt);
                            pageTargetH = Math.max(targetW_pt, targetH_pt);
                        }
                    } else if (orient === 'landscape') {
                        pageTargetW = Math.max(targetW_pt, targetH_pt);
                        pageTargetH = Math.min(targetW_pt, targetH_pt);
                    } else {
                        pageTargetW = Math.min(targetW_pt, targetH_pt);
                        pageTargetH = Math.max(targetW_pt, targetH_pt);
                    }

                    const newPage = compressedDoc.addPage([pageTargetW, pageTargetH]);

                    if (fitMode === 'contain') {
                        const scaleX = pageTargetW / embeddedJpg.width;
                        const scaleY = pageTargetH / embeddedJpg.height;
                        const scale = Math.min(scaleX, scaleY);
                        const drawW = embeddedJpg.width * scale;
                        const drawH = embeddedJpg.height * scale;
                        const x = (pageTargetW - drawW) / 2;
                        const y = (pageTargetH - drawH) / 2;
                        newPage.drawImage(embeddedJpg, {
                            x,
                            y,
                            width: drawW,
                            height: drawH
                        });
                    } else { // 'stretch'
                        newPage.drawImage(embeddedJpg, {
                            x: 0,
                            y: 0,
                            width: pageTargetW,
                            height: pageTargetH
                        });
                    }
                }

                outBytes = await compressedDoc.save({ useObjectStreams: true });
            } else {
                outBytes = vectorBytes;
            }

            const blob = new Blob([outBytes], { type: 'application/pdf' });
            const baseName = this.resizePdfFile.name.replace(/\.[^/.]+$/, '');
            Utils.downloadBlob(blob, `${baseName}_resized_${targetVal}.pdf`);

            const formattedActual = Utils.formatBytes(outBytes.length);
            if (enableTargetSize) {
                Utils.toast(`Resized PDF (${formattedActual}, Target: ${Utils.formatBytes(targetBytes)}) downloaded!`, 'success');
            } else {
                Utils.toast(`Resized PDF downloaded successfully (${formattedActual})!`, 'success');
            }
        } catch (err) {
            console.error('Resize PDF error', err);
            Utils.toast('Failed to resize PDF', 'error');
        } finally {
            this.resizeBtn.disabled = false;
            this.resizeBtn.textContent = 'Resize and Download PDF';
        }
    }

    /* =========================================================================
       2. SPLIT PDF IMPLEMENTATION
       ========================================================================= */

    async handleSplitFile(file) {
        if (!file || file.type !== 'application/pdf') {
            Utils.toast('Please select a valid PDF file', 'warning');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            this.splitPdfFile = file;
            this.splitPdfDoc = pdfDoc;

            const pageCount = pdfDoc.getPageCount();
            this.splitInfo.textContent = `${file.name} (${pageCount} page${pageCount > 1 ? 's' : ''})`;
            this.splitControls.style.display = 'block';

            // Render thumbnails using PDF.js
            await this.renderSplitThumbnails(buffer, pageCount);
            Utils.toast(`Loaded PDF with ${pageCount} pages for splitting`, 'success');
        } catch (err) {
            console.error(err);
            Utils.toast('Could not load PDF for splitting', 'error');
        }
    }

    async renderSplitThumbnails(arrayBuffer, pageCount) {
        if (!this.splitThumbsContainer) return;
        this.splitThumbsContainer.innerHTML = '<div class="loading-spinner">Generating thumbnails...</div>';

        try {
            const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            this.splitThumbsContainer.innerHTML = '';

            for (let i = 1; i <= pageCount; i++) {
                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');

                await page.render({ canvasContext: ctx, viewport }).promise;

                const card = document.createElement('div');
                card.className = 'pdf-thumb-card';
                card.innerHTML = `
                    <label class="pdf-thumb-check">
                        <input type="checkbox" class="split-page-checkbox" data-page="${i}" checked>
                        <span>Page ${i}</span>
                    </label>
                    <div class="thumb-canvas-wrap"></div>
                `;
                card.querySelector('.thumb-canvas-wrap').appendChild(canvas);

                card.querySelector('input').addEventListener('change', () => this.syncSplitRangeFromCheckboxes());

                this.splitThumbsContainer.appendChild(card);
            }

            this.syncSplitRangeFromCheckboxes();
        } catch (err) {
            console.error('Thumbnail generation error', err);
            this.splitThumbsContainer.innerHTML = '<p class="text-muted">Thumbnails unavailable, but you can still split by range or interval above.</p>';
        }
    }

    syncSplitRangeFromCheckboxes() {
        const checkboxes = this.splitThumbsContainer.querySelectorAll('.split-page-checkbox:checked');
        const selected = Array.from(checkboxes).map(cb => parseInt(cb.dataset.page)).sort((a, b) => a - b);
        this.splitRangeInput.value = this.compressPageNumbersToRange(selected);
    }

    compressPageNumbersToRange(numbers) {
        if (!numbers.length) return '';
        const ranges = [];
        let start = numbers[0];
        let end = numbers[0];

        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] === end + 1) {
                end = numbers[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                start = numbers[i];
                end = numbers[i];
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        return ranges.join(', ');
    }

    parsePageRangeString(rangeStr, maxPages) {
        const pages = new Set();
        const parts = rangeStr.split(',');

        for (const part of parts) {
            const clean = part.trim();
            if (!clean) continue;
            if (clean.includes('-')) {
                const [startStr, endStr] = clean.split('-');
                const s = parseInt(startStr);
                const e = parseInt(endStr);
                if (!isNaN(s) && !isNaN(e)) {
                    for (let p = Math.min(s, e); p <= Math.max(s, e); p++) {
                        if (p >= 1 && p <= maxPages) pages.add(p);
                    }
                }
            } else {
                const p = parseInt(clean);
                if (!isNaN(p) && p >= 1 && p <= maxPages) pages.add(p);
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }

    async executeSplit() {
        if (!this.splitPdfDoc || !this.splitPdfFile) return;

        this.splitBtn.disabled = true;
        this.splitBtn.textContent = 'Processing Split...';

        try {
            const buffer = await this.splitPdfFile.arrayBuffer();
            const srcDoc = await PDFLib.PDFDocument.load(buffer);
            const totalPages = srcDoc.getPageCount();
            const mode = document.querySelector('input[name="pdf-split-mode"]:checked').value;
            const baseName = this.splitPdfFile.name.replace(/\.[^/.]+$/, '');

            if (mode === 'all') {
                // Split all into individual single page PDFs in a ZIP archive
                if (typeof JSZip === 'undefined') {
                    Utils.toast('JSZip library required for ZIP generation', 'error');
                    return;
                }

                const zip = new JSZip();
                for (let i = 0; i < totalPages; i++) {
                    const singleDoc = await PDFLib.PDFDocument.create();
                    const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
                    singleDoc.addPage(copiedPage);
                    const bytes = await singleDoc.save();
                    zip.file(`${baseName}_page_${i + 1}.pdf`, bytes);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                Utils.downloadBlob(zipBlob, `${baseName}_split_all_pages.zip`);
                Utils.toast(`Split all ${totalPages} pages into individual PDFs!`, 'success');

            } else if (mode === 'interval') {
                const interval = Math.max(1, parseInt(this.splitIntervalInput.value) || 1);
                const zip = new JSZip();
                let fileIndex = 1;

                for (let start = 0; start < totalPages; start += interval) {
                    const end = Math.min(start + interval, totalPages);
                    const chunkIndices = [];
                    for (let i = start; i < end; i++) chunkIndices.push(i);

                    const chunkDoc = await PDFLib.PDFDocument.create();
                    const copied = await chunkDoc.copyPages(srcDoc, chunkIndices);
                    copied.forEach(p => chunkDoc.addPage(p));
                    const bytes = await chunkDoc.save();
                    zip.file(`${baseName}_part_${fileIndex}_pages_${start + 1}-${end}.pdf`, bytes);
                    fileIndex++;
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                Utils.downloadBlob(zipBlob, `${baseName}_split_every_${interval}_pages.zip`);
                Utils.toast(`Split PDF by interval of ${interval} pages!`, 'success');

            } else { // 'range'
                const selectedPages = this.parsePageRangeString(this.splitRangeInput.value, totalPages);
                if (selectedPages.length === 0) {
                    Utils.toast('Please select or specify at least one valid page range', 'warning');
                    return;
                }

                const outDoc = await PDFLib.PDFDocument.create();
                const zeroIndexed = selectedPages.map(p => p - 1);
                const copiedPages = await outDoc.copyPages(srcDoc, zeroIndexed);
                copiedPages.forEach(p => outDoc.addPage(p));

                const outBytes = await outDoc.save();
                const blob = new Blob([outBytes], { type: 'application/pdf' });
                Utils.downloadBlob(blob, `${baseName}_extracted_pages_${selectedPages.join('_')}.pdf`);
                Utils.toast(`Extracted ${selectedPages.length} pages successfully!`, 'success');
            }

        } catch (err) {
            console.error('Split error', err);
            Utils.toast('Failed to split PDF', 'error');
        } finally {
            this.splitBtn.disabled = false;
            this.splitBtn.textContent = 'Split and Download';
        }
    }

    /* =========================================================================
       3. MERGE PDF IMPLEMENTATION
       ========================================================================= */

    async handleMergeFiles(files) {
        if (!files || files.length === 0) return;
        const validPdfs = Array.from(files).filter(f => f.type === 'application/pdf');

        if (validPdfs.length === 0) {
            Utils.toast('Please select valid PDF files', 'warning');
            return;
        }

        for (const file of validPdfs) {
            try {
                const buffer = await file.arrayBuffer();
                const doc = await PDFLib.PDFDocument.load(buffer);
                this.mergePdfFiles.push({
                    file,
                    name: file.name,
                    size: file.size,
                    pageCount: doc.getPageCount()
                });
            } catch (err) {
                console.error('Merge file load error', err);
            }
        }

        this.renderMergeList();
        Utils.toast(`Added ${validPdfs.length} PDF file(s) to merge list`, 'info');
    }

    renderMergeList() {
        if (!this.mergeListContainer) return;
        this.mergeListContainer.innerHTML = '';

        if (this.mergePdfFiles.length === 0) {
            this.mergeControls.style.display = 'none';
            return;
        }

        this.mergeControls.style.display = 'block';

        this.mergePdfFiles.forEach((item, index) => {
            const itemRow = document.createElement('div');
            itemRow.className = 'pdf-merge-item';
            itemRow.innerHTML = `
                <div class="merge-item-info">
                    <span class="merge-order">${index + 1}</span>
                    <span class="merge-name">${item.name}</span>
                    <span class="merge-badge">${item.pageCount} page${item.pageCount > 1 ? 's' : ''}</span>
                    <span class="merge-size">${Utils.formatBytes(item.size)}</span>
                </div>
                <div class="merge-item-actions">
                    <button class="btn-icon" data-action="up" ${index === 0 ? 'disabled' : ''} title="Move Up">↑</button>
                    <button class="btn-icon" data-action="down" ${index === this.mergePdfFiles.length - 1 ? 'disabled' : ''} title="Move Down">↓</button>
                    <button class="btn-icon btn-danger" data-action="remove" title="Remove">&times;</button>
                </div>
            `;

            itemRow.querySelector('[data-action="up"]').addEventListener('click', () => {
                if (index > 0) {
                    const temp = this.mergePdfFiles[index];
                    this.mergePdfFiles[index] = this.mergePdfFiles[index - 1];
                    this.mergePdfFiles[index - 1] = temp;
                    this.renderMergeList();
                }
            });

            itemRow.querySelector('[data-action="down"]').addEventListener('click', () => {
                if (index < this.mergePdfFiles.length - 1) {
                    const temp = this.mergePdfFiles[index];
                    this.mergePdfFiles[index] = this.mergePdfFiles[index + 1];
                    this.mergePdfFiles[index + 1] = temp;
                    this.renderMergeList();
                }
            });

            itemRow.querySelector('[data-action="remove"]').addEventListener('click', () => {
                this.mergePdfFiles.splice(index, 1);
                this.renderMergeList();
            });

            this.mergeListContainer.appendChild(itemRow);
        });
    }

    async executeMerge() {
        if (this.mergePdfFiles.length < 2) {
            Utils.toast('Please add at least 2 PDF files to merge', 'warning');
            return;
        }

        this.mergeBtn.disabled = true;
        this.mergeBtn.textContent = 'Merging PDFs...';

        try {
            const mergedDoc = await PDFLib.PDFDocument.create();

            for (const item of this.mergePdfFiles) {
                const buffer = await item.file.arrayBuffer();
                const srcDoc = await PDFLib.PDFDocument.load(buffer);
                const pageIndices = [];
                for (let i = 0; i < srcDoc.getPageCount(); i++) pageIndices.push(i);

                const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
                copiedPages.forEach(p => mergedDoc.addPage(p));
            }

            const outBytes = await mergedDoc.save();
            const blob = new Blob([outBytes], { type: 'application/pdf' });
            Utils.downloadBlob(blob, `merged_${this.mergePdfFiles.length}_documents.pdf`);
            Utils.toast(`Merged ${this.mergePdfFiles.length} PDF files successfully!`, 'success');
        } catch (err) {
            console.error('Merge error', err);
            Utils.toast('Failed to merge PDF files', 'error');
        } finally {
            this.mergeBtn.disabled = false;
            this.mergeBtn.textContent = 'Merge All PDFs';
        }
    }

    /* =========================================================================
       4. EDIT PDF IMPLEMENTATION (Rotate, Delete, Reorder, Watermark, Stamp)
       ========================================================================= */

    async handleEditFile(file) {
        if (!file || file.type !== 'application/pdf') {
            Utils.toast('Please select a valid PDF file', 'warning');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            this.editPdfFile = file;
            this.editPdfDoc = pdfDoc;

            const pageCount = pdfDoc.getPageCount();
            this.editInfo.textContent = `${file.name} (${pageCount} page${pageCount > 1 ? 's' : ''})`;
            this.editControls.style.display = 'block';

            // Populate stamp target page dropdown
            if (this.stampPageSelect) {
                this.stampPageSelect.innerHTML = `<option value="all">All Pages</option><option value="last" selected>Last Page</option><option value="first">First Page</option>`;
                for (let i = 1; i <= pageCount; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = `Page ${i}`;
                    this.stampPageSelect.appendChild(opt);
                }
            }

            // Initialize edit state pages
            this.editPages = [];
            for (let i = 0; i < pageCount; i++) {
                this.editPages.push({
                    originalIndex: i,
                    rotation: 0,
                    deleted: false
                });
            }

            await this.renderEditPagesGrid(buffer);
            Utils.toast(`Loaded PDF for editing (${pageCount} pages)`, 'success');
        } catch (err) {
            console.error(err);
            Utils.toast('Could not load PDF for editing', 'error');
        }
    }

    async renderEditPagesGrid(arrayBuffer) {
        if (!this.editPagesGrid) return;
        this.editPagesGrid.innerHTML = '<div class="loading-spinner">Rendering pages...</div>';

        try {
            const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            this.editPagesGrid.innerHTML = '';

            for (let i = 0; i < this.editPages.length; i++) {
                const pageState = this.editPages[i];
                if (pageState.deleted) continue;

                const page = await pdfjsDoc.getPage(pageState.originalIndex + 1);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;

                const card = document.createElement('div');
                card.className = `pdf-edit-card ${pageState.deleted ? 'deleted' : ''}`;
                card.id = `edit-card-${i}`;

                card.innerHTML = `
                    <div class="edit-card-header">
                        <span class="card-page-num">Page ${i + 1} (Orig: #${pageState.originalIndex + 1})</span>
                        <button class="btn-icon btn-danger card-delete-btn" title="Delete Page">&times;</button>
                    </div>
                    <div class="edit-card-preview" style="transform: rotate(${pageState.rotation}deg);"></div>
                    <div class="edit-card-actions">
                        <button class="btn-sm card-rot-left" title="Rotate Left">⟲ 90°</button>
                        <button class="btn-sm card-rot-right" title="Rotate Right">⟳ 90°</button>
                        <button class="btn-sm card-move-left" ${i === 0 ? 'disabled' : ''} title="Move Left">←</button>
                        <button class="btn-sm card-move-right" ${i === this.editPages.length - 1 ? 'disabled' : ''} title="Move Right">→</button>
                    </div>
                `;

                card.querySelector('.edit-card-preview').appendChild(canvas);

                // Per-card events
                card.querySelector('.card-rot-left').addEventListener('click', () => {
                    pageState.rotation = (pageState.rotation - 90 + 360) % 360;
                    card.querySelector('.edit-card-preview').style.transform = `rotate(${pageState.rotation}deg)`;
                });

                card.querySelector('.card-rot-right').addEventListener('click', () => {
                    pageState.rotation = (pageState.rotation + 90) % 360;
                    card.querySelector('.edit-card-preview').style.transform = `rotate(${pageState.rotation}deg)`;
                });

                card.querySelector('.card-delete-btn').addEventListener('click', () => {
                    pageState.deleted = true;
                    card.remove();
                    Utils.toast(`Page ${i + 1} marked for deletion`, 'info');
                });

                card.querySelector('.card-move-left').addEventListener('click', () => {
                    if (i > 0) {
                        const temp = this.editPages[i];
                        this.editPages[i] = this.editPages[i - 1];
                        this.editPages[i - 1] = temp;
                        this.reRenderEditCards();
                    }
                });

                card.querySelector('.card-move-right').addEventListener('click', () => {
                    if (i < this.editPages.length - 1) {
                        const temp = this.editPages[i];
                        this.editPages[i] = this.editPages[i + 1];
                        this.editPages[i + 1] = temp;
                        this.reRenderEditCards();
                    }
                });

                this.editPagesGrid.appendChild(card);
            }
        } catch (err) {
            console.error(err);
            this.editPagesGrid.innerHTML = '<p class="text-danger">Failed to render page previews</p>';
        }
    }

    reRenderEditCards() {
        this.handleEditFile(this.editPdfFile);
    }

    rotateAllEditPages() {
        this.editPages.forEach(p => {
            p.rotation = (p.rotation + 90) % 360;
        });
        document.querySelectorAll('.edit-card-preview').forEach((preview, idx) => {
            if (this.editPages[idx]) {
                preview.style.transform = `rotate(${this.editPages[idx].rotation}deg)`;
            }
        });
        Utils.toast('Rotated all pages 90° clockwise', 'info');
    }

    resetEditPages() {
        if (!this.editPdfFile) return;
        this.handleEditFile(this.editPdfFile);
        Utils.toast('Reset all page edits', 'info');
    }

    async handleStampUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            Utils.toast('Please select a valid image file for stamp/signature', 'warning');
            return;
        }

        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            const img = await Utils.loadImage(dataUrl);
            const buffer = await file.arrayBuffer();
            this.editStampImage = { file, img, buffer, dataUrl };
            Utils.toast(`Stamp/Signature loaded: ${file.name}`, 'success');
        } catch (err) {
            console.error('Stamp load error', err);
            Utils.toast('Could not load stamp image', 'error');
        }
    }

    async executeEditSave() {
        if (!this.editPdfFile) return;

        this.editSaveBtn.disabled = true;
        this.editSaveBtn.textContent = 'Saving changes...';

        try {
            const buffer = await this.editPdfFile.arrayBuffer();
            const srcDoc = await PDFLib.PDFDocument.load(buffer);
            const outDoc = await PDFLib.PDFDocument.create();

            const nonDeletedPages = this.editPages.filter(p => !p.deleted);
            if (nonDeletedPages.length === 0) {
                Utils.toast('All pages have been deleted. Nothing to save.', 'warning');
                return;
            }

            // Copy pages in current custom order
            for (let i = 0; i < nonDeletedPages.length; i++) {
                const pageState = nonDeletedPages[i];
                const [copiedPage] = await outDoc.copyPages(srcDoc, [pageState.originalIndex]);

                // Apply rotation
                if (pageState.rotation !== 0) {
                    const currentRot = copiedPage.getRotation().angle;
                    copiedPage.setRotation(PDFLib.degrees(currentRot + pageState.rotation));
                }

                outDoc.addPage(copiedPage);
            }

            // Apply Watermark if text is provided
            const wmTextStr = this.wmText ? this.wmText.value.trim() : '';
            if (wmTextStr) {
                const fontSize = parseFloat(this.wmSize.value) || 40;
                const opacity = parseFloat(this.wmOpacity.value) || 0.3;
                const angleDeg = parseFloat(this.wmAngle.value) || 45;

                const hex = (this.wmColor.value || '#FF0000').replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
                const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
                const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

                const font = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
                const outPages = outDoc.getPages();

                for (const p of outPages) {
                    const { width, height } = p.getSize();
                    const textWidth = font.widthOfTextAtSize(wmTextStr, fontSize);

                    // Center
                    const x = (width - textWidth) / 2;
                    const y = height / 2;

                    p.drawText(wmTextStr, {
                        x,
                        y,
                        size: fontSize,
                        font,
                        color: PDFLib.rgb(r, g, b),
                        opacity,
                        rotate: PDFLib.degrees(angleDeg)
                    });
                }
            }

            // Apply Stamp / Signature if uploaded
            if (this.editStampImage) {
                let stampEmbedded = null;
                if (this.editStampImage.file.type === 'image/jpeg' || this.editStampImage.file.type === 'image/jpg') {
                    stampEmbedded = await outDoc.embedJpg(this.editStampImage.buffer);
                } else {
                    stampEmbedded = await outDoc.embedPng(this.editStampImage.buffer);
                }

                const outPages = outDoc.getPages();
                const targetPageSpec = this.stampPageSelect.value;
                const pos = this.stampPosSelect.value;
                const scale = (parseFloat(this.stampScaleInput.value) || 100) / 100;

                const stampW = stampEmbedded.width * scale * 0.3;
                const stampH = stampEmbedded.height * scale * 0.3;

                const applyToPage = (p) => {
                    const { width, height } = p.getSize();
                    let x = 50, y = 50;

                    if (pos === 'bottom-right') {
                        x = width - stampW - 40;
                        y = 40;
                    } else if (pos === 'bottom-left') {
                        x = 40;
                        y = 40;
                    } else if (pos === 'center') {
                        x = (width - stampW) / 2;
                        y = (height - stampH) / 2;
                    } else if (pos === 'top-right') {
                        x = width - stampW - 40;
                        y = height - stampH - 40;
                    }

                    p.drawImage(stampEmbedded, {
                        x,
                        y,
                        width: stampW,
                        height: stampH
                    });
                };

                if (targetPageSpec === 'all') {
                    outPages.forEach(applyToPage);
                } else if (targetPageSpec === 'last') {
                    applyToPage(outPages[outPages.length - 1]);
                } else if (targetPageSpec === 'first') {
                    applyToPage(outPages[0]);
                } else {
                    const pageNum = parseInt(targetPageSpec);
                    if (pageNum >= 1 && pageNum <= outPages.length) {
                        applyToPage(outPages[pageNum - 1]);
                    }
                }
            }

            const outBytes = await outDoc.save();
            const blob = new Blob([outBytes], { type: 'application/pdf' });
            const baseName = this.editPdfFile.name.replace(/\.[^/.]+$/, '');
            Utils.downloadBlob(blob, `${baseName}_edited.pdf`);
            Utils.toast('Edited PDF saved and downloaded successfully!', 'success');

        } catch (err) {
            console.error('Edit PDF save error', err);
            Utils.toast('Failed to save edited PDF', 'error');
        } finally {
            this.editSaveBtn.disabled = false;
            this.editSaveBtn.textContent = 'Save & Download Edited PDF';
        }
    }
    /* =========================================================================
       SETTINGS PERSISTENCE (REMEMBERED ON PAGE RELOAD)
       ========================================================================= */

    saveSettings() {
        const settings = {
            activeTab: this.activeTab,
            resizeTarget: this.resizeTargetSelect?.value || 'a4',
            resizeCustomW: parseFloat(this.resizeCustomW?.value) || 210,
            resizeCustomH: parseFloat(this.resizeCustomH?.value) || 297,
            resizeOrient: this.resizeOrientSelect?.value || 'auto',
            resizeFit: this.resizeFitSelect?.value || 'contain',
            resizeEnableTargetSize: !!this.resizeEnableTargetSize?.checked,
            resizeTargetSize: parseFloat(this.resizeTargetSizeInput?.value) || 200,
            resizeTargetSizeUnit: this.resizeTargetSizeUnit?.value || 'KB',
            splitMode: document.querySelector('input[name="pdf-split-mode"]:checked')?.value || 'all',
            splitRange: this.splitRangeInput?.value || '1-3',
            splitInterval: parseInt(this.splitIntervalInput?.value) || 1,
            wmText: this.wmText?.value || '',
            wmSize: parseInt(this.wmSize?.value) || 40,
            wmColor: this.wmColor?.value || '#888888',
            wmOpacity: parseFloat(this.wmOpacity?.value) || 0.3,
            wmAngle: parseInt(this.wmAngle?.value) || 45,
            stampPos: this.stampPosSelect?.value || 'bottom-right',
            stampScale: parseFloat(this.stampScaleInput?.value) || 1
        };
        try {
            localStorage.setItem('iptools_pdf_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('iptools_pdf_settings');
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.activeTab) {
                this.switchTab(s.activeTab);
            }
            if (s.resizeTarget && this.resizeTargetSelect) {
                this.resizeTargetSelect.value = s.resizeTarget;
                if (this.resizeCustomGroup) {
                    this.resizeCustomGroup.style.display = (s.resizeTarget === 'custom') ? 'grid' : 'none';
                }
            }
            if (s.resizeCustomW && this.resizeCustomW) this.resizeCustomW.value = s.resizeCustomW;
            if (s.resizeCustomH && this.resizeCustomH) this.resizeCustomH.value = s.resizeCustomH;
            if (s.resizeOrient && this.resizeOrientSelect) this.resizeOrientSelect.value = s.resizeOrient;
            if (s.resizeFit && this.resizeFitSelect) this.resizeFitSelect.value = s.resizeFit;
            if (s.resizeEnableTargetSize !== undefined && this.resizeEnableTargetSize) {
                this.resizeEnableTargetSize.checked = s.resizeEnableTargetSize;
                if (this.resizeTargetSizeControls) {
                    this.resizeTargetSizeControls.style.display = s.resizeEnableTargetSize ? 'flex' : 'none';
                }
            }
            if (s.resizeTargetSize && this.resizeTargetSizeInput) {
                this.resizeTargetSizeInput.value = s.resizeTargetSize;
            }
            if (s.resizeTargetSizeUnit && this.resizeTargetSizeUnit) {
                this.resizeTargetSizeUnit.value = s.resizeTargetSizeUnit;
            }

            if (s.splitMode && this.splitModeRadios) {
                this.splitModeRadios.forEach(r => {
                    r.checked = (r.value === s.splitMode);
                });
                if (this.splitRangeGroup) {
                    this.splitRangeGroup.style.display = (s.splitMode === 'range') ? 'block' : 'none';
                }
                if (this.splitIntervalGroup) {
                    this.splitIntervalGroup.style.display = (s.splitMode === 'interval') ? 'block' : 'none';
                }
            }
            if (s.splitRange && this.splitRangeInput) this.splitRangeInput.value = s.splitRange;
            if (s.splitInterval && this.splitIntervalInput) this.splitIntervalInput.value = s.splitInterval;

            if (s.wmText !== undefined && this.wmText) this.wmText.value = s.wmText;
            if (s.wmSize && this.wmSize) this.wmSize.value = s.wmSize;
            if (s.wmColor && this.wmColor) this.wmColor.value = s.wmColor;
            if (s.wmOpacity !== undefined && this.wmOpacity) this.wmOpacity.value = s.wmOpacity;
            if (s.wmAngle !== undefined && this.wmAngle) this.wmAngle.value = s.wmAngle;

            if (s.stampPos && this.stampPosSelect) this.stampPosSelect.value = s.stampPos;
            if (s.stampScale && this.stampScaleInput) this.stampScaleInput.value = s.stampScale;
        } catch (e) {
            console.error('Error loading PDF settings', e);
        }
    }

    // =========================================================================
    // 5. IMAGE TO PDF IMPLEMENTATION
    // =========================================================================
    async handleImageToPdfFiles(files) {
        if (!files || !files.length) return;
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!validFiles.length) {
            Utils.toast('Please select valid image files (JPG, PNG, WEBP)', 'warning');
            return;
        }

        Utils.toast(`Loading ${validFiles.length} image(s)...`, 'info', 1000);
        for (const file of validFiles) {
            try {
                const dataUrl = await Utils.readFileAsDataURL(file);
                const buffer = await Utils.readFileAsArrayBuffer(file);
                const img = await Utils.loadImage(dataUrl);
                this.imgToPdfList.push({ file, img, buffer, dataUrl });
            } catch (err) {
                console.error('Error loading image for PDF', err);
            }
        }

        this.renderImageToPdfUI();
    }

    renderImageToPdfUI() {
        if (!this.imgToPdfControls || !this.imgToPdfThumbs) return;
        if (!this.imgToPdfList.length) {
            this.imgToPdfControls.style.display = 'none';
            if (this.imgToPdfDrop) this.imgToPdfDrop.style.display = 'flex';
            return;
        }

        if (this.imgToPdfDrop) this.imgToPdfDrop.style.display = 'flex';
        this.imgToPdfControls.style.display = 'block';
        if (this.imgToPdfCount) this.imgToPdfCount.textContent = this.imgToPdfList.length;
        if (this.imgToPdfInfo) {
            const totalBytes = this.imgToPdfList.reduce((acc, cur) => acc + cur.file.size, 0);
            this.imgToPdfInfo.textContent = `${this.imgToPdfList.length} image(s) ready &bull; Total ${Utils.formatBytes(totalBytes)}`;
        }

        this.imgToPdfThumbs.innerHTML = '';
        this.imgToPdfList.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'img-to-pdf-thumb-card';
            card.innerHTML = `
                <div class="thumb-img-wrap">
                    <img src="${item.dataUrl}" alt="${item.file.name}">
                    <button type="button" class="thumb-delete-btn" data-index="${idx}" title="Remove image">&times;</button>
                </div>
                <div class="thumb-title" title="${item.file.name}">${item.file.name}</div>
                <div class="thumb-meta">${item.img.naturalWidth} &times; ${item.img.naturalHeight}</div>
            `;
            card.querySelector('.thumb-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.imgToPdfList.splice(idx, 1);
                this.renderImageToPdfUI();
            });
            this.imgToPdfThumbs.appendChild(card);
        });
    }

    clearImageToPdf() {
        this.imgToPdfList = [];
        this.renderImageToPdfUI();
        if (this.imgToPdfInput) this.imgToPdfInput.value = '';
    }

    async convertImagesToPdf() {
        if (!this.imgToPdfList.length) {
            Utils.toast('Please add at least one image', 'warning');
            return;
        }
        if (typeof PDFLib === 'undefined') {
            Utils.toast('PDF library is loading. Please try again.', 'error');
            return;
        }

        try {
            Utils.toast('Creating PDF from images...', 'info', 2000);
            const pdfDoc = await PDFLib.PDFDocument.create();
            const pageSizeVal = this.imgToPdfPageSize ? this.imgToPdfPageSize.value : 'a4';
            const orientVal = this.imgToPdfOrientation ? this.imgToPdfOrientation.value : 'portrait';
            const marginVal = this.imgToPdfMargin ? this.imgToPdfMargin.value : 'none';

            for (const item of this.imgToPdfList) {
                let embeddedImg;
                if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
                    embeddedImg = await pdfDoc.embedJpg(item.buffer);
                } else if (item.file.type === 'image/png') {
                    try {
                        embeddedImg = await pdfDoc.embedPng(item.buffer);
                    } catch (e) {
                        const canvas = document.createElement('canvas');
                        canvas.width = item.img.naturalWidth;
                        canvas.height = item.img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(item.img, 0, 0);
                        const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        const jpgBytes = Utils.dataURLToArrayBuffer(jpgDataUrl);
                        embeddedImg = await pdfDoc.embedJpg(jpgBytes);
                    }
                } else {
                    const canvas = document.createElement('canvas');
                    canvas.width = item.img.naturalWidth;
                    canvas.height = item.img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(item.img, 0, 0);
                    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    const jpgBytes = Utils.dataURLToArrayBuffer(jpgDataUrl);
                    embeddedImg = await pdfDoc.embedJpg(jpgBytes);
                }

                let pageW, pageH;
                const isLandscape = (orientVal === 'landscape') || (orientVal === 'auto' && embeddedImg.width > embeddedImg.height);
                if (pageSizeVal === 'fit') {
                    pageW = embeddedImg.width;
                    pageH = embeddedImg.height;
                } else if (pageSizeVal === 'letter') {
                    pageW = isLandscape ? 792 : 612;
                    pageH = isLandscape ? 612 : 792;
                } else { // a4
                    pageW = isLandscape ? 841.89 : 595.28;
                    pageH = isLandscape ? 595.28 : 841.89;
                }

                const marginPt = marginVal === 'none' ? 0 : (marginVal === 'small' ? 14.17 : 28.35);
                const availW = Math.max(pageW - (marginPt * 2), 20);
                const availH = Math.max(pageH - (marginPt * 2), 20);
                const scale = Math.min(availW / embeddedImg.width, availH / embeddedImg.height, 1);
                const drawW = embeddedImg.width * scale;
                const drawH = embeddedImg.height * scale;
                const drawX = marginPt + (availW - drawW) / 2;
                const drawY = marginPt + (availH - drawH) / 2;

                const page = pdfDoc.addPage([pageW, pageH]);
                page.drawImage(embeddedImg, {
                    x: drawX,
                    y: drawY,
                    width: drawW,
                    height: drawH
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            Utils.downloadBlob(blob, 'images-document.pdf');
            Utils.toast('PDF created and downloaded successfully!', 'success');
        } catch (err) {
            console.error('Error generating PDF from images', err);
            Utils.toast('Failed to create PDF. Please check images.', 'error');
        }
    }

    // =========================================================================
    // 6. PDF TO IMAGE IMPLEMENTATION
    // =========================================================================
    async handlePdfToImageFile(file) {
        if (!file || file.type !== 'application/pdf') {
            Utils.toast('Please select a valid PDF file', 'warning');
            return;
        }
        if (typeof pdfjsLib === 'undefined') {
            Utils.toast('PDF rendering engine is loading. Please wait...', 'error');
            return;
        }

        try {
            Utils.toast('Loading PDF pages for conversion...', 'info', 1500);
            this.pdfToImgFile = file;
            const buffer = await Utils.readFileAsArrayBuffer(file);
            const loadingTask = pdfjsLib.getDocument({ data: buffer });
            this.pdfToImgDoc = await loadingTask.promise;

            const numPages = this.pdfToImgDoc.numPages;
            if (this.pdfToImgInfo) {
                this.pdfToImgInfo.textContent = `${file.name} &bull; ${numPages} Page(s) &bull; ${Utils.formatBytes(file.size)}`;
            }
            if (this.pdfToImgControls) this.pdfToImgControls.style.display = 'block';

            // Render thumbnail cards for pages
            if (this.pdfToImgPagesGrid) {
                this.pdfToImgPagesGrid.innerHTML = '';
                this.pdfToImgSelectedPages = [];
                for (let i = 1; i <= numPages; i++) {
                    this.pdfToImgSelectedPages.push(i);
                    const page = await this.pdfToImgDoc.getPage(i);
                    const vp = page.getViewport({ scale: 0.25 });
                    const canvas = document.createElement('canvas');
                    canvas.width = vp.width;
                    canvas.height = vp.height;
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

                    const card = document.createElement('div');
                    card.className = 'pdf-page-card active';
                    card.dataset.pageNum = i;
                    card.innerHTML = `
                        <div class="page-thumb-wrap">
                            <img src="${canvas.toDataURL()}" alt="Page ${i}">
                            <div class="page-check-badge">&#10003;</div>
                        </div>
                        <div class="page-number">Page ${i}</div>
                    `;
                    card.addEventListener('click', () => {
                        const idx = this.pdfToImgSelectedPages.indexOf(i);
                        if (idx !== -1) {
                            if (this.pdfToImgSelectedPages.length === 1) {
                                Utils.toast('At least one page must be selected', 'warning');
                                return;
                            }
                            this.pdfToImgSelectedPages.splice(idx, 1);
                            card.classList.remove('active');
                        } else {
                            this.pdfToImgSelectedPages.push(i);
                            this.pdfToImgSelectedPages.sort((a, b) => a - b);
                            card.classList.add('active');
                        }
                    });
                    this.pdfToImgPagesGrid.appendChild(card);
                }
            }
            Utils.toast(`Loaded ${numPages} page(s) successfully!`, 'success');
        } catch (err) {
            console.error('Error loading PDF to image', err);
            Utils.toast('Failed to load PDF. File may be corrupted or encrypted.', 'error');
        }
    }

    resetPdfToImage() {
        this.pdfToImgFile = null;
        this.pdfToImgDoc = null;
        this.pdfToImgSelectedPages = [];
        if (this.pdfToImgControls) this.pdfToImgControls.style.display = 'none';
        if (this.pdfToImgPagesGrid) this.pdfToImgPagesGrid.innerHTML = '';
        if (this.pdfToImgInput) this.pdfToImgInput.value = '';
    }

    async convertPdfToImages() {
        if (!this.pdfToImgDoc || !this.pdfToImgSelectedPages.length) {
            Utils.toast('Please select at least one page to convert', 'warning');
            return;
        }

        try {
            const format = this.pdfToImgFormat ? this.pdfToImgFormat.value : 'image/jpeg';
            const ext = format === 'image/png' ? 'png' : 'jpg';
            const dpiVal = this.pdfToImgDpi ? parseInt(this.pdfToImgDpi.value) : 300;
            const quality = this.pdfToImgQuality ? parseInt(this.pdfToImgQuality.value) / 100 : 0.92;
            const scaleFactor = (dpiVal / 72.0);

            Utils.toast(`Rendering ${this.pdfToImgSelectedPages.length} page(s) at ${dpiVal} DPI...`, 'info', 2000);

            if (this.pdfToImgSelectedPages.length === 1) {
                const pageNum = this.pdfToImgSelectedPages[0];
                const page = await this.pdfToImgDoc.getPage(pageNum);
                const vp = page.getViewport({ scale: scaleFactor });
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(vp.width);
                canvas.height = Math.round(vp.height);
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: vp }).promise;

                canvas.toBlob((blob) => {
                    if (blob) {
                        Utils.downloadBlob(blob, `page-${pageNum}.${ext}`);
                        Utils.toast('Image downloaded successfully!', 'success');
                    }
                }, format, quality);
            } else {
                if (typeof JSZip === 'undefined') {
                    Utils.toast('ZIP compression library loading...', 'error');
                    return;
                }
                const zip = new JSZip();
                for (let i = 0; i < this.pdfToImgSelectedPages.length; i++) {
                    const pageNum = this.pdfToImgSelectedPages[i];
                    const page = await this.pdfToImgDoc.getPage(pageNum);
                    const vp = page.getViewport({ scale: scaleFactor });
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(vp.width);
                    canvas.height = Math.round(vp.height);
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport: vp }).promise;

                    const blob = await new Promise(res => canvas.toBlob(res, format, quality));
                    zip.file(`page-${String(pageNum).padStart(2, '0')}.${ext}`, blob);
                }

                Utils.toast('Compressing images into ZIP...', 'info', 1500);
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                Utils.downloadBlob(zipBlob, 'pdf-converted-images.zip');
                Utils.toast('All pages exported to ZIP successfully!', 'success');
            }
        } catch (err) {
            console.error('Error converting PDF to images', err);
            Utils.toast('Failed to convert PDF pages to images', 'error');
        }
    }
}

window.PDFTools = PDFTools;
