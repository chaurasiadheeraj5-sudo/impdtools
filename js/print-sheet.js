/**
 * IP TOOLS - Print Sheet Module (Presto! Mr. Photo Style, Header/Footer & Layout Presets)
 * Generates passport and multi-image photo sheets on paper (A4, A3, Letter, 4x6", custom).
 * Features Presto! Mr. Photo-style cell assignment, drag-and-drop, zoom controls,
 * custom Header & Footer for sheet, named layout saving/loading, and localStorage persistence.
 * ONLY exports cells that contain actual images (no dummy/prototype/empty cells).
 */

class PrintSheet {
    constructor() {
        this.uploadedImages = []; // array of { file, img, dataUrl, name }
        this.paperSizes = {
            'a4': { name: 'A4', w_mm: 210, h_mm: 297 },
            'a3': { name: 'A3', w_mm: 297, h_mm: 420 },
            'a5': { name: 'A5', w_mm: 148, h_mm: 210 },
            'letter': { name: 'US Letter', w_mm: 215.9, h_mm: 279.4 },
            'legal': { name: 'US Legal', w_mm: 215.9, h_mm: 355.6 },
            '4x6': { name: '4 × 6 inch Photo', w_mm: 101.6, h_mm: 152.4 },
            '5x7': { name: '5 × 7 inch Photo', w_mm: 127.0, h_mm: 177.8 },
            'custom': { name: 'Custom Paper', w_mm: 210, h_mm: 297 }
        };

        this.currentPaper = 'a4';
        this.orientation = 'portrait'; // 'portrait' | 'landscape'
        this.dpi = 300;

        this.photoUnit = 'mm';
        this.photoW = 30; // 30 x 35 mm (Presto! Mr. Photo 6x7 Grid)
        this.photoH = 35;

        this.imageCount = 42;
        this.gridMode = 'manual'; // 'auto' | 'manual'
        this.manualRows = 7;
        this.manualCols = 6;
        this.direction = 'row-wise'; // 'row-wise' | 'column-wise'
        this.verticalAlign = 'top';   // 'top' (top-to-bottom) | 'center'

        this.marginUnit = 'mm';
        this.rowMargin = 4.0; // gap between rows in mm
        this.colMargin = 4.0; // gap between cols in mm
        this.pageMarginTop = 6.0;
        this.pageMarginBottom = 6.0;
        this.pageMarginLeft = 5.0;
        this.pageMarginRight = 5.0;
        this.centerOnPage = true;

        this.enableBorder = true;
        this.borderWidthMm = 0.5;
        this.borderColor = '#333333';
        this.enableCutLines = true;

        // Header & Footer for Sheet
        this.enableHeader = false;
        this.headerText = '';
        this.headerAlign = 'center'; // 'left' | 'center' | 'right'
        this.headerSize = 10;        // pt
        this.headerColor = '#333333';

        this.enableFooter = false;
        this.footerText = '';
        this.footerAlign = 'center'; // 'left' | 'center' | 'right'
        this.footerSize = 9;         // pt
        this.footerColor = '#666666';

        // Presto! Mr. Photo Cell Assignment State
        this.selectedImageIndex = 0;       // Currently active photo in tray
        this.cellAssignments = {};         // slotIndex -> imageIndex (or null for empty)
        this.hoveredSlotIndex = null;      // Slot currently under mouse
        this.activeCellIndex = 0;          // Slot selected in control dropdown
        this.currentLayout = null;         // Cached layout calculations
        this.zoomScale = 1.0;
        this.zoomMode = 'fit';             // 'fit' | 'custom'

        // Output Quality & Rendering Pipeline
        this.photoFit = 'cover';           // 'cover' (fill cell, zero distortion) | 'contain'
        this.exportDpi = 300;              // 300 | 600
        this.exportFmt = 'image/jpeg';     // 'image/jpeg' | 'image/png'
        this.previewDpi = 240;             // High-DPI screen preview resolution
        this._cellCache = new Map();       // Cache for downsampled cell canvases

        this.initDOMElements();
        this.bindEvents();
        this.initLayoutPresets();
        this.loadSettingsFromLocalStorage();
        this.updateExportImgButtonLabel();
    }

    initDOMElements() {
        this.dropZone = document.getElementById('sheet-dropzone');
        this.fileInput = document.getElementById('sheet-file-input');

        // Saved Layout Presets
        this.savedLayoutsSelect = document.getElementById('sheet-saved-layouts-select');
        this.layoutNameInput = document.getElementById('sheet-layout-name-input');
        this.saveLayoutBtn = document.getElementById('sheet-save-layout-btn');
        this.loadLayoutBtn = document.getElementById('sheet-load-layout-btn');
        this.deleteLayoutBtn = document.getElementById('sheet-delete-layout-btn');

        // Tray & Presto toolbar
        this.traySection = document.getElementById('sheet-tray-section');
        this.imgListContainer = document.getElementById('sheet-img-list');
        this.trayCountBadge = document.getElementById('sheet-tray-count');
        this.addMoreBtn = document.getElementById('sheet-add-more-btn');
        this.clearTrayBtn = document.getElementById('sheet-clear-tray-btn');
        this.activePhotoName = document.getElementById('sheet-active-photo-name');

        this.fillAllBtn = document.getElementById('sheet-fill-all-btn');
        this.fillEmptyBtn = document.getElementById('sheet-fill-empty-btn');
        this.fillSeqBtn = document.getElementById('sheet-fill-seq-btn');
        this.clearSelectedCellBtn = document.getElementById('sheet-clear-selected-cell-btn');
        this.clearAllCellsBtn = document.getElementById('sheet-clear-all-cells-btn');

        // Cell & Picture Panel controls
        this.cellSelect = document.getElementById('sheet-assign-cell-select');
        this.photoSelect = document.getElementById('sheet-assign-photo-select');
        this.applyCellAssignBtn = document.getElementById('sheet-apply-cell-assign-btn');
        this.clearThisCellBtn = document.getElementById('sheet-clear-this-cell-btn');

        // Paper
        this.paperSelect = document.getElementById('sheet-paper-select');
        this.customPaperGroup = document.getElementById('sheet-custom-paper-group');
        this.customPaperW = document.getElementById('sheet-custom-paper-w');
        this.customPaperH = document.getElementById('sheet-custom-paper-h');
        this.orientRadios = document.querySelectorAll('input[name="sheet-orient"]');

        // Photo size
        this.photoPresetSelect = document.getElementById('sheet-photo-preset');
        this.photoWInput = document.getElementById('sheet-photo-w');
        this.photoHInput = document.getElementById('sheet-photo-h');
        this.photoUnitSelect = document.getElementById('sheet-photo-unit');
        this.photoFitSelect = document.getElementById('sheet-photo-fit');

        // Copies & Grid
        this.countInput = document.getElementById('sheet-image-count');
        this.fitMaxBtn = document.getElementById('sheet-fit-max-btn');
        this.gridModeSelect = document.getElementById('sheet-grid-mode');
        this.manualGridGroup = document.getElementById('sheet-manual-grid-group');
        this.manualRowsInput = document.getElementById('sheet-manual-rows');
        this.manualColsInput = document.getElementById('sheet-manual-cols');
        this.directionRadios = document.querySelectorAll('input[name="sheet-direction"]');
        this.verticalAlignSelect = document.getElementById('sheet-vertical-align');

        // Margins
        this.rowMarginInput = document.getElementById('sheet-row-margin');
        this.colMarginInput = document.getElementById('sheet-col-margin');
        this.pageMarginTopInput = document.getElementById('sheet-page-margin-top');
        this.pageMarginLeftInput = document.getElementById('sheet-page-margin-left');
        this.centerOnPageCheck = document.getElementById('sheet-center-page');

        // Borders & Cut marks
        this.borderCheck = document.getElementById('sheet-enable-border');
        this.borderControls = document.getElementById('sheet-border-controls');
        this.borderWidthInput = document.getElementById('sheet-border-width');
        this.borderColorPicker = document.getElementById('sheet-border-color');
        this.cutLinesCheck = document.getElementById('sheet-enable-cutlines');

        // Header & Footer elements
        this.enableHeaderCheck = document.getElementById('sheet-enable-header');
        this.headerControls = document.getElementById('sheet-header-controls');
        this.headerTextInput = document.getElementById('sheet-header-text');
        this.headerAlignSelect = document.getElementById('sheet-header-align');
        this.headerSizeInput = document.getElementById('sheet-header-size');
        this.headerColorInput = document.getElementById('sheet-header-color');

        this.enableFooterCheck = document.getElementById('sheet-enable-footer');
        this.footerControls = document.getElementById('sheet-footer-controls');
        this.footerTextInput = document.getElementById('sheet-footer-text');
        this.footerAlignSelect = document.getElementById('sheet-footer-align');
        this.footerSizeInput = document.getElementById('sheet-footer-size');
        this.footerColorInput = document.getElementById('sheet-footer-color');

        // Canvas preview & Zoom controls
        this.previewCanvas = document.getElementById('sheet-canvas');
        this.canvasWrap = document.getElementById('sheet-canvas-wrap');
        this.sheetStatsBadge = document.getElementById('sheet-stats-badge');
        this.hoverCellBadge = document.getElementById('sheet-hover-cell-badge');

        this.zoomInBtn = document.getElementById('sheet-zoom-in-btn');
        this.zoomOutBtn = document.getElementById('sheet-zoom-out-btn');
        this.zoomFitBtn = document.getElementById('sheet-zoom-fit-btn');
        this.zoom100Btn = document.getElementById('sheet-zoom-100-btn');
        this.zoomValBadge = document.getElementById('sheet-zoom-val');

        // Export buttons & settings
        this.exportDpiSelect = document.getElementById('sheet-export-dpi-select');
        this.exportFmtSelect = document.getElementById('sheet-export-fmt-select');
        this.exportPdfBtn = document.getElementById('sheet-export-pdf-btn');
        this.exportImgBtn = document.getElementById('sheet-export-img-btn');
        this.printBtn = document.getElementById('sheet-print-btn');
        this.doMoreBtn = document.getElementById('sheet-do-more-btn');
    }

    bindEvents() {
        if (!this.dropZone) return;

        // Image upload
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleImagesUpload(e.target.files));

        if (this.addMoreBtn) {
            this.addMoreBtn.addEventListener('click', () => this.fileInput.click());
        }
        if (this.clearTrayBtn) {
            this.clearTrayBtn.addEventListener('click', () => this.clearAllPhotos());
        }

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
                this.handleImagesUpload(e.dataTransfer.files);
            }
        });

        // Saved Layout Presets buttons
        if (this.saveLayoutBtn) {
            this.saveLayoutBtn.addEventListener('click', () => this.saveLayoutPreset());
        }
        if (this.loadLayoutBtn) {
            this.loadLayoutBtn.addEventListener('click', () => this.loadLayoutPreset());
        }
        if (this.deleteLayoutBtn) {
            this.deleteLayoutBtn.addEventListener('click', () => this.deleteLayoutPreset());
        }

        // Presto Batch Buttons
        if (this.fillAllBtn) {
            this.fillAllBtn.addEventListener('click', () => this.fillAllWithSelected());
        }
        if (this.fillEmptyBtn) {
            this.fillEmptyBtn.addEventListener('click', () => this.fillEmptyWithSelected());
        }
        if (this.fillSeqBtn) {
            this.fillSeqBtn.addEventListener('click', () => this.fillSequentially());
        }
        if (this.clearSelectedCellBtn) {
            this.clearSelectedCellBtn.addEventListener('click', () => this.clearActiveCell());
        }
        if (this.clearAllCellsBtn) {
            this.clearAllCellsBtn.addEventListener('click', () => this.clearAllCells());
        }

        // Cell Assignment Panel Dropdown Actions
        if (this.applyCellAssignBtn) {
            this.applyCellAssignBtn.addEventListener('click', () => {
                const targetCell = parseInt(this.cellSelect.value) || 0;
                const photoVal = this.photoSelect.value;
                if (photoVal === 'empty') {
                    this.cellAssignments[targetCell] = null;
                } else {
                    this.cellAssignments[targetCell] = parseInt(photoVal);
                }
                this.renderSheet();
                this.saveSettingsToLocalStorage();
                Utils.toast(`Updated Cell #${targetCell + 1}`, 'info', 1500);
            });
        }

        if (this.clearThisCellBtn) {
            this.clearThisCellBtn.addEventListener('click', () => {
                const targetCell = parseInt(this.cellSelect.value) || 0;
                this.cellAssignments[targetCell] = null;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
                Utils.toast(`Cleared Cell #${targetCell + 1}`, 'info', 1500);
            });
        }

        // Interactive Canvas Events (Hit-Testing, Click to Place, Drag & Drop)
        if (this.previewCanvas) {
            this.previewCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            this.previewCanvas.addEventListener('mouseleave', () => this.handleCanvasMouseLeave());
            this.previewCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));

            this.previewCanvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.handleCanvasMouseMove(e);
            });
            this.previewCanvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));
        }

        // Zoom Controls
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', () => this.adjustZoom(0.15));
        }
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', () => this.adjustZoom(-0.15));
        }
        if (this.zoomFitBtn) {
            this.zoomFitBtn.addEventListener('click', () => this.setZoom('fit'));
        }
        if (this.zoom100Btn) {
            this.zoom100Btn.addEventListener('click', () => this.setZoom(1.0));
        }

        window.addEventListener('resize', () => {
            if (this.zoomMode === 'fit') {
                this.applyZoom();
            }
        });

        // Paper change
        this.paperSelect.addEventListener('change', (e) => {
            this.currentPaper = e.target.value;
            this.customPaperGroup.style.display = (this.currentPaper === 'custom') ? 'flex' : 'none';
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        if (this.customPaperW && this.customPaperH) {
            this.customPaperW.addEventListener('input', () => {
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
            this.customPaperH.addEventListener('input', () => {
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }

        // Orientation
        this.orientRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.orientation = e.target.value;
                    this.renderSheet();
                    this.saveSettingsToLocalStorage();
                }
            });
        });

        // Photo preset change
        this.photoPresetSelect.addEventListener('change', (e) => {
            this.applyPhotoPreset(e.target.value);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        // Photo size unit change
        this.photoUnitSelect.addEventListener('change', (e) => {
            const oldUnit = this.photoUnit;
            this.photoUnit = e.target.value;
            const curW = parseFloat(this.photoWInput.value) || 0;
            const curH = parseFloat(this.photoHInput.value) || 0;
            this.photoW = Utils.convertUnit(curW, oldUnit, this.photoUnit, this.dpi);
            this.photoH = Utils.convertUnit(curH, oldUnit, this.photoUnit, this.dpi);
            this.photoWInput.value = this.photoW;
            this.photoHInput.value = this.photoH;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.photoWInput.addEventListener('input', () => {
            this.photoW = parseFloat(this.photoWInput.value) || 0;
            this.clearCellCache();
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.photoHInput.addEventListener('input', () => {
            this.photoH = parseFloat(this.photoHInput.value) || 0;
            this.clearCellCache();
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        if (this.photoFitSelect) {
            this.photoFitSelect.addEventListener('change', (e) => {
                this.photoFit = e.target.value;
                this.clearCellCache();
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }

        // Copies count
        this.countInput.addEventListener('input', () => {
            this.imageCount = Math.max(1, parseInt(this.countInput.value) || 1);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        // Fit maximum button
        this.fitMaxBtn.addEventListener('click', () => {
            const maxFit = this.calculateMaxCapacity();
            this.imageCount = Math.max(1, maxFit.capacity);
            this.countInput.value = this.imageCount;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
            Utils.toast(`Fitted maximum of ${this.imageCount} photos on this sheet!`, 'success');
        });

        // Grid mode
        this.gridModeSelect.addEventListener('change', (e) => {
            this.gridMode = e.target.value;
            this.manualGridGroup.style.display = (this.gridMode === 'manual') ? 'flex' : 'none';
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.manualRowsInput.addEventListener('input', () => {
            this.manualRows = Math.max(1, parseInt(this.manualRowsInput.value) || 1);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.manualColsInput.addEventListener('input', () => {
            this.manualCols = Math.max(1, parseInt(this.manualColsInput.value) || 1);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        // Direction radios
        this.directionRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.direction = e.target.value;
                    this.renderSheet();
                    this.saveSettingsToLocalStorage();
                }
            });
        });

        // Vertical Alignment
        if (this.verticalAlignSelect) {
            this.verticalAlignSelect.addEventListener('change', (e) => {
                this.verticalAlign = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }

        // Margins
        this.rowMarginInput.addEventListener('input', () => {
            this.rowMargin = Math.max(0, parseFloat(this.rowMarginInput.value) || 0);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.colMarginInput.addEventListener('input', () => {
            this.colMargin = Math.max(0, parseFloat(this.colMarginInput.value) || 0);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.pageMarginTopInput.addEventListener('input', () => {
            this.pageMarginTop = Math.max(0, parseFloat(this.pageMarginTopInput.value) || 0);
            this.pageMarginBottom = this.pageMarginTop;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.pageMarginLeftInput.addEventListener('input', () => {
            this.pageMarginLeft = Math.max(0, parseFloat(this.pageMarginLeftInput.value) || 0);
            this.pageMarginRight = this.pageMarginLeft;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.centerOnPageCheck.addEventListener('change', (e) => {
            this.centerOnPage = e.target.checked;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        // Border & Cut lines
        this.borderCheck.addEventListener('change', (e) => {
            this.enableBorder = e.target.checked;
            this.borderControls.style.display = this.enableBorder ? 'flex' : 'none';
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.borderWidthInput.addEventListener('input', () => {
            this.borderWidthMm = Math.max(0.1, parseFloat(this.borderWidthInput.value) || 0.5);
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.borderColorPicker.addEventListener('input', (e) => {
            this.borderColor = e.target.value;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        this.cutLinesCheck.addEventListener('change', (e) => {
            this.enableCutLines = e.target.checked;
            this.renderSheet();
            this.saveSettingsToLocalStorage();
        });

        // Header Controls
        if (this.enableHeaderCheck) {
            this.enableHeaderCheck.addEventListener('change', (e) => {
                this.enableHeader = e.target.checked;
                this.headerControls.style.display = this.enableHeader ? 'flex' : 'none';
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.headerTextInput) {
            this.headerTextInput.addEventListener('input', (e) => {
                this.headerText = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.headerAlignSelect) {
            this.headerAlignSelect.addEventListener('change', (e) => {
                this.headerAlign = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.headerSizeInput) {
            this.headerSizeInput.addEventListener('input', (e) => {
                this.headerSize = parseFloat(e.target.value) || 10;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.headerColorInput) {
            this.headerColorInput.addEventListener('input', (e) => {
                this.headerColor = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }

        // Footer Controls
        if (this.enableFooterCheck) {
            this.enableFooterCheck.addEventListener('change', (e) => {
                this.enableFooter = e.target.checked;
                this.footerControls.style.display = this.enableFooter ? 'flex' : 'none';
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.footerTextInput) {
            this.footerTextInput.addEventListener('input', (e) => {
                this.footerText = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.footerAlignSelect) {
            this.footerAlignSelect.addEventListener('change', (e) => {
                this.footerAlign = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.footerSizeInput) {
            this.footerSizeInput.addEventListener('input', (e) => {
                this.footerSize = parseFloat(e.target.value) || 9;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.footerColorInput) {
            this.footerColorInput.addEventListener('input', (e) => {
                this.footerColor = e.target.value;
                this.renderSheet();
                this.saveSettingsToLocalStorage();
            });
        }

        // Export settings
        if (this.exportDpiSelect) {
            this.exportDpiSelect.addEventListener('change', (e) => {
                this.exportDpi = parseInt(e.target.value, 10) || 300;
                this.updateExportImgButtonLabel();
                this.saveSettingsToLocalStorage();
            });
        }
        if (this.exportFmtSelect) {
            this.exportFmtSelect.addEventListener('change', (e) => {
                this.exportFmt = e.target.value;
                this.updateExportImgButtonLabel();
                this.saveSettingsToLocalStorage();
            });
        }

        // Export buttons
        this.exportPdfBtn.addEventListener('click', () => this.exportPdf());
        this.exportImgBtn.addEventListener('click', () => this.exportHighResImage());
        this.printBtn.addEventListener('click', () => this.triggerPrint());
    }

    clearCellCache() {
        if (this._cellCache) {
            this._cellCache.clear();
        }
    }

    updateExportImgButtonLabel() {
        if (!this.exportImgBtn) return;
        const dpi = this.exportDpi || 300;
        const isPng = this.exportFmt === 'image/png';
        const label = isPng ? `${dpi} DPI Lossless PNG` : `${dpi} DPI Image`;
        this.exportImgBtn.innerHTML = `<span>🖼️</span> Download ${label}`;
    }

    /* =========================================================================
       SAVED LAYOUT PRESETS (SAVE WITH NAME & LOAD)
       ========================================================================= */

    initLayoutPresets() {
        if (!this.savedLayoutsSelect) return;

        const defaultPresets = [
            {
                name: "Presto! 6×7 Grid (30×35mm, 7 Rows × 6 Cols, 4mm Gap)",
                paper: "a4",
                orientation: "portrait",
                photoPreset: "custom",
                photoW: 30,
                photoH: 35,
                photoUnit: "mm",
                count: 42,
                gridMode: "manual",
                manualRows: 7,
                manualCols: 6,
                direction: "row-wise",
                verticalAlign: "top",
                rowMargin: 4.0,
                colMargin: 4.0,
                pageMarginTop: 6.0,
                pageMarginLeft: 5.0,
                centerOnPage: true,
                enableBorder: true,
                borderWidthMm: 0.5,
                borderColor: "#333333", // Light black border
                enableCutLines: true
            }
        ];

        // Read stored custom layouts and strip out any legacy default presets
        let customLayouts = [];
        try {
            const raw = localStorage.getItem('iptools_saved_layouts');
            if (raw) {
                const parsed = JSON.parse(raw);
                const oldNames = [
                    "Standard 8 Passport Photos A4 (Top-Aligned)",
                    "16 Passport Photos A4 (4x4 Full Sheet)",
                    "6 US Visa Photos A4 (2x2 inch)",
                    "4x6 Photo Paper 4-Up Grid"
                ];
                customLayouts = parsed.filter(l => l && !oldNames.includes(l.name));
            }
        } catch (e) {
            console.error('Failed to parse saved layouts', e);
        }

        // Merge defaults and custom presets
        this.allPresets = [...defaultPresets, ...customLayouts];

        // Populate dropdown
        this.savedLayoutsSelect.innerHTML = '<option value="">-- Select Saved Layout --</option>';
        this.allPresets.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = p.name;
            this.savedLayoutsSelect.appendChild(opt);
        });
    }

    saveLayoutPreset() {
        const name = (this.layoutNameInput?.value || '').trim();
        if (!name) {
            Utils.toast('Please enter a name for your custom layout', 'warning');
            return;
        }

        const newPreset = {
            name,
            paper: this.currentPaper,
            orientation: this.orientation,
            customW: parseFloat(this.customPaperW?.value) || 210,
            customH: parseFloat(this.customPaperH?.value) || 297,
            photoPreset: this.photoPresetSelect?.value || 'passport_in',
            photoUnit: this.photoUnit,
            photoW: this.photoW,
            photoH: this.photoH,
            count: this.imageCount,
            gridMode: this.gridMode,
            manualRows: this.manualRows,
            manualCols: this.manualCols,
            direction: this.direction,
            verticalAlign: this.verticalAlign,
            rowMargin: this.rowMargin,
            colMargin: this.colMargin,
            pageMarginTop: this.pageMarginTop,
            pageMarginLeft: this.pageMarginLeft,
            centerOnPage: this.centerOnPage,
            enableBorder: this.enableBorder,
            borderWidthMm: this.borderWidthMm,
            borderColor: this.borderColor,
            enableCutLines: this.enableCutLines,
            enableHeader: this.enableHeader,
            headerText: this.headerText,
            headerAlign: this.headerAlign,
            headerSize: this.headerSize,
            headerColor: this.headerColor,
            enableFooter: this.enableFooter,
            footerText: this.footerText,
            footerAlign: this.footerAlign,
            footerSize: this.footerSize,
            footerColor: this.footerColor,
            photoFit: this.photoFit || 'cover',
            exportDpi: this.exportDpi || 300,
            exportFmt: this.exportFmt || 'image/jpeg'
        };

        let customLayouts = [];
        try {
            const raw = localStorage.getItem('iptools_saved_layouts');
            if (raw) customLayouts = JSON.parse(raw);
        } catch (e) {}

        // Replace if exists with same name or add new
        const existingIdx = customLayouts.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
        if (existingIdx !== -1) {
            customLayouts[existingIdx] = newPreset;
        } else {
            customLayouts.push(newPreset);
        }

        localStorage.setItem('iptools_saved_layouts', JSON.stringify(customLayouts));
        this.initLayoutPresets();

        // Select the newly saved preset
        const newIdx = this.allPresets.findIndex(p => p.name === name);
        if (newIdx !== -1 && this.savedLayoutsSelect) {
            this.savedLayoutsSelect.value = newIdx;
        }

        this.layoutNameInput.value = '';
        this.saveSettingsToLocalStorage();
        Utils.toast(`Saved layout "${name}"!`, 'success');
    }

    loadLayoutPreset() {
        const selectedVal = this.savedLayoutsSelect?.value;
        if (selectedVal === '' || selectedVal === undefined) {
            Utils.toast('Please choose a layout from the dropdown to load', 'warning');
            return;
        }

        const preset = this.allPresets[parseInt(selectedVal)];
        if (!preset) return;

        this.applySettingsObject(preset);
        this.saveSettingsToLocalStorage();
        this.renderSheet();
        Utils.toast(`Loaded layout "${preset.name}"!`, 'success');
    }

    deleteLayoutPreset() {
        const selectedVal = this.savedLayoutsSelect?.value;
        if (selectedVal === '' || selectedVal === undefined) return;

        const preset = this.allPresets[parseInt(selectedVal)];
        if (!preset) return;

        let customLayouts = [];
        try {
            const raw = localStorage.getItem('iptools_saved_layouts');
            if (raw) customLayouts = JSON.parse(raw);
        } catch (e) {}

        const filtered = customLayouts.filter(l => l.name !== preset.name);
        localStorage.setItem('iptools_saved_layouts', JSON.stringify(filtered));
        this.initLayoutPresets();
        Utils.toast(`Deleted layout "${preset.name}"`, 'info');
    }

    /* =========================================================================
       SETTINGS PERSISTENCE (REMEMBERED ON PAGE RELOAD)
       ========================================================================= */

    saveSettingsToLocalStorage() {
        const settings = {
            paper: this.currentPaper,
            orientation: this.orientation,
            customW: parseFloat(this.customPaperW?.value) || 210,
            customH: parseFloat(this.customPaperH?.value) || 297,
            photoPreset: this.photoPresetSelect?.value || 'passport_in',
            photoUnit: this.photoUnit,
            photoW: this.photoW,
            photoH: this.photoH,
            imageCount: this.imageCount,
            gridMode: this.gridMode,
            manualRows: this.manualRows,
            manualCols: this.manualCols,
            direction: this.direction,
            verticalAlign: this.verticalAlign,
            rowMargin: this.rowMargin,
            colMargin: this.colMargin,
            pageMarginTop: this.pageMarginTop,
            pageMarginLeft: this.pageMarginLeft,
            centerOnPage: this.centerOnPage,
            enableBorder: this.enableBorder,
            borderWidthMm: this.borderWidthMm,
            borderColor: this.borderColor,
            enableCutLines: this.enableCutLines,
            enableHeader: this.enableHeader,
            headerText: this.headerText,
            headerAlign: this.headerAlign,
            headerSize: this.headerSize,
            headerColor: this.headerColor,
            enableFooter: this.enableFooter,
            footerText: this.footerText,
            footerAlign: this.footerAlign,
            footerSize: this.footerSize,
            footerColor: this.footerColor,
            photoFit: this.photoFit || 'cover',
            exportDpi: this.exportDpi || 300,
            exportFmt: this.exportFmt || 'image/jpeg'
        };
        try {
            localStorage.setItem('iptools_print_sheet_settings', JSON.stringify(settings));
        } catch (e) {}
    }

    loadSettingsFromLocalStorage() {
        try {
            const raw = localStorage.getItem('iptools_print_sheet_settings');
            if (raw) {
                const settings = JSON.parse(raw);
                // If it was the legacy default or the 35x45 7x6 that overflowed, upgrade to the Presto 30x35mm 7x6 layout
                if (
                    (settings.photoW === 3.5 && settings.photoUnit === 'cm' && settings.imageCount === 8) ||
                    (settings.photoW === 35 && settings.photoH === 45 && settings.manualRows === 7)
                ) {
                    if (this.allPresets && this.allPresets[0]) {
                        this.applySettingsObject(this.allPresets[0]);
                        this.saveSettingsToLocalStorage();
                        return;
                    }
                }
                this.applySettingsObject(settings);
            } else {
                if (this.allPresets && this.allPresets[0]) {
                    this.applySettingsObject(this.allPresets[0]);
                }
            }
        } catch (e) {
            console.error('Error restoring print sheet settings', e);
        }
    }

    applySettingsObject(settings) {
        if (!settings) return;

        if (settings.paper) {
            this.currentPaper = settings.paper;
            if (this.paperSelect) this.paperSelect.value = settings.paper;
            if (this.customPaperGroup) {
                this.customPaperGroup.style.display = (this.currentPaper === 'custom') ? 'flex' : 'none';
            }
        }

        if (settings.orientation) {
            this.orientation = settings.orientation;
            this.orientRadios.forEach(r => {
                r.checked = (r.value === settings.orientation);
            });
        }

        if (settings.customW && this.customPaperW) this.customPaperW.value = settings.customW;
        if (settings.customH && this.customPaperH) this.customPaperH.value = settings.customH;

        if (settings.photoUnit) {
            this.photoUnit = settings.photoUnit;
            if (this.photoUnitSelect) this.photoUnitSelect.value = settings.photoUnit;
        }

        if (settings.photoW !== undefined) {
            this.photoW = settings.photoW;
            if (this.photoWInput) this.photoWInput.value = settings.photoW;
        }

        if (settings.photoH !== undefined) {
            this.photoH = settings.photoH;
            if (this.photoHInput) this.photoHInput.value = settings.photoH;
        }

        if (settings.photoPreset && this.photoPresetSelect) {
            this.photoPresetSelect.value = settings.photoPreset;
        }

        if (settings.count !== undefined || settings.imageCount !== undefined) {
            const cnt = settings.count !== undefined ? settings.count : settings.imageCount;
            this.imageCount = cnt;
            if (this.countInput) this.countInput.value = cnt;
        }

        if (settings.gridMode) {
            this.gridMode = settings.gridMode;
            if (this.gridModeSelect) this.gridModeSelect.value = settings.gridMode;
            if (this.manualGridGroup) {
                this.manualGridGroup.style.display = (this.gridMode === 'manual') ? 'flex' : 'none';
            }
        }

        if (settings.manualRows !== undefined) {
            this.manualRows = settings.manualRows;
            if (this.manualRowsInput) this.manualRowsInput.value = settings.manualRows;
        }

        if (settings.manualCols !== undefined) {
            this.manualCols = settings.manualCols;
            if (this.manualColsInput) this.manualColsInput.value = settings.manualCols;
        }

        if (settings.direction) {
            this.direction = settings.direction;
            this.directionRadios.forEach(r => {
                r.checked = (r.value === settings.direction);
            });
        }

        if (settings.verticalAlign) {
            this.verticalAlign = settings.verticalAlign;
            if (this.verticalAlignSelect) this.verticalAlignSelect.value = settings.verticalAlign;
        }

        if (settings.rowMargin !== undefined) {
            this.rowMargin = settings.rowMargin;
            if (this.rowMarginInput) this.rowMarginInput.value = settings.rowMargin;
        }

        if (settings.colMargin !== undefined) {
            this.colMargin = settings.colMargin;
            if (this.colMarginInput) this.colMarginInput.value = settings.colMargin;
        }

        if (settings.pageMarginTop !== undefined) {
            this.pageMarginTop = settings.pageMarginTop;
            this.pageMarginBottom = settings.pageMarginTop;
            if (this.pageMarginTopInput) this.pageMarginTopInput.value = settings.pageMarginTop;
        }

        if (settings.pageMarginLeft !== undefined) {
            this.pageMarginLeft = settings.pageMarginLeft;
            this.pageMarginRight = settings.pageMarginLeft;
            if (this.pageMarginLeftInput) this.pageMarginLeftInput.value = settings.pageMarginLeft;
        }

        if (settings.centerOnPage !== undefined) {
            this.centerOnPage = settings.centerOnPage;
            if (this.centerOnPageCheck) this.centerOnPageCheck.checked = settings.centerOnPage;
        }

        if (settings.enableBorder !== undefined) {
            this.enableBorder = settings.enableBorder;
            if (this.borderCheck) this.borderCheck.checked = settings.enableBorder;
            if (this.borderControls) this.borderControls.style.display = settings.enableBorder ? 'flex' : 'none';
        }

        if (settings.borderWidthMm !== undefined) {
            this.borderWidthMm = settings.borderWidthMm;
            if (this.borderWidthInput) this.borderWidthInput.value = settings.borderWidthMm;
        }

        if (settings.borderColor) {
            this.borderColor = settings.borderColor;
            if (this.borderColorPicker) this.borderColorPicker.value = settings.borderColor;
        }

        if (settings.enableCutLines !== undefined) {
            this.enableCutLines = settings.enableCutLines;
            if (this.cutLinesCheck) this.cutLinesCheck.checked = settings.enableCutLines;
        }

        // Header
        if (settings.enableHeader !== undefined) {
            this.enableHeader = settings.enableHeader;
            if (this.enableHeaderCheck) this.enableHeaderCheck.checked = settings.enableHeader;
            if (this.headerControls) this.headerControls.style.display = settings.enableHeader ? 'flex' : 'none';
        }
        if (settings.headerText !== undefined) {
            this.headerText = settings.headerText;
            if (this.headerTextInput) this.headerTextInput.value = settings.headerText;
        }
        if (settings.headerAlign) {
            this.headerAlign = settings.headerAlign;
            if (this.headerAlignSelect) this.headerAlignSelect.value = settings.headerAlign;
        }
        if (settings.headerSize !== undefined) {
            this.headerSize = settings.headerSize;
            if (this.headerSizeInput) this.headerSizeInput.value = settings.headerSize;
        }
        if (settings.headerColor) {
            this.headerColor = settings.headerColor;
            if (this.headerColorInput) this.headerColorInput.value = settings.headerColor;
        }

        // Footer
        if (settings.enableFooter !== undefined) {
            this.enableFooter = settings.enableFooter;
            if (this.enableFooterCheck) this.enableFooterCheck.checked = settings.enableFooter;
            if (this.footerControls) this.footerControls.style.display = settings.enableFooter ? 'flex' : 'none';
        }
        if (settings.footerText !== undefined) {
            this.footerText = settings.footerText;
            if (this.footerTextInput) this.footerTextInput.value = settings.footerText;
        }
        if (settings.footerAlign) {
            this.footerAlign = settings.footerAlign;
            if (this.footerAlignSelect) this.footerAlignSelect.value = settings.footerAlign;
        }
        if (settings.footerSize !== undefined) {
            this.footerSize = settings.footerSize;
            if (this.footerSizeInput) this.footerSizeInput.value = settings.footerSize;
        }
        if (settings.footerColor) {
            this.footerColor = settings.footerColor;
            if (this.footerColorInput) this.footerColorInput.value = settings.footerColor;
        }

        // Photo Fit & Export Settings
        if (settings.photoFit) {
            this.photoFit = settings.photoFit;
            if (this.photoFitSelect) this.photoFitSelect.value = settings.photoFit;
        }
        if (settings.exportDpi) {
            this.exportDpi = parseInt(settings.exportDpi, 10) || 300;
            if (this.exportDpiSelect) this.exportDpiSelect.value = String(this.exportDpi);
        }
        if (settings.exportFmt) {
            this.exportFmt = settings.exportFmt;
            if (this.exportFmtSelect) this.exportFmtSelect.value = settings.exportFmt;
        }
        this.updateExportImgButtonLabel();
        this.clearCellCache();
    }

    applyPhotoPreset(preset) {
        switch (preset) {
            case 'passport_in': // 3.5 x 4.5 cm
                this.photoUnit = 'cm';
                this.photoW = 3.5;
                this.photoH = 4.5;
                break;
            case 'visa_us': // 2 x 2 inch
                this.photoUnit = 'inch';
                this.photoW = 2.0;
                this.photoH = 2.0;
                break;
            case 'stamp': // 2 x 2.5 cm
                this.photoUnit = 'cm';
                this.photoW = 2.0;
                this.photoH = 2.5;
                break;
            case 'id_3x4': // 3 x 4 cm
                this.photoUnit = 'cm';
                this.photoW = 3.0;
                this.photoH = 4.0;
                break;
            case 'photo_4x6': // 4 x 6 cm
                this.photoUnit = 'cm';
                this.photoW = 4.0;
                this.photoH = 6.0;
                break;
            case 'wallet': // 2.5 x 3.5 inch
                this.photoUnit = 'inch';
                this.photoW = 2.5;
                this.photoH = 3.5;
                break;
            case 'custom':
                return;
        }

        this.photoUnitSelect.value = this.photoUnit;
        this.photoWInput.value = this.photoW;
        this.photoHInput.value = this.photoH;
        this.clearCellCache();
    }

    async handleImagesUpload(files) {
        if (!files || files.length === 0) return;
        const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (valid.length === 0) {
            Utils.toast('Please select valid image files', 'warning');
            return;
        }

        const initialLength = this.uploadedImages.length;

        for (const file of valid) {
            try {
                const dataUrl = await Utils.readFileAsDataURL(file);
                const img = await Utils.loadImage(dataUrl);
                this.uploadedImages.push({
                    file,
                    img,
                    dataUrl,
                    name: file.name
                });
            } catch (err) {
                console.error(err);
            }
        }

        if (initialLength === 0 && this.uploadedImages.length > 0) {
            this.selectedImageIndex = 0;
        }

        this.clearCellCache();
        this.renderUploadedThumbnails();
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast(`Loaded ${valid.length} photo(s). Select a photo to place into cells!`, 'success');
    }

    renderUploadedThumbnails() {
        if (!this.imgListContainer) return;
        this.imgListContainer.innerHTML = '';

        if (this.uploadedImages.length === 0) {
            if (this.traySection) this.traySection.style.display = 'none';
            return;
        }

        if (this.traySection) this.traySection.style.display = 'flex';
        if (this.trayCountBadge) {
            this.trayCountBadge.textContent = `${this.uploadedImages.length} photo${this.uploadedImages.length > 1 ? 's' : ''}`;
        }

        if (this.selectedImageIndex >= this.uploadedImages.length) {
            this.selectedImageIndex = Math.max(0, this.uploadedImages.length - 1);
        }

        const activeItem = this.uploadedImages[this.selectedImageIndex];
        if (this.activePhotoName && activeItem) {
            this.activePhotoName.textContent = `#${this.selectedImageIndex + 1}: ${activeItem.name}`;
        }

        this.uploadedImages.forEach((item, index) => {
            const isSelected = index === this.selectedImageIndex;
            const card = document.createElement('div');
            card.className = `sheet-thumb-card ${isSelected ? 'active-selected' : ''}`;
            card.draggable = true;
            card.dataset.index = index;
            card.title = `Photo #${index + 1}: ${item.name} (Click to select for cell placement, or drag to cell)`;

            card.innerHTML = `
                <span class="thumb-badge">#${index + 1}</span>
                <img src="${item.dataUrl}" alt="${item.name}">
                <button class="sheet-thumb-remove" data-index="${index}" title="Remove photo">&times;</button>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('sheet-thumb-remove')) return;
                this.selectedImageIndex = index;
                this.renderUploadedThumbnails();
                this.updateCellAssignmentDropdowns();
                Utils.toast(`Active: Photo #${index + 1} (${item.name}). Click any cell on the sheet to place it!`, 'info', 1800);
            });

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                e.dataTransfer.effectAllowed = 'copy';
                card.style.opacity = '0.5';
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });

            card.querySelector('.sheet-thumb-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePhoto(index);
            });

            this.imgListContainer.appendChild(card);
        });
    }

    removePhoto(index) {
        this.uploadedImages.splice(index, 1);

        for (const slotKey in this.cellAssignments) {
            const val = this.cellAssignments[slotKey];
            if (val === index) {
                delete this.cellAssignments[slotKey];
            } else if (val > index) {
                this.cellAssignments[slotKey] = val - 1;
            }
        }

        if (this.selectedImageIndex >= this.uploadedImages.length) {
            this.selectedImageIndex = Math.max(0, this.uploadedImages.length - 1);
        }

        this.clearCellCache();
        this.renderUploadedThumbnails();
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
    }

    updateCellAssignmentDropdowns() {
        if (!this.cellSelect || !this.photoSelect) return;

        const layout = this.calculateLayout();
        const totalSlots = layout.slots.length;

        this.cellSelect.innerHTML = '';
        for (let i = 0; i < totalSlots; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            const assigned = this.getAssignedImageForSlot(i);
            const status = assigned ? `(Photo #${assigned.imageIndex + 1})` : `(Empty)`;
            opt.textContent = `Cell ${i + 1} ${status}`;
            if (i === this.activeCellIndex) opt.selected = true;
            this.cellSelect.appendChild(opt);
        }

        this.photoSelect.innerHTML = '<option value="empty">-- Empty / Blank Cell --</option>';
        this.uploadedImages.forEach((img, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `Photo #${idx + 1}: ${img.name}`;
            if (idx === this.selectedImageIndex) opt.selected = true;
            this.photoSelect.appendChild(opt);
        });
    }

    getAssignedImageForSlot(slotIndex) {
        if (this.cellAssignments[slotIndex] !== undefined) {
            const assignedIdx = this.cellAssignments[slotIndex];
            if (assignedIdx === null) return null;
            if (this.uploadedImages[assignedIdx]) {
                return {
                    img: this.uploadedImages[assignedIdx].img,
                    dataUrl: this.uploadedImages[assignedIdx].dataUrl,
                    name: this.uploadedImages[assignedIdx].name,
                    imageIndex: assignedIdx
                };
            }
            return null;
        }

        // Default: Exact 1:1 cell assignment per uploaded photo from top to bottom
        if (slotIndex < this.uploadedImages.length) {
            const item = this.uploadedImages[slotIndex];
            return {
                img: item.img,
                dataUrl: item.dataUrl,
                name: item.name,
                imageIndex: slotIndex
            };
        }

        return null;
    }

    /* =========================================================================
       PRESTO! MR. PHOTO CELL-BY-CELL ACTIONS
       ========================================================================= */

    fillAllWithSelected() {
        if (this.uploadedImages.length === 0) {
            Utils.toast('Please upload photos first', 'warning');
            return;
        }
        const layout = this.calculateLayout();
        layout.slots.forEach(slot => {
            this.cellAssignments[slot.index] = this.selectedImageIndex;
        });
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast(`Filled all ${layout.slots.length} cells with Photo #${this.selectedImageIndex + 1}!`, 'success');
    }

    fillEmptyWithSelected() {
        if (this.uploadedImages.length === 0) {
            Utils.toast('Please upload photos first', 'warning');
            return;
        }
        const layout = this.calculateLayout();
        let filledCount = 0;
        layout.slots.forEach(slot => {
            const current = this.cellAssignments[slot.index];
            if (current === null || current === undefined) {
                this.cellAssignments[slot.index] = this.selectedImageIndex;
                filledCount++;
            }
        });
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast(`Filled ${filledCount} empty cell(s) with Photo #${this.selectedImageIndex + 1}`, 'success');
    }

    fillSequentially() {
        if (this.uploadedImages.length === 0) {
            Utils.toast('Please upload photos first', 'warning');
            return;
        }
        const layout = this.calculateLayout();
        layout.slots.forEach(slot => {
            this.cellAssignments[slot.index] = slot.index % this.uploadedImages.length;
        });
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast(`Filled cells sequentially with all ${this.uploadedImages.length} photo(s)`, 'success');
    }

    clearActiveCell() {
        if (this.activeCellIndex !== null) {
            this.cellAssignments[this.activeCellIndex] = null;
            this.updateCellAssignmentDropdowns();
            this.renderSheet();
            Utils.toast(`Cleared Cell #${this.activeCellIndex + 1}`, 'info');
        }
    }

    clearAllCells() {
        const layout = this.calculateLayout();
        layout.slots.forEach(slot => {
            this.cellAssignments[slot.index] = null;
        });
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast('Cleared all cells on the sheet', 'info');
    }

    clearAllPhotos() {
        if (this.uploadedImages.length === 0) return;
        this.uploadedImages = [];
        this.selectedImageIndex = 0;
        this.cellAssignments = {};
        if (this.fileInput) this.fileInput.value = '';
        this.clearCellCache();
        this.renderUploadedThumbnails();
        this.updateCellAssignmentDropdowns();
        this.renderSheet();
        Utils.toast('All uploaded photos cleared from tray', 'info');
    }

    /* =========================================================================
       CANVAS HIT-TESTING & INTERACTIVE PLACEMENT
       ========================================================================= */

    getSlotFromMouseEvent(e) {
        if (!this.previewCanvas || !this.currentLayout || !this.currentLayout.slots) return null;
        const rect = this.previewCanvas.getBoundingClientRect();

        const scaleX = this.previewCanvas.width / rect.width;
        const scaleY = this.previewCanvas.height / rect.height;

        const mouseCanvasX = (e.clientX - rect.left) * scaleX;
        const mouseCanvasY = (e.clientY - rect.top) * scaleY;

        const previewDpi = this.previewDpi || 240;
        const mmToPx = (mm) => (mm / Utils.MM_PER_INCH) * previewDpi;

        const photoW_px = mmToPx(this.currentLayout.photo.w);
        const photoH_px = mmToPx(this.currentLayout.photo.h);

        for (const slot of this.currentLayout.slots) {
            const slotX = mmToPx(slot.x);
            const slotY = mmToPx(slot.y);

            if (
                mouseCanvasX >= slotX &&
                mouseCanvasX <= slotX + photoW_px &&
                mouseCanvasY >= slotY &&
                mouseCanvasY <= slotY + photoH_px
            ) {
                return slot;
            }
        }
        return null;
    }

    handleCanvasMouseMove(e) {
        const slot = this.getSlotFromMouseEvent(e);
        if (slot) {
            if (this.hoveredSlotIndex !== slot.index) {
                this.hoveredSlotIndex = slot.index;
                const assigned = this.getAssignedImageForSlot(slot.index);
                const currentTxt = assigned ? `Photo #${assigned.imageIndex + 1}` : `Empty`;
                const activeTxt = this.uploadedImages[this.selectedImageIndex] ? `Click to place Photo #${this.selectedImageIndex + 1}` : `Upload photos`;

                if (this.hoverCellBadge) {
                    this.hoverCellBadge.textContent = `🎯 Cell #${slot.index + 1} (${currentTxt}) • ${activeTxt}`;
                }
                this.renderSheet();
            }
        } else {
            if (this.hoveredSlotIndex !== null) {
                this.hoveredSlotIndex = null;
                if (this.hoverCellBadge) {
                    this.hoverCellBadge.textContent = '💡 Click any cell to place active photo, or drag photo into cell';
                }
                this.renderSheet();
            }
        }
    }

    handleCanvasMouseLeave() {
        if (this.hoveredSlotIndex !== null) {
            this.hoveredSlotIndex = null;
            if (this.hoverCellBadge) {
                this.hoverCellBadge.textContent = '💡 Click any cell to place active photo, or drag photo into cell';
            }
            this.renderSheet();
        }
    }

    handleCanvasClick(e) {
        const slot = this.getSlotFromMouseEvent(e);
        if (!slot) return;

        this.activeCellIndex = slot.index;
        if (this.cellSelect) this.cellSelect.value = slot.index;

        if (this.uploadedImages.length > 0) {
            this.cellAssignments[slot.index] = this.selectedImageIndex;
            const photoName = this.uploadedImages[this.selectedImageIndex].name;
            Utils.toast(`Inserted Photo #${this.selectedImageIndex + 1} (${photoName}) into Cell #${slot.index + 1}!`, 'success', 1600);
            this.updateCellAssignmentDropdowns();
            this.renderSheet();
        } else {
            Utils.toast(`Cell #${slot.index + 1} selected. Upload photo(s) to place!`, 'info');
        }
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        const photoIdxStr = e.dataTransfer.getData('text/plain');
        const photoIdx = parseInt(photoIdxStr);

        if (isNaN(photoIdx) || !this.uploadedImages[photoIdx]) return;

        const slot = this.getSlotFromMouseEvent(e);
        if (!slot) return;

        this.cellAssignments[slot.index] = photoIdx;
        this.selectedImageIndex = photoIdx;
        this.activeCellIndex = slot.index;

        this.renderUploadedThumbnails();
        this.updateCellAssignmentDropdowns();
        this.renderSheet();

        const photoName = this.uploadedImages[photoIdx].name;
        Utils.toast(`Dropped Photo #${photoIdx + 1} (${photoName}) into Cell #${slot.index + 1}!`, 'success');
    }

    /* =========================================================================
       ZOOM & VIEWPORT CONTROLS (DIRECT PIXEL DIMENSIONS, ZERO DISTORTION)
       ========================================================================= */

    getFitDimensions() {
        const layout = this.currentLayout || this.calculateLayout();
        const paper = layout.paper;
        const wrap = this.canvasWrap || (this.previewCanvas ? this.previewCanvas.parentElement : null);

        // Container visible inner width and height (with breathing room)
        const availW = Math.max(200, (wrap ? wrap.clientWidth : 600) - 48);
        const availH = Math.max(200, (wrap ? wrap.clientHeight : 500) - 48);

        const scaleFit = Math.min(availW / paper.w, availH / paper.h);
        const fitW = Math.max(100, Math.round(paper.w * scaleFit));
        const fitH = Math.max(100, Math.round(paper.h * scaleFit));

        return { fitW, fitH, scaleFit };
    }

    getBase100Dimensions() {
        const layout = this.currentLayout || this.calculateLayout();
        const paper = layout.paper;
        // Standard 96 DPI screen scale (1mm = 96/25.4 = 3.7795 px)
        const scale100 = 96 / 25.4;
        const baseW = Math.round(paper.w * scale100);
        const baseH = Math.round(paper.h * scale100);
        return { baseW, baseH, scale100 };
    }

    adjustZoom(delta) {
        if (this.zoomMode === 'fit') {
            const { fitW } = this.getFitDimensions();
            const { baseW } = this.getBase100Dimensions();
            this.zoomScale = Math.round((fitW / baseW) * 100) / 100;
            this.zoomMode = 'custom';
        }
        this.zoomScale = Math.min(2.5, Math.max(0.25, parseFloat((this.zoomScale + delta).toFixed(2))));
        this.applyZoom();
    }

    setZoom(level) {
        if (level === 'fit') {
            this.zoomMode = 'fit';
            this.zoomScale = 1.0;
        } else {
            this.zoomMode = 'custom';
            this.zoomScale = level;
        }
        this.applyZoom();
    }

    applyZoom() {
        if (!this.previewCanvas || !this.zoomValBadge) return;

        const wrap = this.canvasWrap || (this.previewCanvas ? this.previewCanvas.parentElement : null);

        if (this.zoomMode === 'fit') {
            const { fitW, fitH } = this.getFitDimensions();
            this.previewCanvas.style.width = `${fitW}px`;
            this.previewCanvas.style.height = `${fitH}px`;
            this.previewCanvas.style.maxWidth = '100%';
            this.previewCanvas.style.maxHeight = '100%';
            this.previewCanvas.style.transform = 'none';
            this.zoomValBadge.textContent = 'Fit';

            if (wrap) {
                wrap.scrollLeft = 0;
                wrap.scrollTop = 0;
            }
        } else {
            const { baseW, baseH } = this.getBase100Dimensions();
            const targetW = Math.max(100, Math.round(baseW * this.zoomScale));
            const targetH = Math.max(100, Math.round(baseH * this.zoomScale));

            this.previewCanvas.style.width = `${targetW}px`;
            this.previewCanvas.style.height = `${targetH}px`;
            this.previewCanvas.style.maxWidth = 'none';
            this.previewCanvas.style.maxHeight = 'none';
            this.previewCanvas.style.transform = 'none';
            this.zoomValBadge.textContent = `${Math.round(this.zoomScale * 100)}%`;
        }
    }

    /* =========================================================================
       LAYOUT & TOP-TO-BOTTOM DIMENSIONS CALCULATION
       ========================================================================= */

    getPaperDimensionsMm() {
        let size = this.paperSizes[this.currentPaper] || this.paperSizes['a4'];
        let w = size.w_mm;
        let h = size.h_mm;

        if (this.currentPaper === 'custom') {
            w = parseFloat(this.customPaperW.value) || 210;
            h = parseFloat(this.customPaperH.value) || 297;
        }

        if (this.orientation === 'landscape') {
            return { w: Math.max(w, h), h: Math.min(w, h) };
        } else {
            return { w: Math.min(w, h), h: Math.max(w, h) };
        }
    }

    getPhotoDimensionsMm() {
        const wMm = Utils.convertUnit(this.photoW, this.photoUnit, 'mm', this.dpi);
        const hMm = Utils.convertUnit(this.photoH, this.photoUnit, 'mm', this.dpi);
        return { w: Math.max(1, wMm), h: Math.max(1, hMm) };
    }

    calculateMaxCapacity() {
        const paper = this.getPaperDimensionsMm();
        const photo = this.getPhotoDimensionsMm();

        let headerOffsetMm = 0;
        if (this.enableHeader && this.headerText) {
            const fontMm = (this.headerSize || 10) * (25.4 / 72);
            headerOffsetMm = fontMm + 6;
        }

        let footerOffsetMm = 0;
        if (this.enableFooter && this.footerText) {
            const fontMm = (this.footerSize || 10) * (25.4 / 72);
            footerOffsetMm = fontMm + 6;
        }

        const availW = Math.max(10, paper.w - (this.pageMarginLeft + this.pageMarginRight));
        const availH = Math.max(10, paper.h - (this.pageMarginTop + headerOffsetMm + this.pageMarginBottom + footerOffsetMm));

        const cols = Math.max(1, Math.floor((availW + this.colMargin) / (photo.w + this.colMargin)));
        const rows = Math.max(1, Math.floor((availH + this.rowMargin) / (photo.h + this.rowMargin)));

        return {
            cols,
            rows,
            capacity: cols * rows,
            availW,
            availH
        };
    }

    calculateLayout() {
        const paper = this.getPaperDimensionsMm();
        const photo = this.getPhotoDimensionsMm();
        const count = this.imageCount;

        let headerOffsetMm = 0;
        if (this.enableHeader && this.headerText) {
            const fontMm = (this.headerSize || 10) * (25.4 / 72);
            headerOffsetMm = fontMm + 6;
        }

        let footerOffsetMm = 0;
        if (this.enableFooter && this.footerText) {
            const fontMm = (this.footerSize || 10) * (25.4 / 72);
            footerOffsetMm = fontMm + 6;
        }

        let cols = 1;
        let rows = 1;

        if (this.gridMode === 'manual') {
            rows = this.manualRows;
            cols = this.manualCols;
        } else {
            const maxCap = this.calculateMaxCapacity();
            cols = maxCap.cols;
            rows = Math.min(maxCap.rows, Math.ceil(count / cols));
        }

        const gridTotalW = (cols * photo.w) + Math.max(0, (cols - 1) * this.colMargin);
        const gridTotalH = (rows * photo.h) + Math.max(0, (rows - 1) * this.rowMargin);

        let startX = this.pageMarginLeft;
        let startY = this.pageMarginTop + headerOffsetMm;

        // Vertical Placement:
        // 'top': strictly starts at (pageMarginTop + headerOffsetMm) from the top of the paper
        // 'center': centers the photo grid in available vertical space between header and footer
        if (this.verticalAlign === 'center') {
            const availableSpace = paper.h - (this.pageMarginTop + headerOffsetMm) - (this.pageMarginBottom + footerOffsetMm);
            if (availableSpace > gridTotalH) {
                startY = (this.pageMarginTop + headerOffsetMm) + ((availableSpace - gridTotalH) / 2);
            } else {
                startY = this.pageMarginTop + headerOffsetMm;
            }
        } else {
            startY = this.pageMarginTop + headerOffsetMm;
        }

        // Clamp startY so it is NEVER above the page under any circumstance
        startY = Math.max(this.pageMarginTop + headerOffsetMm, startY);

        if (this.centerOnPage) {
            const availableW = paper.w - this.pageMarginLeft - this.pageMarginRight;
            if (availableW > gridTotalW) {
                startX = this.pageMarginLeft + (availableW - gridTotalW) / 2;
            } else {
                startX = this.pageMarginLeft;
            }
        }
        startX = Math.max(this.pageMarginLeft, startX);

        const slots = [];
        let index = 0;

        if (this.direction === 'column-wise') {
            // Top to bottom in each column, then next column
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    if (index >= count) break;
                    const x = startX + c * (photo.w + this.colMargin);
                    const y = startY + r * (photo.h + this.rowMargin);
                    slots.push({ x, y, r, c, index });
                    index++;
                }
                if (index >= count) break;
            }
        } else { // 'row-wise'
            // Top to bottom row-by-row, left to right
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (index >= count) break;
                    const x = startX + c * (photo.w + this.colMargin);
                    const y = startY + r * (photo.h + this.rowMargin);
                    slots.push({ x, y, r, c, index });
                    index++;
                }
                if (index >= count) break;
            }
        }

        this.currentLayout = {
            paper,
            photo,
            rows,
            cols,
            gridTotalW,
            gridTotalH,
            slots,
            count
        };

        return this.currentLayout;
    }

    /* =========================================================================
       HIGH-FIDELITY PHOTO CELL RENDERING & MIPMAP DOWNSAMPLING
       ========================================================================= */

    /**
     * High-fidelity multi-step mipmap downsampler for HTML5 canvas.
     * Prevents browser bilinear downscaling blur and retains 100% fine facial / print details.
     */
    drawPhotoHighQuality(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        dx = Math.round(dx);
        dy = Math.round(dy);
        dw = Math.round(dw);
        dh = Math.round(dh);

        if (dw <= 0 || dh <= 0) return;

        // If reduction is mild (less than 2x downscale), or upscale, draw directly with high quality
        if (sw <= dw * 2 && sh <= dh * 2) {
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.restore();
            return;
        }

        // Multi-step mipmap downsampling:
        // Pass 1: Extract the source crop onto an offscreen canvas
        let curW = sw;
        let curH = sh;
        let curCanvas = document.createElement('canvas');
        curCanvas.width = curW;
        curCanvas.height = curH;
        let curCtx = curCanvas.getContext('2d');
        curCtx.imageSmoothingEnabled = true;
        curCtx.imageSmoothingQuality = 'high';
        curCtx.drawImage(img, sx, sy, sw, sh, 0, 0, curW, curH);

        // Iteratively downsample by halves (factor of 0.5)
        // Each halving pass uses area-weighted averaging (box filter)
        while (curW * 0.5 >= dw && curH * 0.5 >= dh) {
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

        // Final step: draw from intermediate mipmap to target canvas with bicubic filter
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(curCanvas, 0, 0, curW, curH, dx, dy, dw, dh);
        ctx.restore();
    }

    /**
     * Prepares and caches an ultra-crisp cell bitmap for a given uploaded image.
     * Guarantees exact aspect-ratio preservation (no squashing/stretching) and studio clarity.
     */
    getPreparedCellCanvas(imageIndex, img, targetW, targetH, fit = 'cover') {
        targetW = Math.round(targetW);
        targetH = Math.round(targetH);
        if (targetW <= 0 || targetH <= 0 || !img) return null;

        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        if (!naturalW || !naturalH) return null;

        const key = `${imageIndex}_${targetW}_${targetH}_${fit}`;
        if (this._cellCache.has(key)) {
            return this._cellCache.get(key);
        }

        const cellCvs = document.createElement('canvas');
        cellCvs.width = targetW;
        cellCvs.height = targetH;
        const ctx = cellCvs.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const srcAspect = naturalW / naturalH;
        const destAspect = targetW / targetH;

        if (fit === 'contain') {
            // Fit entire photo inside cell, centered, with pure white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetW, targetH);

            let drawW, drawH, drawX, drawY;
            if (srcAspect > destAspect) {
                drawW = targetW;
                drawH = Math.round(targetW / srcAspect);
                drawX = 0;
                drawY = Math.round((targetH - drawH) / 2);
            } else {
                drawH = targetH;
                drawW = Math.round(targetH * srcAspect);
                drawX = Math.round((targetW - drawW) / 2);
                drawY = 0;
            }

            this.drawPhotoHighQuality(ctx, img, 0, 0, naturalW, naturalH, drawX, drawY, drawW, drawH);
        } else {
            // Default: 'cover' (fill cell completely, crop excess equally from center, zero distortion)
            let sx = 0, sy = 0, sw = naturalW, sh = naturalH;
            if (srcAspect > destAspect) {
                // Source is wider than cell -> crop sides
                sw = Math.round(naturalH * destAspect);
                sx = Math.round((naturalW - sw) / 2);
            } else {
                // Source is taller than cell -> crop top & bottom
                sh = Math.round(naturalW / destAspect);
                sy = Math.round((naturalH - sh) / 2);
            }

            sx = Math.max(0, Math.min(sx, naturalW - 1));
            sy = Math.max(0, Math.min(sy, naturalH - 1));
            sw = Math.max(1, Math.min(sw, naturalW - sx));
            sh = Math.max(1, Math.min(sh, naturalH - sy));

            this.drawPhotoHighQuality(ctx, img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        }

        this._cellCache.set(key, cellCvs);
        return cellCvs;
    }

    drawPhotoToCell(ctx, assigned, destX, destY, destW, destH, fit = 'cover') {
        if (!assigned || !assigned.img) return;
        const dx = Math.round(destX);
        const dy = Math.round(destY);
        const dw = Math.round(destX + destW) - dx;
        const dh = Math.round(destY + destH) - dy;

        const cellCvs = this.getPreparedCellCanvas(assigned.imageIndex, assigned.img, dw, dh, fit);
        if (cellCvs) {
            ctx.drawImage(cellCvs, dx, dy, dw, dh);
        }
    }

    /* =========================================================================
       CANVAS SHEET RENDERING (HIGH-DPI PREVIEW)
       ========================================================================= */

    renderSheet() {
        if (!this.previewCanvas) return;

        const layout = this.calculateLayout();
        const paper = layout.paper;

        const previewDpi = this.previewDpi || 240;
        const canvasW = Math.round((paper.w / Utils.MM_PER_INCH) * previewDpi);
        const canvasH = Math.round((paper.h / Utils.MM_PER_INCH) * previewDpi);

        this.previewCanvas.width = canvasW;
        this.previewCanvas.height = canvasH;
        const ctx = this.previewCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pure white paper sheet
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasW, canvasH);

        const mmToPx = (mm) => (mm / Utils.MM_PER_INCH) * previewDpi;

        // Faint page margin boundary
        ctx.save();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            mmToPx(this.pageMarginLeft),
            mmToPx(this.pageMarginTop),
            mmToPx(paper.w - this.pageMarginLeft - this.pageMarginRight),
            mmToPx(paper.h - this.pageMarginTop - this.pageMarginBottom)
        );
        ctx.restore();

        // Draw Sheet Header if enabled
        if (this.enableHeader && this.headerText) {
            ctx.save();
            const headerSize_px = (this.headerSize / Utils.POINTS_PER_INCH) * previewDpi;
            ctx.font = `600 ${Math.max(10, Math.round(headerSize_px))}px sans-serif`;
            ctx.fillStyle = this.headerColor;
            ctx.textBaseline = 'top';

            let headerX = canvasW / 2;
            if (this.headerAlign === 'left') {
                headerX = mmToPx(this.pageMarginLeft);
                ctx.textAlign = 'left';
            } else if (this.headerAlign === 'right') {
                headerX = mmToPx(paper.w - this.pageMarginRight);
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }

            const headerY = mmToPx(this.pageMarginTop);
            ctx.fillText(this.headerText, headerX, headerY);
            ctx.restore();
        }

        // Draw Sheet Footer if enabled
        if (this.enableFooter && this.footerText) {
            ctx.save();
            const footerSize_px = (this.footerSize / Utils.POINTS_PER_INCH) * previewDpi;
            ctx.font = `500 ${Math.max(9, Math.round(footerSize_px))}px sans-serif`;
            ctx.fillStyle = this.footerColor;
            ctx.textBaseline = 'bottom';

            let footerX = canvasW / 2;
            if (this.footerAlign === 'left') {
                footerX = mmToPx(this.pageMarginLeft);
                ctx.textAlign = 'left';
            } else if (this.footerAlign === 'right') {
                footerX = mmToPx(paper.w - this.pageMarginRight);
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }

            const footerY = mmToPx(paper.h - this.pageMarginBottom);
            ctx.fillText(this.footerText, footerX, footerY);
            ctx.restore();
        }

        const photoW_px = mmToPx(layout.photo.w);
        const photoH_px = mmToPx(layout.photo.h);

        // Render each slot on preview canvas
        layout.slots.forEach((slot, i) => {
            const x = mmToPx(slot.x);
            const y = mmToPx(slot.y);
            const slotX = Math.round(x);
            const slotY = Math.round(y);
            const slotW = Math.round(x + photoW_px) - slotX;
            const slotH = Math.round(y + photoH_px) - slotY;

            const assigned = this.getAssignedImageForSlot(slot.index);

            if (assigned && assigned.img) {
                this.drawPhotoToCell(ctx, assigned, slotX, slotY, slotW, slotH, this.photoFit);

                if (this.enableBorder) {
                    ctx.save();
                    ctx.strokeStyle = this.borderColor;
                    ctx.lineWidth = Math.max(1, Math.round(mmToPx(this.borderWidthMm)));
                    ctx.strokeRect(slotX, slotY, slotW, slotH);
                    ctx.restore();
                }

                if (this.enableCutLines) {
                    this.drawCuttingMarks(ctx, slotX, slotY, slotW, slotH, Math.round(mmToPx(3.5)));
                }
            } else {
                // Interactive empty placeholder
                ctx.fillStyle = '#F8FAFC';
                ctx.fillRect(slotX, slotY, slotW, slotH);

                ctx.save();
                ctx.strokeStyle = '#CBD5E1';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(slotX, slotY, slotW, slotH);
                ctx.restore();

                ctx.fillStyle = '#94A3B8';
                ctx.font = `bold ${Math.max(10, Math.round(slotW * 0.08))}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`+ Slot #${i + 1}`, slotX + slotW / 2, slotY + slotH / 2 - 8);
                ctx.font = `${Math.max(9, Math.round(slotW * 0.065))}px sans-serif`;
                ctx.fillText(`Click to Place`, slotX + slotW / 2, slotY + slotH / 2 + 10);
            }

            // Cell number tag in corner
            ctx.save();
            const badgeW = Math.max(20, Math.round(slotW * 0.22));
            const badgeH = 17;
            ctx.fillStyle = assigned ? 'rgba(15, 23, 42, 0.75)' : 'rgba(100, 116, 139, 0.6)';
            ctx.fillRect(slotX, slotY, badgeW, badgeH);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, slotX + badgeW / 2, slotY + badgeH / 2);
            ctx.restore();

            // Hover Highlight
            if (this.hoveredSlotIndex === slot.index) {
                ctx.save();
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 3;
                ctx.strokeRect(slotX - 1, slotY - 1, slotW + 2, slotH + 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
                ctx.fillRect(slotX, slotY, slotW, slotH);
                ctx.restore();
            }

            // Active Highlight
            if (this.activeCellIndex === slot.index && this.hoveredSlotIndex !== slot.index) {
                ctx.save();
                ctx.strokeStyle = '#10B981';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(slotX, slotY, slotW, slotH);
                ctx.restore();
            }
        });

        // Update statistics badge (Photos Placed & Cell Capacity)
        let placedCount = 0;
        layout.slots.forEach(s => {
            if (this.getAssignedImageForSlot(s.index)) placedCount++;
        });

        this.sheetStatsBadge.textContent = `${placedCount}/${layout.slots.length} Photos Placed | Capacity: ${layout.slots.length}`;
        this.applyZoom();
    }

    drawCuttingMarks(ctx, x, y, w, h, markLen) {
        ctx.save();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([2, 2]);

        ctx.beginPath();
        ctx.moveTo(x - markLen, y); ctx.lineTo(x, y);
        ctx.moveTo(x, y - markLen); ctx.lineTo(x, y);
        ctx.moveTo(x + w, y); ctx.lineTo(x + w + markLen, y);
        ctx.moveTo(x + w, y - markLen); ctx.lineTo(x + w, y);
        ctx.moveTo(x - markLen, y + h); ctx.lineTo(x, y + h);
        ctx.moveTo(x, y + h); ctx.lineTo(x, y + h + markLen);
        ctx.moveTo(x + w, y + h); ctx.lineTo(x + w + markLen, y + h);
        ctx.moveTo(x + w, y + h); ctx.lineTo(x + w, y + h + markLen);
        ctx.stroke();
        ctx.restore();
    }

    /* =========================================================================
       HELPER: CREATE CLEAN EXPORT CANVAS (ONLY OCCUPIED CELLS + HEADER/FOOTER)
       ========================================================================= */

    createCleanExportCanvas(targetDpi = 300) {
        const layout = this.calculateLayout();
        const paper = layout.paper;
        const photo = layout.photo;

        const canvasW = Math.round((paper.w / Utils.MM_PER_INCH) * targetDpi);
        const canvasH = Math.round((paper.h / Utils.MM_PER_INCH) * targetDpi);

        const offscreen = document.createElement('canvas');
        offscreen.width = canvasW;
        offscreen.height = canvasH;
        const ctx = offscreen.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasW, canvasH);

        const mmToPx = (mm) => (mm / Utils.MM_PER_INCH) * targetDpi;
        const photoW_px = mmToPx(photo.w);
        const photoH_px = mmToPx(photo.h);

        // Header on export image
        if (this.enableHeader && this.headerText) {
            ctx.save();
            const headerSize_px = (this.headerSize / Utils.POINTS_PER_INCH) * targetDpi;
            ctx.font = `600 ${Math.max(12, Math.round(headerSize_px))}px sans-serif`;
            ctx.fillStyle = this.headerColor;
            ctx.textBaseline = 'top';

            let headerX = canvasW / 2;
            if (this.headerAlign === 'left') {
                headerX = mmToPx(this.pageMarginLeft);
                ctx.textAlign = 'left';
            } else if (this.headerAlign === 'right') {
                headerX = mmToPx(paper.w - this.pageMarginRight);
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }

            const headerY = mmToPx(this.pageMarginTop);
            ctx.fillText(this.headerText, headerX, headerY);
            ctx.restore();
        }

        // Footer on export image
        if (this.enableFooter && this.footerText) {
            ctx.save();
            const footerSize_px = (this.footerSize / Utils.POINTS_PER_INCH) * targetDpi;
            ctx.font = `500 ${Math.max(10, Math.round(footerSize_px))}px sans-serif`;
            ctx.fillStyle = this.footerColor;
            ctx.textBaseline = 'bottom';

            let footerX = canvasW / 2;
            if (this.footerAlign === 'left') {
                footerX = mmToPx(this.pageMarginLeft);
                ctx.textAlign = 'left';
            } else if (this.footerAlign === 'right') {
                footerX = mmToPx(paper.w - this.pageMarginRight);
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }

            const footerY = mmToPx(paper.h - this.pageMarginBottom);
            ctx.fillText(this.footerText, footerX, footerY);
            ctx.restore();
        }

        // Filter ONLY occupied slots!
        const occupiedSlots = layout.slots.filter(slot => {
            const assigned = this.getAssignedImageForSlot(slot.index);
            return assigned && assigned.img;
        });

        // Draw ONLY the occupied photo cells with high-fidelity rendering
        occupiedSlots.forEach((slot) => {
            const x = mmToPx(slot.x);
            const y = mmToPx(slot.y);
            const slotX = Math.round(x);
            const slotY = Math.round(y);
            const slotW = Math.round(x + photoW_px) - slotX;
            const slotH = Math.round(y + photoH_px) - slotY;

            const assigned = this.getAssignedImageForSlot(slot.index);

            if (assigned && assigned.img) {
                this.drawPhotoToCell(ctx, assigned, slotX, slotY, slotW, slotH, this.photoFit);
            }

            if (this.enableBorder) {
                ctx.save();
                ctx.strokeStyle = this.borderColor;
                ctx.lineWidth = Math.max(1, Math.round(mmToPx(this.borderWidthMm)));
                ctx.strokeRect(slotX, slotY, slotW, slotH);
                ctx.restore();
            }

            if (this.enableCutLines) {
                this.drawCuttingMarks(ctx, slotX, slotY, slotW, slotH, Math.round(mmToPx(4)));
            }
        });

        return { canvas: offscreen, occupiedSlots, canvasW, canvasH };
    }

    /* =========================================================================
       EXPORT AS HIGH-RESOLUTION PRINT-READY VECTOR PDF
       ONLY EXPORTS CELLS WITH IMAGES + HEADER & FOOTER
       ========================================================================= */

    async exportPdf() {
        if (typeof PDFLib === 'undefined') {
            Utils.toast('PDF library not ready', 'error');
            return;
        }

        const layout = this.calculateLayout();
        const paper = layout.paper;
        const photo = layout.photo;

        const occupiedSlots = layout.slots.filter(slot => {
            const assigned = this.getAssignedImageForSlot(slot.index);
            return assigned && assigned.img;
        });

        if (occupiedSlots.length === 0) {
            Utils.toast('No photos placed in cells! Please place at least one photo.', 'warning');
            return;
        }

        this.exportPdfBtn.disabled = true;
        this.exportPdfBtn.textContent = 'Generating PDF...';

        try {
            const mmToPt = 72 / 25.4;
            const pdfW = paper.w * mmToPt;
            const pdfH = paper.h * mmToPt;

            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([pdfW, pdfH]);
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

            // Draw PDF Header if enabled
            if (this.enableHeader && this.headerText) {
                const headerSize_pt = this.headerSize;
                const textW = font.widthOfTextAtSize(this.headerText, headerSize_pt);
                let x_pt = (pdfW - textW) / 2;
                if (this.headerAlign === 'left') {
                    x_pt = this.pageMarginLeft * mmToPt;
                } else if (this.headerAlign === 'right') {
                    x_pt = (paper.w - this.pageMarginRight) * mmToPt - textW;
                }

                const y_pt = pdfH - (this.pageMarginTop * mmToPt) - headerSize_pt;

                const hex = (this.headerColor || '#333333').replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
                const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
                const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

                page.drawText(this.headerText, {
                    x: x_pt,
                    y: y_pt,
                    size: headerSize_pt,
                    font,
                    color: PDFLib.rgb(r, g, b)
                });
            }

            // Draw PDF Footer if enabled
            if (this.enableFooter && this.footerText) {
                const footerSize_pt = this.footerSize;
                const textW = font.widthOfTextAtSize(this.footerText, footerSize_pt);
                let x_pt = (pdfW - textW) / 2;
                if (this.footerAlign === 'left') {
                    x_pt = this.pageMarginLeft * mmToPt;
                } else if (this.footerAlign === 'right') {
                    x_pt = (paper.w - this.pageMarginRight) * mmToPt - textW;
                }

                const y_pt = this.pageMarginBottom * mmToPt;

                const hex = (this.footerColor || '#666666').replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
                const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
                const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

                page.drawText(this.footerText, {
                    x: x_pt,
                    y: y_pt,
                    size: footerSize_pt,
                    font,
                    color: PDFLib.rgb(r, g, b)
                });
            }

            // Embed each unique assigned photo at ultra-high 600 DPI studio resolution
            // Perfectly cropped to cell aspect ratio with zero distortion or squishing
            const pdfImageMap = new Map();
            for (let i = 0; i < this.uploadedImages.length; i++) {
                const item = this.uploadedImages[i];
                if (!item || !item.img) continue;

                const isAssigned = occupiedSlots.some(slot => {
                    const assigned = this.getAssignedImageForSlot(slot.index);
                    return assigned && assigned.imageIndex === i;
                });
                if (!isAssigned) continue;

                // Photo resolution inside PDF: 600 DPI ensures ultra-crisp studio photo print quality in PDF
                const pdfTargetW = Math.max(Math.round((photo.w / Utils.MM_PER_INCH) * 600), 800);
                const pdfTargetH = Math.round(pdfTargetW / (photo.w / photo.h));

                const cellCanvas = this.getPreparedCellCanvas(i, item.img, pdfTargetW, pdfTargetH, this.photoFit);
                if (!cellCanvas) continue;

                const blob = await new Promise(resolve => {
                    cellCanvas.toBlob(resolve, 'image/jpeg', 0.98);
                });
                const arrayBuffer = await blob.arrayBuffer();
                const embedded = await pdfDoc.embedJpg(arrayBuffer);
                pdfImageMap.set(i, embedded);
            }

            const photoW_pt = photo.w * mmToPt;
            const photoH_pt = photo.h * mmToPt;

            occupiedSlots.forEach((slot) => {
                const x_pt = slot.x * mmToPt;
                const y_pt = pdfH - (slot.y * mmToPt) - photoH_pt;

                const assigned = this.getAssignedImageForSlot(slot.index);

                if (assigned && pdfImageMap.has(assigned.imageIndex)) {
                    const img = pdfImageMap.get(assigned.imageIndex);
                    page.drawImage(img, {
                        x: x_pt,
                        y: y_pt,
                        width: photoW_pt,
                        height: photoH_pt
                    });
                }

                if (this.enableBorder) {
                    const borderPt = this.borderWidthMm * mmToPt;
                    const hex = this.borderColor.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
                    const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
                    const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

                    page.drawRectangle({
                        x: x_pt,
                        y: y_pt,
                        width: photoW_pt,
                        height: photoH_pt,
                        borderColor: PDFLib.rgb(r, g, b),
                        borderWidth: borderPt
                    });
                }

                if (this.enableCutLines) {
                    const markLen = 3.5 * mmToPt;
                    const markColor = PDFLib.rgb(0.6, 0.6, 0.6);
                    page.drawLine({ start: { x: x_pt - markLen, y: y_pt }, end: { x: x_pt, y: y_pt }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt - markLen, y: y_pt }, end: { x: x_pt, y: y_pt }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt + photoW_pt, y: y_pt }, end: { x: x_pt + photoW_pt + markLen, y: y_pt }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt + photoW_pt, y: y_pt - markLen }, end: { x: x_pt + photoW_pt, y: y_pt }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt - markLen, y: y_pt + photoH_pt }, end: { x: x_pt, y: y_pt + photoH_pt }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt, y: y_pt + photoH_pt }, end: { x: x_pt, y: y_pt + photoH_pt + markLen }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt + photoW_pt, y: y_pt + photoH_pt }, end: { x: x_pt + photoW_pt, y: y_pt + photoH_pt + markLen }, color: markColor, thickness: 0.5 });
                    page.drawLine({ start: { x: x_pt + photoW_pt, y: y_pt + photoH_pt }, end: { x: x_pt + photoW_pt, y: y_pt + photoH_pt - markLen }, color: markColor, thickness: 0.5 });
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            Utils.downloadBlob(blob, `print_sheet_${this.currentPaper}_${occupiedSlots.length}photos.pdf`);
            Utils.toast(`High-Resolution Print PDF (${occupiedSlots.length} photos) downloaded!`, 'success');
        } catch (err) {
            console.error('PDF export error', err);
            Utils.toast('Failed to generate Print PDF', 'error');
        } finally {
            this.exportPdfBtn.disabled = false;
            this.exportPdfBtn.textContent = 'Download Print-Ready PDF';
        }
    }

    /* =========================================================================
       EXPORT AS HIGH-RESOLUTION 300 / 600 DPI IMAGE
       ========================================================================= */

    async exportHighResImage() {
        const targetDpi = parseInt(this.exportDpiSelect ? this.exportDpiSelect.value : '300', 10) || this.exportDpi || 300;
        const targetFmt = (this.exportFmtSelect ? this.exportFmtSelect.value : 'image/jpeg') || this.exportFmt || 'image/jpeg';
        const isPng = targetFmt === 'image/png';
        const quality = isPng ? 1.0 : 0.98;

        const { canvas, occupiedSlots, canvasW, canvasH } = this.createCleanExportCanvas(targetDpi);

        if (occupiedSlots.length === 0) {
            Utils.toast('No photos placed in cells! Please place at least one photo.', 'warning');
            return;
        }

        this.exportImgBtn.disabled = true;
        this.exportImgBtn.textContent = `Rendering ${targetDpi} DPI...`;

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    Utils.toast(`Failed to render ${targetDpi} DPI sheet image`, 'error');
                    this.exportImgBtn.disabled = false;
                    this.updateExportImgButtonLabel();
                    return;
                }

                let finalBlob = blob;
                if (isPng) {
                    finalBlob = await Utils.setPngDpi(blob, targetDpi);
                } else {
                    finalBlob = await Utils.setJpegDpi(blob, targetDpi);
                }

                const ext = isPng ? 'png' : 'jpg';
                Utils.downloadBlob(finalBlob, `print_sheet_${this.currentPaper}_${occupiedSlots.length}photos_${targetDpi}dpi.${ext}`);
                Utils.toast(`${targetDpi} DPI sheet downloaded (${occupiedSlots.length} photos, ${canvasW} × ${canvasH} px)!`, 'success');

                this.exportImgBtn.disabled = false;
                this.updateExportImgButtonLabel();
            }, targetFmt, quality);

        } catch (err) {
            console.error('High res image export error', err);
            Utils.toast('Error exporting high-res image', 'error');
            this.exportImgBtn.disabled = false;
            this.updateExportImgButtonLabel();
        }
    }

    /* =========================================================================
       DIRECT PRINT (NO DUMMY / PROTOTYPE / EMPTY CELLS)
       ========================================================================= */

    triggerPrint() {
        const targetDpi = 300;
        const { canvas, occupiedSlots } = this.createCleanExportCanvas(targetDpi);

        if (occupiedSlots.length === 0) {
            Utils.toast('No photos placed in cells! Please place at least one photo.', 'warning');
            return;
        }

        const layout = this.calculateLayout();
        const paper = layout.paper;
        const dataUrl = canvas.toDataURL('image/png');

        const printWin = window.open('', '_blank');
        if (!printWin) {
            Utils.toast('Please allow popups to print sheet directly', 'warning');
            return;
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Photo Sheet (${occupiedSlots.length} photos)</title>
                <style>
                    @page {
                        size: ${paper.w}mm ${paper.h}mm;
                        margin: 0mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: ${paper.w}mm !important;
                        height: ${paper.h}mm !important;
                        background: #FFFFFF !important;
                        overflow: hidden !important;
                    }
                    img {
                        width: ${paper.w}mm;
                        height: ${paper.h}mm;
                        max-width: 100%;
                        max-height: 100%;
                        display: block;
                        margin: 0 auto;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
            </html>
        `);
        printWin.document.close();
    }
}

window.PrintSheet = PrintSheet;
