class PatternCreationSteps {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.patternData = {
            height: 80,
            width: 60,
            colors: 24,
            palette: 'dmc',
            calculationUnit: 'meters',
            legend: []
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateProgress();
        this.updateNavigation();
        this.generateLegendData();
    }
    
    initializeElements() {
        this.progressSteps = document.querySelectorAll('.progress-step');
        
        this.stepContents = document.querySelectorAll('.step-content');
        
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.finishBtn = document.getElementById('finishBtn');
        
        this.heightInput = document.getElementById('heightInput');
        this.widthInput = document.getElementById('widthInput');
        this.previewCrosses = document.getElementById('previewCrosses');
        
        this.colorsSlider = document.getElementById('colorsSlider');
        this.colorsValue = document.getElementById('colorsValue');
        this.paletteSelect = document.getElementById('paletteSelect');
        this.colorsGrid = document.getElementById('colorsGrid');
        
        this.calculationSelect = document.getElementById('calculationSelect');
        this.totalThread = document.getElementById('totalThread');
        this.legendTableBody = document.getElementById('legendTableBody');
        
        this.patternImage = document.getElementById('patternImage');
        this.initializeZoomControls();
    }
    
    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.finishBtn.addEventListener('click', () => this.finishCreation());
        
        this.heightInput.addEventListener('input', () => this.updateDimensions());
        this.widthInput.addEventListener('input', () => this.updateDimensions());
        
        this.colorsSlider.addEventListener('input', () => this.updateColors());
        this.paletteSelect.addEventListener('change', () => this.updatePalette());
        
        this.calculationSelect.addEventListener('change', () => this.updateCalculation());
    }
    
    initializeZoomControls() {
        let currentZoom = 1;
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const zoomLevel = document.getElementById('zoomLevel');
        
        const updateZoom = () => {
            this.patternImage.style.transform = `scale(${currentZoom})`;
            zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
        };
        
        zoomInBtn.addEventListener('click', () => {
            if (currentZoom < 3) {
                currentZoom += 0.1;
                updateZoom();
            }
        });
        
        zoomOutBtn.addEventListener('click', () => {
            if (currentZoom > 0.5) {
                currentZoom -= 0.1;
                updateZoom();
            }
        });
        
        resetZoomBtn.addEventListener('click', () => {
            currentZoom = 1;
            updateZoom();
        });
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            if (!this.validateCurrentStep()) return;
            
            this.currentStep++;
            this.updateProgress();
            this.updateNavigation();
        }
    }
    
    previousStep() {
        if (this.currentStep === 1) {
            window.location.href = '/add_image_for_create/'; 
        } else {
            this.currentStep--;
            this.updateProgress();
            this.updateNavigation();
        }
    }
    
    updateProgress() {
        this.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber === this.currentStep);
            step.classList.toggle('completed', stepNumber < this.currentStep);
        });
        
        this.stepContents.forEach((content) => {
            const stepNumber = parseInt(content.id.replace('step', ''));
            content.classList.toggle('active', stepNumber === this.currentStep);
        });
        this.updateStepData();
    }
    
    updateNavigation() {
        this.prevBtn.style.display = 'block';
        
        this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        
        this.finishBtn.style.display = this.currentStep === this.totalSteps? 'block' : 'none';
        
        if (this.currentStep === 1) {
            this.prevBtn.innerHTML = '<span class="btn-icon">←</span> К изображению';
        } else {
            this.prevBtn.innerHTML = 'Назад';
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const height = parseInt(this.heightInput.value);
                const width = parseInt(this.widthInput.value);
                
                if (height < 10 || height > 500 || width < 10 || width > 500) {
                    alert('Размеры должны быть от 10 до 500 крестиков');
                    return false;
                }
                break;
                
            case 2: 
                if (this.patternData.colors < 1) {
                    alert('Выберите количество цветов');
                    return false;
                }
                break;
        }
        return true;
    }
    
    updateStepData() {
        switch (this.currentStep) {
            case 1:
                this.updateDimensions();
                break;
            case 3:
                this.updateLegend();
                break;
        }
    }
    
    updateDimensions() {
        const height = parseInt(this.heightInput.value) || 0;
        const width = parseInt(this.widthInput.value) || 0;
        const totalCrosses = height * width;
        
        this.patternData.height = height;
        this.patternData.width = width;
        
        this.previewCrosses.textContent = totalCrosses.toLocaleString();
    }
    
    updateColors() {
        const colors = parseInt(this.colorsSlider.value);
        this.patternData.colors = colors;
        this.colorsValue.textContent = colors;
    }
    
    generateColor(index, total) {
        const hue = (index * 360) / total;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    updateLegend() {
        this.generateLegendData();
        this.renderLegendTable();
        this.calculateTotalThread();
    }
    
    generateLegendData() {
        this.patternData.legend = [];
        const symbols = ['■', '●', '▲', '★', '♦', '♠', '♥', '♣', '○', '□', '◇', '☆'];
        const dmcCodes = ['310', '666', '550', '552', '553', '554', '740', '741', '742', '743'];
        
        for (let i = 0; i < this.patternData.colors; i++) {
            const crossCount = Math.floor(Math.random() * 200) + 50;
            const threadLength = (crossCount * 0.036).toFixed(2);
            
            this.patternData.legend.push({
                color: this.generateColor(i, this.patternData.colors),
                symbol: symbols[i % symbols.length],
                code: `DMC ${dmcCodes[i % dmcCodes.length]}`,
                crossCount: crossCount,
                threadLength: parseFloat(threadLength)
            });
        }
    }
    
    renderLegendTable() {
        this.legendTableBody.innerHTML = '';
        
        this.patternData.legend.forEach((item, index) => {
            const row = document.createElement('tr');
            const threadLength = this.formatThreadLength(item.threadLength);
            
            row.innerHTML = `
                <td class="color-cell">
                    <div class="legend-color-swatch" style="background-color: ${item.color}"></div>
                </td>
                <td class="symbol-cell">${item.symbol}</td>
                <td class="code-cell">${item.code}</td>
                <td class="thread-length">${threadLength}</td>
                <td class="actions-cell">
                    <button class="replace-btn" data-index="${index}">
                        Заменить
                    </button>
                </td>
            `;
            
            this.legendTableBody.appendChild(row);
        });
        
        this.addReplaceButtonHandlers();
    }
    
    addReplaceButtonHandlers() {
        const replaceButtons = this.legendTableBody.querySelectorAll('.replace-btn');
        replaceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.replaceSingleColor(index);
            });
        });
    }
    
    replaceSingleColor(index) {
        // alert(`Замена цвета ${index + 1} из инвентаря...`);
    }
    
    openColorReplacement() {
        // alert('Открывается выбор цветов из инвентаря...');
    }
    
    calculateTotalThread() {
        const totalMeters = this.patternData.legend.reduce((sum, item) => sum + item.threadLength, 0);
        
        if (this.patternData.calculationUnit === 'skeins') {
            const skeins = (totalMeters / 8).toFixed(1);
            this.totalThread.textContent = `${skeins} мотков`;
        } else {
            this.totalThread.textContent = `${totalMeters.toFixed(1)} м`;
        }
    }
    
    formatThreadLength(length) {
        if (this.patternData.calculationUnit === 'skeins') {
            return `${(length / 8).toFixed(1)} мот.`;
        } else {
            return `${length.toFixed(1)} м`;
        }
    }
    
    updateCalculation() {
        this.patternData.calculationUnit = this.calculationSelect.value;
        this.updateLegend();
    }
    
    finishCreation() {
        console.log('Создана схема:', this.patternData);
        alert('Схема успешно создана! Переход к просмотру...');
        window.location.href = '/my_patterns/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PatternCreationSteps();
});