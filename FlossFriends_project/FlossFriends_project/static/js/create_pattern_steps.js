// ===== CUSTOM SELECT =====
document.querySelectorAll(".custom-select").forEach(select => {
    const selected = select.querySelector(".select-selected"); 
    const items = select.querySelector(".select-items"); 
    
    selected.onclick = () => { 
        items.style.display = items.style.display === "block" ? "none" : "block"; 
        select.classList.toggle("open"); 
    };

    items.querySelectorAll("div").forEach(option => { 
        option.onclick = () => { 
            selected.textContent = option.textContent; 
            items.style.display = "none"; 
            select.classList.remove("open"); 
            if (select.id === "paletteSelect") {
                if (patternCreator) {
                    patternCreator.updateColorsSliderRange();
                    patternCreator.updateColors();
                }
            }

        }; 
    }); 
});
document.getElementById("typeSelect")?.querySelectorAll(".select-items div")
.forEach(option => {
    option.addEventListener("click", () => {
        if (patternCreator) {
            patternCreator.updateFabricSize();
            patternCreator.updateLegendUnits(); 
            patternCreator.updateColors();
        }
    });
});

document.querySelectorAll("#step3 .select-items div").forEach(option => {
    option.addEventListener("click", () => {
        if (patternCreator) {
            patternCreator.updateLegendUnits();
        }
    });
});

// ===== PATTERN CREATOR =====
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
        } catch (e) {
            console.error("Ошибка загрузки канвы", e);
            this.canvasList = [];
        }
    }

    async fetchCanvasData() {
        try {
            const res = await fetch('/api/get-canvas/');
            if (!res.ok) throw new Error("Ошибка загрузки канвы");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    getCanvasCountPerCm() {
        if (!this.canvasList || this.canvasList.length === 0) return 5.5;

        const selectedName = this.getSelectedCanvasName();
        const canvas = this.canvasList.find(c => c.name === selectedName);

        return canvas ? parseFloat(canvas.count_per_cm) : 5.5;
    }



    getSelectedCanvasName() {
        const select = document.getElementById("typeSelect");
        const selectedDiv = select?.querySelector(".select-selected");
        if (!selectedDiv) return '';
        const selectedValue = selectedDiv.textContent.trim();

        const canvas = this.canvasList.find(c => c.name === selectedValue);
        return canvas ? canvas.name : '';
    }


    getSelectedPalette() {
        const select = document.getElementById("paletteSelect");
        const selectedDiv = select?.querySelector(".select-selected");
        if (!selectedDiv) return '';
        const items = select.querySelectorAll(".select-items div");
        for (let item of items) {
            if (item.textContent === selectedDiv.textContent) return item.dataset.value;
        }
        return '';
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

    async loadExistingPattern() {
        try {
            const parsed = JSON.parse(existingPattern.data);
            this.patternData.width = existingPattern.width;
            this.patternData.height = existingPattern.height;
            this.patternCells = parsed.cells || [];
            
            // 🔹 загружаем legend отдельно
            this.lastLegend = existingPattern.legend || [];

            // 🔹 устанавливаем селекты перед загрузкой данных по палитре
            this.setCustomSelectValue('#paletteSelect', existingPattern.palette);
            this.setCustomSelectValue('#typeSelect', existingPattern.canvas);

            this.calculateGrid();
            this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);
            this.updateLegendTable(this.lastLegend);
            this.updateFabricSize();

            await this.updateColorsSliderRange();
            if (this.colorsSlider) {
                const currentColors = Math.max(1, Math.min(this.lastLegend.length || 1, parseInt(this.colorsSlider.max)));
                this.colorsSlider.value = currentColors;
                this.colorsValue.textContent = currentColors;
            }

            if (this.sizeSlider) {
                const widthBasedValue = Math.min(this.sizeSlider.max, Math.max(1, Math.round(this.patternData.width)));
                this.sizeSlider.value = widthBasedValue;
            }

        } catch(e) {
            console.error("Ошибка загрузки паттерна", e);
        }
    }

    updatePatternSizeDebounced() {
        const sliderValue = parseInt(this.sizeSlider.value);
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
    }

    calculateGrid() {
        const canvas = this.patternCanvas;
        const patternWidth = this.patternData.width;
        const patternHeight = this.patternData.height;
        const cellSize = Math.floor(Math.min(canvas.width / patternWidth, canvas.height / patternHeight));

        this.currentCellSize = cellSize;
        this.currentOffsetX = Math.floor((canvas.width - cellSize * patternWidth) / 2);
        this.currentOffsetY = Math.floor((canvas.height - cellSize * patternHeight) / 2);
    }

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
    }

    drawPatternGrid(cellSize, offsetX = 0, offsetY = 0) {
        const ctx = this.patternCanvas.getContext('2d');

        // 1️⃣ Белый фон
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, this.patternCanvas.width, this.patternCanvas.height);


        // 3️⃣ Рисуем крестики сверху
        for (let y = 0; y < this.patternCells.length; y++) {
            for (let x = 0; x < this.patternCells[y].length; x++) {
                const { r, g, b } = this.patternCells[y][x];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.strokeRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
            }
        }
    }

    async initColorSettings() {
        if (!this.colorsSlider) return;
        await this.updateColorsSliderRange();
        this.colorsSlider.value = this.colorsSlider.max;
        this.updateColors();
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async fetchPaletteMaxColors() {
        const palette = this.getSelectedPalette();
        try {
            const res = await fetch(`/api/get-palette-max/?palette=${encodeURIComponent(palette)}`);
            if (!res.ok) throw new Error("Ошибка при получении палитры");
            const data = await res.json();
            return data.max_colors || 100;
        } catch (e) {
            console.error(e);
            return 100;
        }
    }
    updateFabricSize() {
        if (!this.patternCanvas) return;
        const countPerCm = this.getCanvasCountPerCm();

        const widthCm = Math.max(1, this.patternData.width / countPerCm).toFixed(1);
        const heightCm = Math.max(1, this.patternData.height / countPerCm).toFixed(1);

        const fabricSizeEl = document.getElementById('fabricSize');
        if (fabricSizeEl) fabricSizeEl.textContent = `${widthCm} x ${heightCm} см`;

        const crossesEl = document.getElementById('crossesSize');
        if (crossesEl) crossesEl.textContent = `${this.patternData.width} x ${this.patternData.height}`;
    }

    async updateColorsSliderRange() {
        const maxColors = await this.fetchPaletteMaxColors();
        if (this.colorsSlider) {
            this.colorsSlider.max = maxColors;
            if (parseInt(this.colorsSlider.value) > maxColors) this.colorsSlider.value = maxColors;
            this.colorsValue.textContent = this.colorsSlider.value;
        }
    }

    async updateColors() {
        if (!this.patternCanvas || !this.sourceImage || !this.colorsSlider) return;

        const maxColors = parseInt(this.colorsSlider.max);
        let colors = Math.min(parseInt(this.colorsSlider.value), maxColors);

        this.colorsSlider.value = colors;
        this.colorsValue.textContent = colors;

        // Отменяем предыдущий запрос, если он есть
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        const requestId = Date.now();
        this.lastRequestId = requestId;

        // Создаем маленький canvas для base64
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
                    width: this.patternData.width,
                    height: this.patternData.height,
                    colors: colors,
                    palette: this.getSelectedPalette(),
                    count_per_cm: this.getCanvasCountPerCm()
                }),
                signal: this.controller.signal
            });

            if (!res.ok) throw new Error("Ошибка сервера при генерации паттерна");

            const data = await res.json();
            if (this.lastRequestId !== requestId) return;

            // 🔹 Добавляем символы в patternCells
            const legendMap = {};
            (data.legend || []).forEach(l => { legendMap[l.code] = l.symbol; });

            this.patternCells = data.cells.map(row => row.map(cell => ({
                ...cell,
                symbol: legendMap[cell.code] || '?'
            })));

            // 🔹 Рисуем паттерн цветами
            this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);

            // 🔹 Обновляем количество реально использованных цветов
            if (this.colorsValueUsed) this.colorsValueUsed.textContent = data.colors_used;

            // 🔹 Обновляем таблицу легенды (шаг 3)
            this.updateLegendTable(data.legend || []);
            this.lastLegend = data.legend || [];

            // 🔹 Если сейчас шаг 3, рисуем символы поверх
            const step3Active = document.getElementById('step3')?.classList.contains('active');
            if (step3Active) this.drawPatternSymbols();

        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
        
    }
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
    }


// 🔹 Метод для обновления таблицы легенды
    updateLegendTable(legend) {
        const tbody = document.getElementById('legendTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const unit = this.getSelectedLengthUnit();

        legend.forEach(item => {
            const tr = document.createElement('tr');

            const length = this.convertLength(item.length_cm, unit);

            tr.innerHTML = `
                <td style="display:flex;justify-content:center;align-items:center;">
                    <div style="background: rgb(${item.r}, ${item.g}, ${item.b}); color: ${this.getContrastColor(item.r, item.g, item.b)};" class="symbol">
                        ${item.symbol}
                    </div>

                </td>

                <td>${item.code}</td>
                <td>${length}</td>

                <td>
                    <button class="change-btn">
                        <img src="/static/images/change-color.png" class="change-icon">
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }
    updateLegendUnits() {
        // просто перерисовываем таблицу с текущими данными
        this.updateLegendTable(this.lastLegend || []);
    }


    getContrastColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    }

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

                // 🔹 1. Рисуем цветной квадрат
                ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
                ctx.fillRect(
                    x * cellSize + offsetX,
                    y * cellSize + offsetY,
                    cellSize,
                    cellSize
                );

                // 🔹 2. Граница
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(
                    x * cellSize + offsetX,
                    y * cellSize + offsetY,
                    cellSize,
                    cellSize
                );

                // 🔹 3. Символ (чёрный или белый для контраста), только если не прозрачный
                if (cell.code !== null) {
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
}

// ===== INIT =====
let patternCreator = null;
document.addEventListener("DOMContentLoaded", () => {
    const imgElement = document.getElementById("sourceImage");
    if (imgElement?.src) patternCreator = new PatternCreator(imgElement.src);
    new PatternCreationSteps();
});

// ===== STEP CONTROLLER =====
class PatternCreationSteps {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;

        this.progressSteps = document.querySelectorAll('.progress-step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.saveButton = document.getElementById('saveBtn');
        this.cancelButton = document.getElementById('cancelBtn');
        this.savePatternModal = document.getElementById('savePatternModal');
        if (this.saveButton) this.saveButton.addEventListener('click', () => this.savePattern());
        if (this.cancelButton) this.cancelButton.addEventListener('click', () => this.closeModal());


        this.finishBtn.style.display = 'none';
        this.bindEvents();
        this.updateUI();
    }

    closeModal() {
        this.savePatternModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    bindEvents() {
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousStep());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextStep());
        if (this.finishBtn) this.finishBtn.addEventListener('click', () => this.finishCreation());
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateUI();
        }
        if (this.currentStep === 3) {
            patternCreator.drawPatternSymbols();
        }
    }

    previousStep() {
        if (this.currentStep === 1) {
            const sourceImg = document.getElementById("sourceImage");
            if (sourceImg?.src) sessionStorage.setItem("tempImage", sourceImg.src);
            if (existingPattern) {
                window.location.href = '/my_patterns/';
            } else {
                window.location.href = '/add_image_for_create/';
            }

            return;
        }

        if (this.currentStep === 3) {
            this.currentStep--;

            // 🔹 Возвращаем цветную схему (без символов)
            patternCreator.drawPatternGrid(
                patternCreator.currentCellSize,
                patternCreator.currentOffsetX,
                patternCreator.currentOffsetY
            );

            this.updateUI();
            return;
        }

        if (this.currentStep === 2) {
            this.currentStep--;

            // 🔹 полный сброс настроек шага 2
            this.resetStepTwo();

            this.updateUI();
            return;
        }
    }

    resetStepTwo() {
        if (!patternCreator) return;

        // 1️⃣ Сброс палитры
        const paletteSelect = document.getElementById("paletteSelect");
        if (paletteSelect) {
            const selectedDiv = paletteSelect.querySelector(".select-selected");
            const firstOption = paletteSelect.querySelector(".select-items div");
            if (selectedDiv && firstOption) selectedDiv.textContent = firstOption.textContent;
        }

        // 2️⃣ Сброс ползунков
        const sizeSlider = document.getElementById("sizeSlider");
        if (sizeSlider) {
            const midValue = Math.floor((parseInt(sizeSlider.min || 1) + parseInt(sizeSlider.max || 100)) / 2);
            sizeSlider.value = midValue;
        }

        const colorsSlider = document.getElementById("colorsSlider");
        if (colorsSlider) {
            const maxColors = parseInt(colorsSlider.max || 50);
            const midColors = Math.floor(maxColors / 2);
            colorsSlider.value = midColors;

            const colorsValue = document.getElementById("colorsValue");
            if (colorsValue) colorsValue.textContent = colorsSlider.value;
        }

        // 3️⃣ Обновляем паттерн сразу
        patternCreator.patternCells = [];
        patternCreator.drawPattern();
        patternCreator.updatePatternSizeDebounced();
        patternCreator.initColorSettings();
    }

    updateUI() {
        this.stepContents.forEach((content, index) => {
            content.classList.toggle('active', index + 1 === this.currentStep);
        });
        this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        this.finishBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
        this.prevBtn.innerHTML = this.currentStep === 1 ? '← К изображению' : 'Назад';

        this.progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        const minPercent = 5;   
        const maxPercent = 95; 
        const stepPercent = (maxPercent - minPercent) / (this.totalSteps - 1);
        const percent = minPercent + (this.currentStep - 1) * stepPercent;
        document.querySelector('.progress-bar').style.setProperty('--progress', percent + '%');
    }
    
    finishCreation() {
        this.savePatternModal.classList.add('active');
        document.body.classList.add('modal-open');
    }
    showError(message) {
        const box = document.getElementById("errorBox");
        box.textContent = message;
        box.style.display = "flex";

        setTimeout(() => {
            box.style.display = "none";
        }, 3000);
    }

    async savePattern() {
        const titleInput = document.getElementById("titlePattern");
        const title = titleInput.value.trim();

        if (!title) {
            this.showError("Введите название схемы");
            return;
        }
        let imageData = patternCreator.sourceImage.src;
        if (!imageData.includes("base64")) imageData = existingPattern?.image_original || imageData;

        const data = {
            title: title, // 🔥 ВАЖНО
            image: imageData,
            width: patternCreator.patternData.width,
            height: patternCreator.patternData.height,
            cells: patternCreator.patternCells,
            legend: patternCreator.lastLegend,
            palette: patternCreator.getSelectedPalette(),
            canvas: patternCreator.getSelectedCanvasName()
        };

        try {
            const url = existingPattern 
            ? `/api/pattern/${existingPattern.id}/update/`
            : `/api/save-pattern/`;

            const method = existingPattern ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });


            const result = await res.json();

            this.closeModal();
            document.querySelector('.progress-bar').style.setProperty('--progress', '100%');

            setTimeout(() => {
                window.location.href = `/pattern_view/?id=${result.id}`;
            }, 500);

        } catch (e) {
            console.error(e);
            this.showError("Ошибка сохранения");
        }
    }

}
