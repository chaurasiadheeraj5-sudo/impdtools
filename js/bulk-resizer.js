/**
 * IP TOOLS - Bulk Image Resizer
 * Resize many images at once with one shared set of settings, then download a single ZIP.
 */
class BulkResizer {
    constructor() {
        this.items = []; // { id, file, img, w, h, name, size, status }
        this.nextId = 1;
        this.busy = false;
        const $ = (id) => document.getElementById(id);
        this.dropZone = $('bulk-dropzone');
        this.fileInput = $('bulk-file-input');
        this.panel = $('bulk-editor');
        this.empty = $('bulk-empty');
        this.list = $('bulk-list');
        this.countBadge = $('bulk-count');
        this.mode = $('bulk-mode');
        this.unit = $('bulk-unit');
        this.dpi = $('bulk-dpi');
        this.w = $('bulk-width');
        this.h = $('bulk-height');
        this.pct = $('bulk-percent');
        this.fit = $('bulk-fit');
        this.format = $('bulk-format');
        this.quality = $('bulk-quality');
        this.qualityVal = $('bulk-quality-val');
        this.qualityGroup = $('bulk-quality-group');
        this.targetOn = $('bulk-enable-target-size');
        this.targetBox = $('bulk-target-size-controls');
        this.targetSize = $('bulk-target-size');
        this.targetUnit = $('bulk-target-size-unit');
        this.progress = $('bulk-progress');
        this.progressBar = $('bulk-progress-bar');
        this.downloadBtn = $('bulk-download-btn');
        this.clearBtn = $('bulk-clear-btn');
        this.moreBtn = $('bulk-do-more-btn');
        if (!this.dropZone) return;
        this.bind();
        this.syncMode();
    }

    bind() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => { this.addFiles(e.target.files); this.fileInput.value = ''; });
        ['dragenter', 'dragover'].forEach(ev => this.dropZone.addEventListener(ev, (e) => { e.preventDefault(); this.dropZone.classList.add('drag-over'); }));
        ['dragleave', 'drop'].forEach(ev => this.dropZone.addEventListener(ev, (e) => { e.preventDefault(); this.dropZone.classList.remove('drag-over'); }));
        this.dropZone.addEventListener('drop', (e) => this.addFiles(e.dataTransfer.files));

        this.mode.addEventListener('change', () => this.syncMode());
        this.format.addEventListener('change', () => this.syncMode());
        this.quality.addEventListener('input', () => { this.qualityVal.textContent = this.quality.value + '%'; });
        this.targetOn.addEventListener('change', () => { this.targetBox.classList.toggle('bulk-hidden', !this.targetOn.checked); });
        document.querySelectorAll('.bulk-size-preset').forEach(b => b.addEventListener('click', () => {
            this.targetSize.value = b.dataset.size; this.targetUnit.value = b.dataset.unit;
        }));
        document.querySelectorAll('.bulk-preset').forEach(b => b.addEventListener('click', () => {
            this.mode.value = b.dataset.mode;
            if (b.dataset.pct) this.pct.value = b.dataset.pct;
            if (b.dataset.w) { this.w.value = b.dataset.w; this.h.value = b.dataset.h; this.unit.value = 'px'; }
            this.syncMode();
        }));
        this.list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove]');
            if (btn) this.remove(parseInt(btn.dataset.remove, 10));
        });
        this.downloadBtn.addEventListener('click', () => this.run());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.moreBtn.addEventListener('click', () => this.fileInput.click());
    }

    syncMode() {
        const m = this.mode.value;
        const show = (id, on) => { const el = document.getElementById(id); if (el) el.classList.toggle('bulk-hidden', !on); };
        show('bulk-size-fields', m === 'exact' || m === 'maxside');
        show('bulk-percent-field', m === 'percent');
        show('bulk-height-field', m === 'exact');
        show('bulk-fit-field', m === 'exact');
        document.getElementById('bulk-width-label').textContent = m === 'maxside' ? 'Longest side' : 'Width';
        this.qualityGroup.classList.toggle('bulk-hidden', this.format.value === 'image/png');
    }

    async addFiles(fileList) {
        const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) { Utils.toast('Please choose image files', 'warning'); return; }
        for (const file of files) {
            try {
                const url = URL.createObjectURL(file);
                const img = await Utils.loadImage(url);
                this.items.push({ id: this.nextId++, file, img, url, w: img.naturalWidth, h: img.naturalHeight, name: file.name, size: file.size, status: 'Ready' });
            } catch (e) { console.error(e); Utils.toast(`Could not read ${file.name}`, 'error'); }
        }
        this.render();
    }

    remove(id) {
        const it = this.items.find(i => i.id === id);
        if (it) URL.revokeObjectURL(it.url);
        this.items = this.items.filter(i => i.id !== id);
        this.render();
    }

    clear() {
        this.items.forEach(i => URL.revokeObjectURL(i.url));
        this.items = [];
        this.render();
    }

    render() {
        const has = this.items.length > 0;
        this.panel.style.display = has ? 'grid' : 'none';
        this.empty.style.display = has ? 'none' : 'block';
        this.countBadge.textContent = `${this.items.length} image${this.items.length === 1 ? '' : 's'}`;
        this.list.innerHTML = this.items.map(i => `
            <div class="bulk-item" data-id="${i.id}">
                <img class="bulk-thumb" src="${i.url}" alt="">
                <div class="bulk-item-info">
                    <div class="bulk-item-name" title="${i.name.replace(/"/g, '&quot;')}">${i.name.replace(/</g, '&lt;')}</div>
                    <div class="bulk-item-meta">${i.w} × ${i.h} px · ${Utils.formatBytes(i.size)}</div>
                </div>
                <span class="bulk-item-status" data-status>${i.status}</span>
                <button type="button" class="bulk-remove" data-remove="${i.id}" title="Remove" aria-label="Remove ${i.name.replace(/"/g, '')}">&times;</button>
            </div>`).join('');
    }

    toPx(value, dpi) {
        return Math.max(1, Math.round(Utils.convertUnit(value, this.unit.value, 'px', dpi)));
    }

    getDpi() {
        const v = parseInt(this.dpi.value, 10);
        return v > 0 ? v : 300;
    }

    targetDims(it, dpi) {
        const m = this.mode.value;
        if (m === 'percent') {
            const f = Math.max(1, parseFloat(this.pct.value) || 100) / 100;
            return { w: Math.max(1, Math.round(it.w * f)), h: Math.max(1, Math.round(it.h * f)), fit: 'stretch' };
        }
        if (m === 'maxside') {
            const side = this.toPx(parseFloat(this.w.value) || 1024, dpi);
            const f = side / Math.max(it.w, it.h);
            return { w: Math.max(1, Math.round(it.w * f)), h: Math.max(1, Math.round(it.h * f)), fit: 'stretch' };
        }
        return { w: this.toPx(parseFloat(this.w.value) || 1024, dpi), h: this.toPx(parseFloat(this.h.value) || 1024, dpi), fit: this.fit.value };
    }

    async renderItem(it, dpi) {
        const { w, h, fit } = this.targetDims(it, dpi);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        if (this.format.value === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
        let dw = w, dh = h, dx = 0, dy = 0, sx = 0, sy = 0, sw = it.w, sh = it.h;
        if (fit === 'contain') {
            const s = Math.min(w / it.w, h / it.h); dw = Math.round(it.w * s); dh = Math.round(it.h * s); dx = (w - dw) / 2; dy = (h - dh) / 2;
        } else if (fit === 'cover') {
            const s = Math.max(w / it.w, h / it.h); sw = w / s; sh = h / s; sx = (it.w - sw) / 2; sy = (it.h - sh) / 2;
        }
        ctx.drawImage(it.img, sx, sy, sw, sh, dx, dy, dw, dh);
        let blob;
        if (this.targetOn.checked && this.format.value !== 'image/png') {
            const bytes = Math.round((parseFloat(this.targetSize.value) || 100) * (this.targetUnit.value === 'MB' ? 1048576 : 1024));
            const res = await Utils.canvasToTargetSizeBlob(canvas, this.format.value, bytes, dpi);
            blob = res ? res.blob : null;
        } else {
            blob = await Utils.canvasToDpiBlob(canvas, this.format.value, parseInt(this.quality.value, 10) / 100, dpi);
        }
        return { blob, w, h };
    }

    setStatus(id, text, cls) {
        const el = this.list.querySelector(`[data-id="${id}"] [data-status]`);
        if (el) { el.textContent = text; el.className = 'bulk-item-status ' + (cls || ''); }
    }

    async run() {
        if (this.busy) return;
        if (!this.items.length) { Utils.toast('Add some images first', 'warning'); return; }
        if (typeof JSZip === 'undefined') { Utils.toast('JSZip library not available', 'error'); return; }
        this.busy = true;
        this.downloadBtn.disabled = true;
        this.progress.style.display = 'block';
        const dpi = this.getDpi();
        const ext = this.format.value === 'image/png' ? 'png' : (this.format.value === 'image/webp' ? 'webp' : 'jpg');
        const zip = new JSZip();
        const used = new Set();
        let ok = 0;
        for (let i = 0; i < this.items.length; i++) {
            const it = this.items[i];
            this.setStatus(it.id, 'Resizing…', 'working');
            try {
                const res = await this.renderItem(it, dpi);
                if (!res.blob) throw new Error('empty');
                let base = it.name.replace(/\.[^/.]+$/, '') + `_${res.w}x${res.h}`;
                let name = `${base}.${ext}`, n = 2;
                while (used.has(name)) name = `${base}_${n++}.${ext}`;
                used.add(name);
                zip.file(name, res.blob);
                it.status = `Done · ${Utils.formatBytes(res.blob.size)}`;
                this.setStatus(it.id, it.status, 'done');
                ok++;
            } catch (e) {
                console.error(e);
                it.status = 'Failed';
                this.setStatus(it.id, 'Failed', 'error');
            }
            this.progressBar.style.width = Math.round(((i + 1) / this.items.length) * 100) + '%';
            await new Promise(r => setTimeout(r, 0));
        }
        try {
            if (ok) {
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                Utils.downloadBlob(zipBlob, `bulk_resized_${ok}_images.zip`);
                Utils.toast(`Downloaded ${ok} resized image${ok === 1 ? '' : 's'} as ZIP`, 'success');
            } else {
                Utils.toast('No images could be resized', 'error');
            }
        } finally {
            this.busy = false;
            this.downloadBtn.disabled = false;
            setTimeout(() => { this.progress.style.display = 'none'; this.progressBar.style.width = '0%'; }, 1200);
        }
    }
}
