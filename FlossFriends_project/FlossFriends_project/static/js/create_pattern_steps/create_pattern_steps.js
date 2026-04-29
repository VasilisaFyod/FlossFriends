class PatternCreator {
    constructor(imageUrl) {
        this.sourceImage = new Image();
        this.sourceImage.src = imageUrl;

        this.patternCanvas = document.getElementById('patternCanvas');
        this.sizeSlider = document.getElementById('sizeSlider');
        this.colorsSlider = document.getElementById('colorsSlider');
        this.colorsValue = document.getElementById('colorsValue');
        this.colorsValueUsed = document.getElementById('colorsValueUsed');

        this.patternData = { width: 50, height: 50 };
        this.patternCells = [];
        this.currentCellSize = 0;
        this.currentOffsetX = 0;
        this.currentOffsetY = 0;
        this.controller = null;
        this.canvasList = [];
        this.lastLegend = [];
        this.inventoryThreads = [];
        this._pendingReplacement = null;

        this.replacementModal = document.getElementById('threadReplacementModal');
        this.bindReplacementModalEvents();
        this.loadInventoryThreads();

        this.isEdit = existingPattern !== null;

        this.sourceImage.onload = async () => {
            this.drawPattern();
            await this.loadCanvasData();

            if (this.isEdit) {
                await this.loadExistingPattern();
            } else {
                this.updatePatternSizeDebounced();
                this.initColorSettings();
            }
        };

        this.sizeSlider.addEventListener('input', () => this.updatePatternSizeDebounced());
        this.colorsSlider?.addEventListener('input', this.debounce(() => this.updateColors(), 150));
    }

    async loadCanvasData() {
        try {
            this.canvasList = await this.fetchCanvasData();
            this.updateCanvasSelectOptions();
        } catch (e) {
            console.error("Ошибка загрузки канвы", e);
            this.canvasList = [];
        }
    }

    updateCanvasSelectOptions() {
        const select = document.getElementById('typeSelect');
        const selectItems = select?.querySelector('.select-items');
        const selectedDiv = select?.querySelector('.select-selected');
        if (!selectItems) return;

        const currentValue = selectedDiv?.textContent?.trim() || '';
        selectItems.innerHTML = '';
        this.canvasList.forEach(canvas => {
            const option = document.createElement('div');
            option.textContent = canvas.name;
            option.setAttribute('data-value', canvas.name);
            selectItems.appendChild(option);
        });

        if (!selectedDiv) return;
        const normalizedCurrent = currentValue.toLowerCase();
        const matchedCanvas = this.canvasList.find(
            (canvas) => String(canvas.name || '').trim().toLowerCase() === normalizedCurrent
        );

        if (matchedCanvas) {
            selectedDiv.textContent = matchedCanvas.name;
            return;
        }

        if (this.canvasList.length > 0) {
            selectedDiv.textContent = this.canvasList[0].name;
        }
    }

    async fetchCanvasData() {
        try {
            const res = await fetch('/api/get-canvas/');
            if (!res.ok) throw new Error("Canvas list fetch failed");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async loadInventoryThreads() {
        try {
            this.inventoryThreads = await this.fetchInventoryThreads();
        } catch (e) {
            console.error("Ошибка загрузки ниток из инвентаря", e);
            this.inventoryThreads = [];
        }

        this.updateLegendTable(this.lastLegend || []);
    }

    async fetchInventoryThreads() {
        try {
            const currentPatternId = existingPattern?.id ? `?current_pattern_id=${encodeURIComponent(existingPattern.id)}` : '';
            const res = await fetch(`/api/inventory-threads/${currentPatternId}`);
            if (!res.ok) throw new Error("Inventory fetch failed");
            const data = await res.json();
            return Array.isArray(data.threads) ? data.threads : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    getCanvasCountPerCm() {
        if (!this.canvasList || this.canvasList.length === 0) return 5.5;

        const selectedName = this.getSelectedCanvasName();
        const canvas = this.canvasList.find(c => c.name === selectedName);
        const parsed = canvas ? Number.parseFloat(canvas.count_per_cm) : Number.NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 5.5;
    }

    getSelectedCanvasName() {
        const select = document.getElementById("typeSelect");
        const selectedDiv = select?.querySelector(".select-selected");
        if (!selectedDiv) return '';
        const selectedValue = selectedDiv.textContent.trim();
        const normalizedSelected = selectedValue.toLowerCase();

        const canvas = this.canvasList.find(
            c => String(c.name || '').trim().toLowerCase() === normalizedSelected
        );
        if (canvas) return canvas.name;

        return selectedValue || this.canvasList[0]?.name || '';
    }

    getSelectedPalette() {
        const select = document.getElementById("paletteSelect");
        const selectedDiv = select?.querySelector(".select-selected");
        if (!selectedDiv) return 'DMC';
        const items = select.querySelectorAll(".select-items div");
        const selectedText = selectedDiv.textContent.trim();

        for (let item of items) {
            if (item.textContent.trim() === selectedText) return item.dataset.value;
        }

        const firstOption = items[0];
        return firstOption?.dataset?.value || 'DMC';
    }

    getSelectedLengthUnit() {
        const select = document.querySelector("#step3 .custom-select");
        const selected = select?.querySelector(".select-selected")?.textContent || "";

        if (selected.includes("см")) return "cm";
        if (selected.includes("мотк")) return "skeins";

        return "cm";
    }

    setCustomSelectValue(selector, value) {
        if (!value) return;
        const select = document.querySelector(selector);
        const selectedDiv = select?.querySelector('.select-selected');
        if (selectedDiv) selectedDiv.textContent = value;
    }

    // Pattern loading, generation and canvas rendering live in create_pattern_steps_render.js.
    // Legend, inventory and replacement logic live in create_pattern_steps_legend.js.
}

window.PatternCreator = PatternCreator;
