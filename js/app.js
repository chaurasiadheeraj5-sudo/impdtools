/**
 * IP TOOLS - Main Application Controller
 * Handles category switching (Image vs PDF), in-page tool selection hubs,
 * tool operation activation with back buttons, theme management, and paste.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Tools
    const imageResizer = new ImageResizer();
    const bulkResizer = new BulkResizer();
    const imageCombiner = new ImageCombiner();
    const imageCropper = new ImageCropper();
    const printSheet = new PrintSheet();
    const pdfTools = new PDFTools();

    // 2. Navigation & Hub Elements
    const catBtnImage = document.getElementById('cat-btn-image');
    const catBtnPdf = document.getElementById('cat-btn-pdf');
    const hubImageTools = document.getElementById('hub-image-tools');
    const hubPdfTools = document.getElementById('hub-pdf-tools');
    const toolViews = document.querySelectorAll('.tool-view');
    const heroSection = document.querySelector('.hero-calligraphy-section');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
    const mobileNavCloseBtn = document.getElementById('mobile-nav-close-btn');

    let currentCategory = 'image'; // 'image' | 'pdf'
    let currentActiveTool = null;  // null (showing hub) or toolId (e.g. 'resize-image')

    function openMobileDrawer() {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.add('open');
        if (mobileNavBackdrop) mobileNavBackdrop.classList.add('open');
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.add('is-active');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }
        mobileNavDrawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('mobile-nav-open');
    }

    function closeMobileDrawer() {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.remove('open');
        if (mobileNavBackdrop) mobileNavBackdrop.classList.remove('open');
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('is-active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        mobileNavDrawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-nav-open');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            if (mobileNavDrawer && mobileNavDrawer.classList.contains('open')) {
                closeMobileDrawer();
            } else {
                openMobileDrawer();
            }
        });
    }

    if (mobileNavCloseBtn) {
        mobileNavCloseBtn.addEventListener('click', closeMobileDrawer);
    }

    if (mobileNavBackdrop) {
        mobileNavBackdrop.addEventListener('click', closeMobileDrawer);
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNavDrawer && mobileNavDrawer.classList.contains('open')) {
            closeMobileDrawer();
        }
    });

    /**
     * Show Category Selection Hub (Image or PDF)
     */
    function showHub(category) {
        currentCategory = category || 'image';
        currentActiveTool = null;

        // Update Nav Category Buttons
        if (catBtnImage && catBtnPdf) {
            catBtnImage.classList.toggle('active', currentCategory === 'image');
            catBtnImage.setAttribute('aria-selected', currentCategory === 'image');
            catBtnPdf.classList.toggle('active', currentCategory === 'pdf');
            catBtnPdf.setAttribute('aria-selected', currentCategory === 'pdf');
        }

        // Hide all tool views
        toolViews.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });
        document.querySelectorAll('.tool-selection-hub').forEach(h => h.classList.remove('tool-mode'));
        document.querySelectorAll('.hub-tool-btn').forEach(b => b.classList.remove('active'));

        // Show appropriate selection hub
        if (hubImageTools && hubPdfTools) {
            if (currentCategory === 'image') {
                hubImageTools.classList.add('active');
                hubImageTools.style.display = 'block';
                hubPdfTools.classList.remove('active');
                hubPdfTools.style.display = 'none';
            } else {
                hubPdfTools.classList.add('active');
                hubPdfTools.style.display = 'block';
                hubImageTools.classList.remove('active');
                hubImageTools.style.display = 'none';
            }
        }

        // Show Hero Section in hub view
        if (heroSection) {
            heroSection.style.display = 'block';
        }

        try {
            localStorage.setItem('iptools_active_view_type', 'hub');
            localStorage.setItem('iptools_active_category', currentCategory);
        } catch (e) {}

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function syncActiveToolButtons(toolId, subtab) {
        document.querySelectorAll('.hub-tool-btn').forEach(btn => {
            const same = btn.dataset.tool === toolId && (!subtab || btn.dataset.pdfSubtab === subtab);
            btn.classList.toggle('active', same);
            btn.setAttribute('aria-selected', same ? 'true' : 'false');
        });
    }

    /**
     * Switch directly to a Tool Operation View
     */
    function switchTool(toolId, subtab) {
        currentActiveTool = toolId;
        const isPdf = (toolId === 'pdf-tools');
        currentCategory = isPdf ? 'pdf' : 'image';

        // Update Nav Category Buttons
        if (catBtnImage && catBtnPdf) {
            catBtnImage.classList.toggle('active', !isPdf);
            catBtnImage.setAttribute('aria-selected', !isPdf);
            catBtnPdf.classList.toggle('active', isPdf);
            catBtnPdf.setAttribute('aria-selected', isPdf);
        }

        // A chosen tool is shown on its own: hide both selection hubs (the Back button returns to them)
        [hubImageTools, hubPdfTools].forEach(h => {
            if (h) { h.classList.remove('active', 'tool-mode'); h.style.display = 'none'; }
        });

        // Show specific tool view
        toolViews.forEach(view => {
            const isTarget = (view.id === `view-${toolId}`);
            view.classList.toggle('active', isTarget);
            view.style.display = isTarget ? 'block' : 'none';
        });

        // Hide hero section when inside a tool operation for maximum workspace focus
        if (heroSection) {
            heroSection.style.display = 'none';
        }

        // Handle PDF subtab if switching to PDF
        if (isPdf && typeof pdfTools !== 'undefined') {
            const targetSubtab = subtab || pdfTools.activeTab || 'resize';
            pdfTools.switchTab(targetSubtab);
        }

        syncActiveToolButtons(toolId, isPdf ? (subtab || (pdfTools && pdfTools.activeTab) || 'resize') : null);

        try {
            localStorage.setItem('iptools_active_view_type', 'tool');
            localStorage.setItem('iptools_active_tool', toolId);
            localStorage.setItem('iptools_active_category', currentCategory);
            if (isPdf && subtab) {
                localStorage.setItem('iptools_active_pdf_subtab', subtab);
            }
        } catch (e) {}

        // Trigger specific resize / render on view activate
        if (toolId === 'print-sheet') {
            printSheet.renderSheet();
        } else if (toolId === 'append-images') {
            imageCombiner.renderCombinedCanvas();
        } else if (toolId === 'resize-image') {
            imageResizer.updatePreview();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Category Buttons Click Handlers in Nav Bar (Show Hub)
    if (catBtnImage) {
        catBtnImage.addEventListener('click', () => {
            showHub('image');
        });
    }
    if (catBtnPdf) {
        catBtnPdf.addEventListener('click', () => {
            showHub('pdf');
        });
    }

    // Hub Tools Buttons and Cards Clicks (Open Tool)
    document.addEventListener('click', (e) => {
        const hubItem = e.target.closest('.hub-tool-btn, .hub-card, .mobile-nav-item');
        if (hubItem) {
            const toolId = hubItem.dataset.tool;
            const subtab = hubItem.dataset.pdfSubtab;
            if (toolId) {
                switchTool(toolId, subtab);
                closeMobileDrawer();
            }
            return;
        }

        // Back to Hub Buttons Click Handler
        const backBtn = e.target.closest('.btn-back-to-hub');
        if (backBtn) {
            const category = backBtn.dataset.category || currentCategory || 'image';
            showHub(category);
            return;
        }
    });

    // 3. Theme Toggle (Dark / Light mode)
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mobileThemeBtn = document.getElementById('mobile-drawer-theme-btn');
    const savedTheme = localStorage.getItem('iptools_theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('iptools_theme', newTheme);
            updateThemeIcon(newTheme);
            Utils.toast(`Switched to ${newTheme} mode`, 'info', 1500);
        });
    }

    if (mobileThemeBtn && themeToggleBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            themeToggleBtn.click();
        });
    }

    function updateThemeIcon(theme) {
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
        }
        const mobileThemeIcon = document.querySelector('.mobile-theme-icon');
        const mobileThemeText = document.querySelector('.mobile-theme-text');
        if (mobileThemeIcon) {
            mobileThemeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        if (mobileThemeText) {
            mobileThemeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    // 4. Global Clipboard Paste (Ctrl+V)
    window.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (!blob) continue;

                // If in hub, switch to resize-image first
                if (!currentActiveTool) {
                    switchTool('resize-image');
                }

                if (currentActiveTool === 'resize-image') {
                    imageResizer.handleFiles([blob]);
                } else if (currentActiveTool === 'bulk-resize') {
                    bulkResizer.addFiles([blob]);
                } else if (currentActiveTool === 'crop-image') {
                    imageCropper.loadFile(blob);
                } else if (currentActiveTool === 'print-sheet') {
                    printSheet.handleImagesUpload([blob]);
                } else if (currentActiveTool === 'append-images') {
                    if (!imageCombiner.img1) {
                        imageCombiner.handleImageUpload(blob, 1);
                    } else {
                        imageCombiner.handleImageUpload(blob, 2);
                    }
                }
                Utils.toast('Pasted image from clipboard!', 'success');
                break;
            }
        }
    });

    // 5. Help Modal Toggle
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpCloseBtn = document.getElementById('help-close-btn');

    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
        if (helpCloseBtn) {
            helpCloseBtn.addEventListener('click', () => helpModal.classList.remove('show'));
        }
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('show');
        });

        const mobileHelpBtn = document.getElementById('mobile-drawer-help-btn');
        if (mobileHelpBtn) {
            mobileHelpBtn.addEventListener('click', () => {
                closeMobileDrawer();
                helpModal.classList.add('show');
            });
        }
    }

    // 6. Resizer Preset Active Pill State
    document.addEventListener('click', (e) => {
        const presetBtn = e.target.closest('.resizer-preset-btn');
        if (presetBtn) {
            document.querySelectorAll('.resizer-preset-btn').forEach(b => b.classList.remove('active'));
            presetBtn.classList.add('active');
        }
    });

    // Header gets a paper backdrop once the page is scrolled
    const appHeader = document.querySelector('.app-header');
    const onScroll = () => appHeader && appHeader.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Logo = Home: back to the Image Tools landing page
    const brandHome = document.getElementById('brand-home-link');
    if (brandHome) {
        brandHome.addEventListener('click', (e) => {
            e.preventDefault();
            showHub('image');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Default initialization: show the Image Tools Selection Hub
    showHub('image');
});
