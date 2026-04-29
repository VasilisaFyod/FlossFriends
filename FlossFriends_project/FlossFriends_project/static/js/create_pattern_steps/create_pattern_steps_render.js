Object.assign(PatternCreator.prototype, {
    async loadExistingPattern() {
        try {
            const parsed = JSON.parse(existingPattern.data);
            this.patternData.width = existingPattern.width;
            this.patternData.height = existingPattern.height;
            this.patternCells = parsed.cells || [];
            this.lastLegend = this.attachPaletteToLegend(existingPattern.legend || [], existingPattern.palette);

            this.setCustomSelectValue('#paletteSelect', existingPattern.palette);
            this.setCustomSelectValue('#typeSelect', existingPattern.canvas);

            this.calculateGrid();
            this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);
            this.updateLegendTable(this.lastLegend);
            this.updateFabricSize();

            await this.updateColorsSliderRange();
            if (this.colorsSlider) {
                const currentColors = Math.max(1, Math.min(this.lastLegend.length || 1, parseInt(this.colorsSlider.max, 10)));
                this.colorsSlider.value = currentColors;
                this.colorsValue.textContent = currentColors;
            }

            if (this.colorsValueUsed) {
                this.colorsValueUsed.textContent = this.lastLegend.length || 0;
            }

            if (this.sizeSlider) {
                const widthBasedValue = Math.min(this.sizeSlider.max, Math.max(1, Math.round(this.patternData.width)));
                this.sizeSlider.value = widthBasedValue;
            }
        } catch (e) {
            console.error("Ошибка загрузки паттерна", e);
        }
    },

    updatePatternSizeDebounced() {
        const sliderValue = parseInt(this.sizeSlider.value, 10);
        const maxCrosses = 100;
        const imgWidth = this.patternCanvas.width;
        const imgHeight = this.patternCanvas.height;

        if (imgWidth >= imgHeight) {
            this.patternData.width = Math.max(1, Math.floor((sliderValue / this.sizeSlider.max) * maxCrosses));
            this.patternData.height = Math.max(1, Math.floor(this.patternData.width * (imgHeight / imgWidth)));
        } else {
            this.patternData.height = Math.max(1, Math.floor((sliderValue / this.sizeSlider.max) * maxCrosses));
            this.patternData.width = Math.max(1, Math.floor(this.patternData.height * (imgWidth / imgHeight)));
        }

        this.calculateGrid();
        this.updateFabricSize();
        this.updateColors();
    },

    calculateGrid() {
        const canvas = this.patternCanvas;
        const patternWidth = this.patternData.width;
        const patternHeight = this.patternData.height;
        const cellSize = Math.floor(Math.min(canvas.width / patternWidth, canvas.height / patternHeight));

        this.currentCellSize = cellSize;
        this.currentOffsetX = Math.floor((canvas.width - cellSize * patternWidth) / 2);
        this.currentOffsetY = Math.floor((canvas.height - cellSize * patternHeight) / 2);
    },

    drawPattern() {
        const canvas = this.patternCanvas;
        const ctx = canvas.getContext('2d');
        const img = this.sourceImage;

        const wrapper = canvas.parentElement;
        const scale = Math.min(wrapper.clientWidth / img.width, wrapper.clientHeight / img.height);

        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    },

    drawPatternGrid(cellSize, offsetX = 0, offsetY = 0) {
        const ctx = this.patternCanvas.getContext('2d');

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, this.patternCanvas.width, this.patternCanvas.height);

        for (let y = 0; y < this.patternCells.length; y++) {
            for (let x = 0; x < this.patternCells[y].length; x++) {
                const { r, g, b } = this.patternCells[y][x];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.strokeRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
            }
        }
    },

    async initColorSettings() {
        if (!this.colorsSlider) return;
        await this.updateColorsSliderRange();
        this.colorsSlider.value = this.colorsSlider.max;
        this.updateColors();
    },

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    async fetchPaletteMaxColors() {
        const palette = this.getSelectedPalette();
        try {
            const res = await fetch(`/api/get-palette-max/?palette=${encodeURIComponent(palette)}`);
            if (!res.ok) throw new Error("Palette fetch failed");
            const data = await res.json();
            return data.max_colors || 100;
        } catch (e) {
            console.error(e);
            return 100;
        }
    },

    updateFabricSize() {
        if (!this.patternCanvas) return;
        const countPerCm = this.getCanvasCountPerCm();

        const widthCm = Math.max(1, this.patternData.width / countPerCm).toFixed(1);
        const heightCm = Math.max(1, this.patternData.height / countPerCm).toFixed(1);

        const fabricSizeEl = document.getElementById('fabricSize');
        if (fabricSizeEl) fabricSizeEl.textContent = `${widthCm} x ${heightCm} см`;

        const crossesEl = document.getElementById('crossesSize');
        if (crossesEl) crossesEl.textContent = `${this.patternData.width} x ${this.patternData.height}`;
    },

    async updateColorsSliderRange() {
        const maxColors = await this.fetchPaletteMaxColors();
        if (this.colorsSlider) {
            this.colorsSlider.max = maxColors;
            const currentValueRaw = Number.parseInt(this.colorsSlider.value, 10);
            const currentValue = Number.isFinite(currentValueRaw) ? currentValueRaw : maxColors;
            const nextValue = Math.min(Math.max(currentValue, 1), maxColors);
            this.colorsSlider.value = String(nextValue);
            this.colorsValue.textContent = this.colorsSlider.value;
        }
    },

    async updateColors() {
        if (!this.patternCanvas || !this.sourceImage || !this.colorsSlider) return;

        const maxColorsRaw = Number.parseInt(this.colorsSlider.max, 10);
        const maxColors = Number.isFinite(maxColorsRaw) && maxColorsRaw > 0 ? maxColorsRaw : 1;
        const requestedColorsRaw = Number.parseInt(this.colorsSlider.value, 10);
        const requestedColors = Number.isFinite(requestedColorsRaw) && requestedColorsRaw > 0
            ? requestedColorsRaw
            : maxColors;
        const colors = Math.min(requestedColors, maxColors);
        const widthRaw = Number.parseInt(this.patternData.width, 10);
        const heightRaw = Number.parseInt(this.patternData.height, 10);
        const width = Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : 1;
        const height = Number.isFinite(heightRaw) && heightRaw > 0 ? heightRaw : 1;
        const countPerCmRaw = Number.parseFloat(this.getCanvasCountPerCm());
        const countPerCm = Number.isFinite(countPerCmRaw) && countPerCmRaw > 0 ? countPerCmRaw : 5.5;
        const palette = this.getSelectedPalette() || 'DMC';

        this.colorsSlider.value = String(colors);
        this.colorsValue.textContent = String(colors);

        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        const requestId = Date.now();
        this.lastRequestId = requestId;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 100;
        tempCanvas.height = 100;
        const ctx = tempCanvas.getContext('2d');

        ctx.drawImage(this.sourceImage, 0, 0, tempCanvas.width, tempCanvas.height);

        const imageBase64 = tempCanvas.toDataURL('image/png');

        try {
            const res = await fetch('/api/generate-pattern/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageBase64,
                    width,
                    height,
                    colors,
                    palette,
                    count_per_cm: countPerCm,
                }),
                signal: this.controller.signal
            });
            if (!res.ok) {
                let message = "Server error while generating pattern";
                try {
                    const errorPayload = await res.json();
                    if (errorPayload?.error) message = errorPayload.error;
                } catch (_) {}
                throw new Error(message);
            }
            const data = await res.json();
            if (this.lastRequestId !== requestId) return;

            const legendMap = {};
            (data.legend || []).forEach(l => { legendMap[l.code] = l.symbol; });

            this.patternCells = data.cells.map(row => row.map(cell => ({
                ...cell,
                symbol: cell.code != null && cell.code !== '' ? (legendMap[cell.code] || '?') : ''
            })));

            this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);

            if (this.colorsValueUsed) this.colorsValueUsed.textContent = data.colors_used;

            this.lastLegend = this.attachPaletteToLegend(data.legend || [], this.getSelectedPalette());
            this.updateLegendTable(this.lastLegend);

            const step3Active = document.getElementById('step3')?.classList.contains('active');
            if (step3Active) this.drawPatternSymbols();
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
    },

    convertLength(lengthCm, unit) {
        if (unit === "cm") return lengthCm.toFixed(1) + " см";

        if (unit === "skeins") {
            const countPerCm = this.getCanvasCountPerCm();
            const meters = lengthCm / 100;
            const skeinLengthMeters = 8.7;
            let skeins = meters / skeinLengthMeters;
            if (skeins < 1) skeins = 1;
            skeins = Math.ceil(skeins);

            console.log(`Канва: ${this.getSelectedCanvasName()}, lengthCm: ${lengthCm}, count_per_cm: ${countPerCm}, skeins: ${skeins}`);
            return skeins + " моток";
        }
    },

    drawPatternSymbols() {
        const canvas = this.patternCanvas;
        const ctx = canvas.getContext('2d');
        const cellSize = this.currentCellSize;
        const offsetX = this.currentOffsetX;
        const offsetY = this.currentOffsetY;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${cellSize * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < this.patternCells.length; y++) {
            for (let x = 0; x < this.patternCells[y].length; x++) {
                const cell = this.patternCells[y][x];

                ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
                ctx.fillRect(
                    x * cellSize + offsetX,
                    y * cellSize + offsetY,
                    cellSize,
                    cellSize
                );

                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(
                    x * cellSize + offsetX,
                    y * cellSize + offsetY,
                    cellSize,
                    cellSize
                );

                const hasValidCode = cell.code !== null && cell.code !== undefined && cell.code !== '';
                if (hasValidCode) {
                    ctx.fillStyle = this.getContrastColor(cell.r, cell.g, cell.b);
                    ctx.fillText(
                        cell.symbol,
                        x * cellSize + offsetX + cellSize / 2,
                        y * cellSize + offsetY + cellSize / 2
                    );
                }
            }
        }
    }
});
