# impdtools
### Professional Client-Side Image & PDF Processing Suite

**impdtools** is a modern, standalone web application built with HTML5, CSS3, and modern JavaScript. It runs **100% locally in your web browser** — all image and PDF processing is performed entirely client-side on your device. No files or photos are ever uploaded to any external server, ensuring complete privacy, zero latency, and seamless offline capability.

---

## 🚀 Quick Start

1. Navigate to the project directory:
   ```
   c:\Users\shahe\Desktop\IP TOOLS\
   ```
2. Double-click **`index.html`** or right-click and choose **Open with > Google Chrome / Microsoft Edge / Firefox**.
3. That's it! No installations, server setups, or dependencies required.

---

## 🛠️ Included Tools & Features

### 1. 🖼️ Image Resizer
* **Dimension Control**: Set exact Width and Height.
* **Multi-Unit Support**: Seamlessly switch between **Pixels (`px`)**, **Centimeters (`cm`)**, **Millimeters (`mm`)**, and **Inches (`in`)**.
* **DPI Resolution**: Choose between **72 DPI** (web), **96 DPI** (screen), **150 DPI** (standard), **300 DPI** (photo print quality), **600 DPI** (ultra-fine), or custom DPI.
* **DPI Header Injection**: Injects genuine **JFIF APP0 metadata** into JPEG files so Windows Explorer, Adobe Photoshop, and printer drivers recognize the exact DPI and print scale.
* **Proportional Scaling**: One-click Lock Aspect Ratio toggle (`🔒`).
* **Quick Presets**: Instant scaling to 25%, 50%, 75%, 100%, 150%, 200%, Passport (3.5×4.5 cm), US Visa (2×2"), Full HD (1080p), 4K, and 1:1 Square.
* **Output Formats**: Export as **JPG / JPEG**, **PNG**, or **WEBP** with an interactive compression quality slider.
* **Batch Processing**: Upload multiple images and download all resized results at once in a single **ZIP archive**.

---

### 1b. 🗂️ Resize Bulk Images
* Add many images at once (drag, browse or paste), choose **one** method for all: exact width × height (Cover / Contain / Stretch), longest side, or percentage.
* Same units, DPI (with true JFIF/pHYs metadata), JPG / PNG / WEBP, quality slider and per-image **target file size** as the single resizer.
* Per-file progress and status, remove individual files, then **Resize & Download ZIP**.

---

### 2. 🔀 Append & Combine Images
* **Side-by-Side & Stacked**: Combine two images **horizontally** (side-by-side) or **vertically** (stacked).
* **Individual Dimension Control**: Independently configure custom Width, Height, and Units (`px`, `cm`, `mm`, `inch`) for **Image 1** and **Image 2**.
* **Fit Modes**: Choose between **Cover**, **Contain**, or **Stretch** for each individual image.
* **Alignment**: Align images to Center, Start (Top/Left), or End (Bottom/Right).
* **Gap & Spacing**: Adjust the spacing/gap between images in `px`, `mm`, or `cm`.
* **Background Color**: Customizable canvas background color (White, Transparent, Black, or custom hex).
* **DPI & Format**: Select output DPI (72, 150, 300, 600) and format (**JPG/JPEG** or **PNG**).
* **One-Click Swap**: Instantly swap Image 1 and Image 2 positions.

---

### 3. ✂️ Image Cropper
* **Interactive Visual Cropping**: Smooth mouse/touch drag handles, bounding box repositioning, and real-time dimension badges powered by Cropper.js.
* **Physical Unit Specification**: Enter exact desired crop dimensions in **`cm`**, **`mm`**, **`px / ox`**, or **`inch`**.
* **DPI Physical-to-Pixel Conversion**: Automatically computes the exact pixel dimensions based on the chosen print DPI (`px = (unit / 2.54) * DPI`).
* **Aspect Ratio Presets**:
  * Free-form crop
  * 1:1 Square
  * **3.5 × 4.5 cm** (Passport India, UK, Europe, Australia)
  * **2 × 2 inches** (US Visa, Passport, OCI)
  * **3 × 4 cm** (Standard ID)
  * 4:3, 16:9, and 3:2
* **Transformations**: Rotate 90° Clockwise / Counter-Clockwise, Flip Horizontal, Flip Vertical, Zoom In/Out, and Reset.
* **Studio-Grade Resampling Engine**:
  * **Zero Blur Multi-Step Mipmap Downsampler**: When scaling down to passport or ID dimensions (e.g. 3.5 × 4.5 cm @ 300/600 DPI), it performs area-weighted half-step mipmapping instead of single-pass browser downsampling, preserving 100% of facial details, eye sharpness, and hair textures.
  * **Native Sensor Crop Extraction**: Extracts crop regions at full native resolution with full rotation and flip preservation.
  * **98% Studio Quality Default**: Exports with visually lossless 98% JPEG compression or 100% Lossless PNG with JFIF/pHYs print metadata.
* **Exact Dimension Export**: Option to export the cropped image scaled to the exact physical print dimensions at 300 or 600 DPI.

---

### 4. 🖨️ Print Sheet Layout (Passport & Multi-Photo Grid with Presto! Cell Assignment)
* **Presto! Mr. Photo-Style Cell-by-Cell Placement**:
  * **Photo Tray**: Shows all loaded photos with badges (`#1`, `#2`, etc.) and an active selection ring. Includes a **Clear Tray** button (`🗑️ Clear Tray`) to delete all loaded photos in one click.
  * **Interactive Cell Placement**: Click any photo in the tray to set it active, then click directly on **any cell** on the sheet preview to insert that exact photo!
  * **Drag & Drop**: Drag a photo directly from the tray and drop it into any cell on the sheet canvas.
  * **Batch Actions**:
    * ⚡ **Fill All Cells**: Fills the entire paper sheet with the currently active photo.
    * ➕ **Fill Empty Cells**: Fills only blank/unassigned cells with the active photo.
    * 🔁 **Fill Sequentially**: Distributes all uploaded photos sequentially across cells (1, 2, 3...).
    * ❌ **Clear Cell**: Clears the photo from the active cell.
    * 🗑️ **Clear All Cells**: Empties all cells to design a custom layout from scratch.
  * **Panel Dropdown Assignment**: Select target cell (`Cell 1`, `Cell 2`...) and select photo from dropdowns.
* **Sticky Scrolling Preview Panel**:
  * The preview area is **sticky** (`position: sticky`), smoothly moving down with your scrollbar as you adjust settings on the left.
  * **Interactive Zoom Toolbar**: Direct-pixel rendering with Zoom In (`+`), Zoom Out (`-`), `Fit to Screen` (auto-fitting entire sheet with zero scroll clipping), and `100% Scale` (true 1:1 96 DPI view).
* **Saved Layout Presets**:
  * Default preset: **Presto! 6×7 Grid (30×35mm, 7 Rows × 6 Cols, 4mm Gap, Light Black Border)** for 42 photos.
  * Save custom print setups with custom names, load them instantly from the dropdown, or delete obsolete presets.
  * **Custom Sheet Header**: Configure header text, alignment (Center, Left, Right), font size (10–36 pt), and color. Rendered crisply at the top margin on both screen preview and print PDF.
  * **Custom Sheet Footer**: Configure footer text, alignment, font size, and color. Rendered at the bottom margin.
* **Save & Load Named Layout Presets**:
  * Save custom print setups with custom names (e.g. `My Passport A4 8-Grid`, `Stamp Size Sheet`, `4x6 Bordered`).
  * Quickly switch between saved presets from the dropdown menu, or delete obsolete presets anytime.
* **Clean Top-to-Bottom Export (No Empty / Dummy / Prototype Cells)**:
  * Exported PDF, 300 DPI image, and direct browser print only render **actual occupied photo cells**.
  * Empty prototype grid cells, dashed placeholders, and dummy boxes are automatically filtered out.
  * Photos align strictly from top-to-bottom starting at the specified page top margin.
* **Paper Selection**:
  * **A4** (210 × 297 mm)
  * **A3** (297 × 420 mm)
  * **A5** (148 × 210 mm)
  * **US Letter** (8.5 × 11 in)
  * **US Legal** (8.5 × 14 in)
  * **4 × 6 inch Photo Paper** (101.6 × 152.4 mm)
  * **5 × 7 inch Photo Paper** (127 × 177.8 mm)
  * **Custom Paper Size** (enter custom width and height in mm)
* **Paper Orientation**: Portrait or Landscape.
* **Single or Multi-Photo**: Upload 1 photo to duplicate across the grid, or upload multiple photos.
* **Photo Count**: Choose any number of copies (1 to 100+) or click **"Fit Maximum Photos"** to automatically calculate the maximum number that fits on the sheet.
* **Photo Dimensions**: Configure exact Width and Height in `cm`, `mm`, `inch`, or `px` with popular presets:
  * Passport India / UK / EU (3.5 × 4.5 cm)
  * US Visa / Passport / OCI (2 × 2 in / 5.08 × 5.08 cm)
  * Stamp size (2 × 2.5 cm)
  * Standard ID (3 × 4 cm)
  * 4 × 6 cm
  * Wallet size (2.5 × 3.5 in)
* **Arrangement Direction**:
  * **Row-wise**: Fills Row 1 (Col 1, Col 2...) then Row 2.
  * **Column-wise**: Fills Column 1 (Row 1, Row 2...) then Column 2.
* **Grid Modes**:
  * **Auto Grid**: Automatically computes optimal rows and columns.
  * **Manual Grid**: Manually specify the exact number of Rows and Columns.
* **Margins & Spacing**:
  * **Row Margin**: Vertical gap between photos in mm.
  * **Column Margin**: Horizontal gap between photos in mm.
  * **Page Margins**: Top, Bottom, Left, and Right margins in mm.
  * **Center on Page**: Automatically centers the photo grid on the paper sheet.
* **Borders & Guidelines**:
  * **Photo Border**: Enable/Disable customizable border with thickness (mm) and color picker.
  * **Cutting Guidelines**: Generates corner trim tick marks to guide scissors or paper cutters.
* **Export Options & Pristine Studio Quality Engine**:
  * **Zero Aspect-Ratio Distortion**: Photos maintain true proportions via smart centered cover crop (or contain fit) — faces are never squashed or stretched.
  * **Multi-Step Mipmap Downsampling**: Uses area-weighted step-down downsampling on canvas to eliminate browser bilinear blur and preserve 100% of high-frequency details (eyes, skin textures, hair strands).
  * **High-DPI Screen Preview**: Canvas preview rendered at 240 DPI with device-pixel matching for crisp Retina display fidelity.
  * **Print-Ready PDF (600+ DPI Photo Studio Master)**: Vector-scaled PDF generated with millimeter precision via `pdf-lib`. Each photo is embedded at 600+ DPI photographic lab resolution with exact cell aspect ratios and full orientation correction.
  * **Selectable Export Resolution (300 DPI / 600 DPI Ultra-HD)**: Choose standard 300 DPI or 600 DPI Ultra-HD Studio quality for high-end photo paper printing.
  * **Format Selection**: Export as high-quality JPG (98% quality with JFIF DPI header) or 100% Lossless PNG (with pHYs DPI chunk).
  * **Direct Browser Print**: Clean high-res 300 DPI canvas printed directly with exact millimeter CSS page bounds.

---

### 5. 📄 PDF Tools Suite
* **📐 Resize PDF**:
  * Upload any PDF.
  * Scale pages to standard formats (**A4**, **A3**, **A5**, **US Letter**, **US Legal**, or custom mm).
  * Orientation: Auto (match source page), Portrait, or Landscape.
  * Fit Mode: Contain (preserve aspect ratio and center on page) or Stretch to fill.
  * **Target Output File Size (Dedicated Compression Limit)**:
    * Set maximum target file size in **KB** or **MB** (with quick presets for **100 KB**, **200 KB**, **500 KB**, **1 MB**, **2 MB**).
    * If the vector-resized PDF already satisfies the target limit, it preserves pristine vector sharpness and selectable text.
    * If the PDF exceeds the limit, it automatically renders pages at 150 DPI and applies dynamic per-page binary search JPEG compression to ensure the resulting PDF fits strictly within the user's required file size limit (ideal for exam, visa, job, and government portals).
* **✂️ Split PDF**:
  * Interactive page thumbnails rendered via `PDF.js` with selection checkboxes.
  * **Extract Selected Pages**: Specify page ranges like `1-3, 5, 8-10`.
  * **Split All Pages**: Automatically extracts every page into a standalone single-page PDF and bundles them in a downloadable `.zip` file.
  * **Split by Interval**: Split every N pages into separate PDF documents.
* **📑 Merge PDF**:
  * Upload 2 or more PDF documents.
  * View page counts, file sizes, and reorder documents using the Up/Down controls.
  * Merge all into a single unified document with one click.
* **✏️ Edit PDF**:
  * View interactive page cards with thumbnails.
  * **Page Rotation**: Rotate individual pages 90° clockwise/counter-clockwise, or rotate all pages at once.
  * **Delete Pages**: Remove unwanted pages before exporting.
  * **Reorder Pages**: Move pages left or right to change the document sequence.
  * **Text Watermark**: Add text (e.g. `CONFIDENTIAL`, `DRAFT`, `SAMPLE`) with configurable font size, color, opacity (15% to 80%), and rotation angle (45° diagonal or horizontal).
  * **Signature / Stamp**: Upload a PNG/JPG signature or official stamp, choose target page (Last, First, All, or custom page number), position (Bottom-Right, Bottom-Left, Center, Top-Right), and scale.

---

## 🎨 UI & Quality of Life Features

* **Full Website Settings Persistence**: Every setting across every tool (Active Tool Tab, Resizer options, Combiner settings, Cropper dimensions, PDF configurations, Print Sheet layout, Header & Footer, Theme) is automatically saved to `localStorage` and seamlessly restored on page reload.
* **Dark & Light Themes**: Smooth toggle between obsidian dark mode and crisp light mode with localStorage persistence.
* **Clipboard Paste (`Ctrl+V`)**: Copy an image from anywhere and press `Ctrl+V` to load it directly into the active tool.
* **Drag-and-Drop**: Drop images or PDFs directly onto any tool dropzone.
* **Offline Bundled Libraries**: Bundled in `lib/` with automated CDN fallbacks so the app works anywhere without internet access.
* **Fully Responsive on All Device Resolutions**:
  * **3-Line Collapsible Navigation Drawer**: On tablets and mobile screens (`≤ 960px`), the horizontal tab bar transitions into a crisp 3-line hamburger menu button in the header. Tapping it opens a smooth right-side slide-in drawer containing all tools with icons, descriptive labels, and active status indicators. Tapping any tool switches the view and smoothly closes the drawer.
  * **Adaptive Layouts**: Adapts seamlessly to large monitors, laptops, tablets, and phones (down to 320px). Preview panels switch from desktop sticky mode to stacked mobile scrolling, form grids flex gracefully, and buttons maintain comfortable touch targets (minimum 44px).

---

## 🖨️ Printing Guide (Ensuring Millimeter Accuracy)

When printing your exported PDF or image from Chrome, Edge, or Adobe Acrobat:
1. Select the paper size that matches your sheet (e.g. **A4** or **4×6"**).
2. Under print scale options, choose **"100%"** or **"Actual Size"** (do NOT choose *"Fit to Printable Area"* or *"Shrink to Fit"*, as that introduces scaling distortion).
3. Ensure borders and cut marks are turned on in the Print Sheet tool for quick scissor trimming.

---

## 📂 Project Structure

```
c:\Users\shahe\Desktop\IP TOOLS\
├── index.html              # Main single-page web app
├── css\
│   └── styles.css          # Modern dark/light responsive styles
├── js\
│   ├── app.js              # Application controller & theme switcher
│   ├── utils.js            # Unit conversion, JFIF/PNG DPI injectors, downloaders
│   ├── image-resizer.js    # Image resizing & batch ZIP export
│   ├── image-combiner.js   # Side-by-side & stacked image combiner
│   ├── image-cropper.js    # Interactive crop with cm/mm/inch/px inputs
│   ├── print-sheet.js      # Passport & multi-photo paper sheet generator
│   └── pdf-tools.js        # PDF Resize, Split, Merge, and Edit
├── lib\                    # Bundled offline libraries
│   ├── pdf-lib.min.js      # PDF creation & modification
│   ├── pdf.min.js          # PDF rendering & thumbnails
│   ├── pdf.worker.min.js   # PDF.js web worker
│   ├── cropper.min.js      # Interactive image cropping
│   ├── cropper.min.css     # Cropper.js styles
│   └── jszip.min.js        # Client-side ZIP archive creation
└── README.md               # Documentation
```

---

*100% Client-Side • Secure • Zero Tracking • Completely Private*

**2026 © All rights reserved - impdtools**
