// const THREADS = {
//     dmc: [
//         { code: '310', r: 0, g: 0, b: 0, skeinLength: 8 },
//         { code: '321', r: 208, g: 0, b: 48, skeinLength: 8 },
//         { code: '666', r: 227, g: 29, b: 66, skeinLength: 8 },
//         { code: '817', r: 179, g: 14, b: 46, skeinLength: 8 },
//         { code: '321', r: 208, g: 0, b: 48, skeinLength: 8 },
//         { code: '347', r: 255, g: 106, b: 106, skeinLength: 8 },
//         { code: '498', r: 163, g: 0, b: 35, skeinLength: 8 },
//         { code: '666', r: 227, g: 29, b: 66, skeinLength: 8 },
//         { code: '741', r: 255, g: 147, b: 41, skeinLength: 8 },
//         { code: '741', r: 255, g: 147, b: 41, skeinLength: 8 },
//         { code: '740', r: 255, g: 191, b: 87, skeinLength: 8 },
//         { code: '741', r: 255, g: 147, b: 41, skeinLength: 8 },
//         { code: '744', r: 255, g: 239, b: 175, skeinLength: 8 },
//         { code: '745', r: 255, g: 243, b: 197, skeinLength: 8 },
//         { code: '746', r: 227, g: 227, b: 198, skeinLength: 8 },
//         { code: '747', r: 206, g: 206, b: 206, skeinLength: 8 },
//         { code: '762', r: 227, g: 227, b: 227, skeinLength: 8 },
//         { code: '778', r: 199, g: 230, b: 223, skeinLength: 8 },
//         { code: '798', r: 0, g: 73, b: 163, skeinLength: 8 },
//         { code: '799', r: 0, g: 104, b: 183, skeinLength: 8 },
//         { code: '820', r: 14, g: 54, b: 92, skeinLength: 8 },
//         { code: '823', r: 42, g: 98, b: 175, skeinLength: 8 },
//         { code: '825', r: 49, g: 112, b: 180, skeinLength: 8 },
//         { code: '826', r: 63, g: 137, b: 186, skeinLength: 8 },
//         { code: '832', r: 65, g: 91, b: 62, skeinLength: 8 },
//         { code: '841', r: 110, g: 65, b: 44, skeinLength: 8 },
//         { code: '844', r: 99, g: 140, b: 176, skeinLength: 8 },
//         { code: '869', r: 157, g: 82, b: 35, skeinLength: 8 },
//         { code: '900', r: 201, g: 56, b: 44, skeinLength: 8 },
//         { code: '906', r: 158, g: 207, b: 99, skeinLength: 8 },
//         { code: '907', r: 198, g: 233, b: 163, skeinLength: 8 },
//         { code: '909', r: 194, g: 225, b: 179, skeinLength: 8 },
//         { code: '912', r: 140, g: 192, b: 182, skeinLength: 8 },
//         { code: '915', r: 89, g: 139, b: 133, skeinLength: 8 },
//         { code: '917', r: 114, g: 157, b: 140, skeinLength: 8 },
//         { code: '918', r: 158, g: 193, b: 177, skeinLength: 8 },
//         { code: '934', r: 109, g: 162, b: 73, skeinLength: 8 },
//         { code: '935', r: 155, g: 198, b: 89, skeinLength: 8 },
//         { code: '937', r: 196, g: 227, b: 96, skeinLength: 8 },
//         { code: '938', r: 228, g: 235, b: 91, skeinLength: 8 },
//         { code: '939', r: 199, g: 205, b: 62, skeinLength: 8 },
//         { code: '943', r: 241, g: 226, b: 148, skeinLength: 8 },
//         { code: '945', r: 234, g: 233, b: 203, skeinLength: 8 },
//         { code: '948', r: 255, g: 252, b: 212, skeinLength: 8 },
//         { code: '970', r: 255, g: 241, b: 0, skeinLength: 8 },
//         { code: '971', r: 255, g: 247, b: 99, skeinLength: 8 },
//         { code: '972', r: 255, g: 251, b: 148, skeinLength: 8 },
//         { code: '973', r: 255, g: 255, b: 0, skeinLength: 8 },
//         { code: '975', r: 255, g: 255, b: 122, skeinLength: 8 },
//         { code: '996', r: 48, g: 194, b: 236, skeinLength: 8 },
//         { code: '997', r: 102, g: 191, b: 224, skeinLength: 8 },
//         { code: '998', r: 127, g: 221, b: 242, skeinLength: 8 },
//         { code: '999', r: 0, g: 160, b: 176, skeinLength: 8 },
//     ],
//     anchor: [
//         { code: '001', r: 0, g: 0, b: 0, skeinLength: 8 },
//         { code: '002', r: 255, g: 0, b: 0, skeinLength: 8 },
//         { code: '003', r: 255, g: 128, b: 0, skeinLength: 8 },
//         { code: '004', r: 255, g: 255, b: 0, skeinLength: 8 },
//         { code: '005', r: 0, g: 255, b: 0, skeinLength: 8 },
//         { code: '006', r: 0, g: 128, b: 0, skeinLength: 8 },
//         { code: '007', r: 0, g: 255, b: 255, skeinLength: 8 },
//         { code: '008', r: 0, g: 128, b: 128, skeinLength: 8 },
//         { code: '009', r: 0, g: 0, b: 255, skeinLength: 8 },
//         { code: '010', r: 0, g: 0, b: 128, skeinLength: 8 },
//         { code: '011', r: 255, g: 0, b: 255, skeinLength: 8 },
//         { code: '012', r: 128, g: 0, b: 128, skeinLength: 8 },
//         { code: '013', r: 255, g: 192, b: 203, skeinLength: 8 },
//         { code: '014', r: 255, g: 182, b: 193, skeinLength: 8 },
//         { code: '015', r: 128, g: 0, b: 0, skeinLength: 8 },
//         { code: '016', r: 128, g: 128, b: 0, skeinLength: 8 },
//         { code: '017', r: 128, g: 128, b: 128, skeinLength: 8 },
//         { code: '018', r: 192, g: 192, b: 192, skeinLength: 8 },
//         { code: '019', r: 0, g: 64, b: 64, skeinLength: 8 },
//         { code: '020', r: 0, g: 128, b: 255, skeinLength: 8 },
//         { code: '021', r: 0, g: 255, b: 128, skeinLength: 8 },
//         { code: '022', r: 0, g: 255, b: 255, skeinLength: 8 },
//         { code: '023', r: 255, g: 128, b: 128, skeinLength: 8 },
//         { code: '024', r: 128, g: 0, b: 128, skeinLength: 8 },
//         { code: '025', r: 128, g: 0, b: 255, skeinLength: 8 },
//         { code: '026', r: 192, g: 0, b: 192, skeinLength: 8 },
//         { code: '027', r: 255, g: 0, b: 255, skeinLength: 8 },
//         { code: '028', r: 255, g: 192, b: 203, skeinLength: 8 },
//         { code: '029', r: 255, g: 182, b: 193, skeinLength: 8 },
//         { code: '030', r: 128, g: 0, b: 0, skeinLength: 8 },
//         { code: '031', r: 128, g: 128, b: 0, skeinLength: 8 },
//         { code: '032', r: 128, g: 128, b: 128, skeinLength: 8 },
//         { code: '033', r: 192, g: 192, b: 192, skeinLength: 8 },
//         { code: '034', r: 0, g: 64, b: 64, skeinLength: 8 },
//         { code: '035', r: 0, g: 128, b: 255, skeinLength: 8 },
//         { code: '036', r: 0, g: 255, b: 128, skeinLength: 8 },
//         { code: '037', r: 0, g: 255, b: 255, skeinLength: 8 },
//         { code: '038', r: 255, g: 128, b: 128, skeinLength: 8 },
//         { code: '039', r: 128, g: 0, b: 128, skeinLength: 8 },
//         { code: '040', r: 128, g: 0, b: 255, skeinLength: 8 },
//         { code: '041', r: 192, g: 0, b: 192, skeinLength: 8 },
//         { code: '042', r: 255, g: 0, b: 255, skeinLength: 8 },
//         { code: '043', r: 255, g: 192, b: 203, skeinLength: 8 },
//         { code: '044', r: 255, g: 182, b: 193, skeinLength: 8 },
//         { code: '045', r: 128, g: 0, b: 0, skeinLength: 8 }
//     ]
// };

// class PatternCreationSteps {
    
//     constructor() {
//         this.currentStep = 1;
//         this.totalSteps = 3;

//         this.patternCanvas = document.getElementById('patternCanvas');
//         this.sourceImage = document.getElementById('sourceImage');

//         this.patternData = {
//             width: 50,
//             height: 50,
//             colors: 10,
//             palette: 'dmc',
//             calculationUnit: 'meters',
//             legend: []
//         };

//         this.initializeElements();
//         this.bindEvents();

//         // !!! Сначала проверяем, что элементы DOM готовы, потом апдейтим прогресс
//         this.updateProgress();
//         this.updateNavigation();

//         this.sourceImage.addEventListener('load', () => {
//             this.drawPattern();
//             this.generatePatternCells();
//         });

//         // Если изображение уже загружено до скрипта
//         if (this.sourceImage.complete) {
//             this.drawPattern();
//             this.generatePatternCells();
//         }
//     }



//     initializeElements() {
//         this.originalCells = []; // хранит исходные цвета каждого крестика
//         this.progressSteps = document.querySelectorAll('.progress-step');
//         this.stepContents = document.querySelectorAll('.step-content');
//         this.prevBtn = document.getElementById('prevBtn');
//         this.nextBtn = document.getElementById('nextBtn');
//         this.finishBtn = document.getElementById('finishBtn');
//         this.finishBtn.style.display = 'none';
        
//         this.previewCrosses = document.getElementById('previewCrosses');
//         this.sizeSlider = document.getElementById('sizeSlider');

//         this.colorsSlider = document.getElementById('colorsSlider');
//         this.colorsValue = document.getElementById('colorsValue');
//         this.paletteSelect = document.getElementById('paletteSelect');

//         this.calculationSelect = document.getElementById('calculationSelect');
//         this.totalThread = document.getElementById('totalThread');
//         this.legendTableBody = document.getElementById('legendTableBody');

//         this.patternCanvas = document.getElementById('patternCanvas');
//         this.patternOverlay = document.getElementById('patternOverlay');
//         this.updateColorsSliderMax();
 
//     }

//     bindEvents() {
//         this.prevBtn.addEventListener('click', () => this.previousStep());
//         this.nextBtn.addEventListener('click', () => this.nextStep());
//         this.finishBtn.addEventListener('click', () => this.finishCreation());
//         this.sizeSlider.addEventListener('input', () => this.updatePatternSize());
//         this.colorsSlider.addEventListener('input', () => this.updatePatternColors());
//         this.paletteSelect.addEventListener('change', () => {
//         this.updateColorsSliderMax(); // обновляем максимум ползунка
//         this.updatePatternColors();   // перерисовываем схему с новой палитрой
//             if (this.currentStep === 3) this.generateLegend(); // обновляем легенду
//         });

//         // Если пользователь меняет единицу измерения (метры/мотки) на третьем шаге
//         this.calculationSelect.addEventListener('change', () => {
//             if (this.currentStep === 3) this.generateLegend();
//             });
//     }


//     nextStep() {
//         if (this.currentStep < this.totalSteps) {                       
//             this.currentStep++;
//             this.updateProgress();
//             this.updateNavigation();
//         }
//     }

//     previousStep() {
//         if (this.currentStep === 1) {
//             window.location.href = '/add_image_for_create/';
//         } else {
//             this.currentStep--;
//             this.updateProgress();
//             this.updateNavigation();
//         }
//     }
//     updateColorsSliderMax() {
//         const palette = this.paletteSelect.value;
//         let maxColors = 50; // default

//         // Можно задать разные максимумы для палитр
//         if (palette === 'dmc') maxColors = 60;
//         else if (palette === 'anchor') maxColors = 50;

//         this.colorsSlider.max = maxColors;

//         // Если текущее значение больше нового максимума — обрезаем
//         if (parseInt(this.colorsSlider.value) > maxColors) {
//             this.colorsSlider.value = maxColors;
//         }

//         this.colorsValue.textContent = this.colorsSlider.value;
//     }


//     // Обновление цветов с ползунка
//     updatePatternColors() {
//         const colorsCount = parseInt(this.colorsSlider.value);
//         this.colorsValue.textContent = colorsCount;

//         // Снижаем количество цветов в схеме
//         this.reduceColors(colorsCount);

//         // Перерисовываем сетку
//         this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);

//         // Если третий шаг активен, обновляем легенду
//         if (this.currentStep === 3) this.generateLegend();
//     }


//     updateProgress() {
//         this.progressSteps.forEach((step, index) => {
//             const stepNumber = index + 1;
//             step.classList.toggle('active', stepNumber === this.currentStep);
//             step.classList.toggle('completed', stepNumber < this.currentStep);
//         });

//         // считаем прогресс между шагами
//         let percent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;

//         // если первый шаг — минимальная заливка
//         if (this.currentStep === 1) percent = 5; // можно подобрать визуально
//         document.querySelector('.progress-bar').style.setProperty('--progress', percent + '%');

//         this.stepContents.forEach((content) => {
//             const stepNumber = parseInt(content.id.replace('step', ''));
//             content.classList.toggle('active', stepNumber === this.currentStep);
//         });

//         if (this.currentStep === 3) {
//             this.generateLegend();
//         }
//     }



//     updateNavigation() {
//         this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
//         this.finishBtn.style.display = this.currentStep === 3 ? 'block' : 'none';
//         this.prevBtn.innerHTML = this.currentStep === 1 ? '<span class="btn-icon">←</span> К изображению' : 'Назад';

//     }


//     finishCreation(){
//         console.log('Создана схема:', this.patternData);
//         alert('Схема успешно создана! Переход к просмотру...');
//         window.location.href='/my_patterns/';
//     }

//     drawPattern() {
//         const canvas = this.patternCanvas;
//         const ctx = canvas.getContext('2d');
//         const img = this.sourceImage;

//         const wrapper = canvas.parentElement;
//         const wrapperWidth = wrapper.clientWidth;
//         const wrapperHeight = wrapper.clientHeight;

//         // масштабируем изображение под контейнер, сохраняя пропорции
//         const scale = Math.min(wrapperWidth / img.width, wrapperHeight / img.height);

//         const canvasWidth = Math.floor(img.width * scale);
//         const canvasHeight = Math.floor(img.height * scale);

//         canvas.width = canvasWidth;
//         canvas.height = canvasHeight;

//         // рисуем исходное изображение на canvas
//         ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

//         // сохраняем исходные данные в памяти
//         this.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     }

//     generatePatternCells() {
//         const canvas = this.patternCanvas;

//         const patternWidth = this.patternData.width;
//         const patternHeight = this.patternData.height;

//         const cellSizeX = canvas.width / patternWidth;
//         const cellSizeY = canvas.height / patternHeight;
//         const cellSize = Math.floor(Math.min(cellSizeX, cellSizeY));

//         const gridWidth = cellSize * patternWidth;
//         const gridHeight = cellSize * patternHeight;

//         const offsetX = Math.floor((canvas.width - gridWidth) / 2);
//         const offsetY = Math.floor((canvas.height - gridHeight) / 2);

//         const imageData = this.originalImageData.data;

//         this.patternCells = [];
//         this.originalCells = [];

//         for (let y = 0; y < patternHeight; y++) {
//             const row = [];
//             const originalRow = [];
//             for (let x = 0; x < patternWidth; x++) {
//                 let r = 0, g = 0, b = 0;
//                 let count = 0;

//                 for (let py = 0; py < cellSize; py++) {
//                     for (let px = 0; px < cellSize; px++) {
//                         const pixelX = Math.floor(x * cellSize + px + offsetX);
//                         const pixelY = Math.floor(y * cellSize + py + offsetY);
//                         if (pixelX >= canvas.width || pixelY >= canvas.height) continue;
//                         const idx = (pixelY * canvas.width + pixelX) * 4;
//                         r += imageData[idx];
//                         g += imageData[idx + 1];
//                         b += imageData[idx + 2];
//                         count++;
//                     }
//                 }

//                 r = Math.round(r / count);
//                 g = Math.round(g / count);
//                 b = Math.round(b / count);

//                 row.push({ r, g, b });
//                 originalRow.push({ r, g, b }); // сохраняем исходный цвет
//             }
//             this.patternCells.push(row);
//             this.originalCells.push(originalRow);
//         }

//         this.drawPatternGrid(cellSize, offsetX, offsetY);

//         this.currentCellSize = cellSize;
//         this.currentOffsetX = offsetX;
//         this.currentOffsetY = offsetY;
//     }



//     drawPatternGrid(cellSize, offsetX = 0, offsetY = 0) {
//         const canvas = this.patternCanvas;
//         const ctx = canvas.getContext('2d');

//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         for (let y = 0; y < this.patternCells.length; y++) {
//             for (let x = 0; x < this.patternCells[y].length; x++) {
//                 const { r, g, b } = this.patternCells[y][x];
//                 ctx.fillStyle = `rgb(${r},${g},${b})`;
//                 ctx.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);

//                 ctx.strokeStyle = 'rgba(0,0,0,0.1)';
//                 ctx.strokeRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
//             }
//         }
//         this.currentCellSize = cellSize;
//         this.currentOffsetX = offsetX;
//         this.currentOffsetY = offsetY;

//     }



//     updatePatternSize() {
//         const sliderValue = parseInt(this.sizeSlider.value); // 1..100, как у тебя
//         const maxCrosses = 100; // макс число крестиков по большей стороне

//         // получаем размеры canvas после масштабирования изображения
//         const imgWidth = this.patternCanvas.width;
//         const imgHeight = this.patternCanvas.height;

//         // выбираем, какая сторона больше
//         if (imgWidth >= imgHeight) {
//             this.patternData.width = Math.max(1, Math.floor((sliderValue / this.sizeSlider.max) * maxCrosses));
//             this.patternData.height = Math.max(1, Math.floor(this.patternData.width * (imgHeight / imgWidth)));
//         } else {
//             this.patternData.height = Math.max(1, Math.floor((sliderValue / this.sizeSlider.max) * maxCrosses));
//             this.patternData.width = Math.max(1, Math.floor(this.patternData.height * (imgWidth / imgHeight)));
//         }

//         // обновляем количество крестиков на экране
//         const totalCrosses = this.patternData.width * this.patternData.height;
//         this.previewCrosses.textContent = totalCrosses;

//         // перерисовываем сетку
//         this.generatePatternCells();
//     }

//     reduceColors(maxColors) {
//         if (!maxColors || maxColors < 1) return;

//         this.patternCells = this.originalCells.map(row =>
//             row.map(({r,g,b}) => {
//                 const step = 255 / (maxColors - 1);
//                 const newR = Math.round(r / step) * step;
//                 const newG = Math.round(g / step) * step;
//                 const newB = Math.round(b / step) * step;
//                 return { r: newR, g: newG, b: newB };
//             })
//         );
//     }
//     generateLegend() {
//         const legendBody = this.legendTableBody;
//         legendBody.innerHTML = '';

//         if (!this.patternCells || this.patternCells.length === 0) return;

//         const palette = this.paletteSelect.value; // 'dmc' или 'anchor'
//         const threads = THREADS[palette];

//         const colorMap = {}; // для уникальных цветов

//         let symbolCounter = 65; // A-Z

//         // Подсчет крестиков и выбор ближайшей нити
//         for (let y = 0; y < this.patternCells.length; y++) {
//             for (let x = 0; x < this.patternCells[y].length; x++) {
//                 const { r, g, b } = this.patternCells[y][x];
//                 const colorKey = `${r},${g},${b}`;

//                 if (!colorMap[colorKey]) {
//                     // ищем ближайшую нить по RGB
//                     let nearestThread = threads[0];
//                     let minDist = Infinity;
//                     for (const t of threads) {
//                         const dist = Math.sqrt((r - t.r)**2 + (g - t.g)**2 + (b - t.b)**2);
//                         if (dist < minDist) {
//                             minDist = dist;
//                             nearestThread = t;
//                         }
//                     }

//                     // присваиваем символ
//                     let symbol = String.fromCharCode(symbolCounter);
//                     if (symbolCounter > 90) symbol = 'A' + String.fromCharCode(symbolCounter - 91);
//                     symbolCounter++;

//                     colorMap[colorKey] = {
//                         symbol,
//                         color: `rgb(${r},${g},${b})`,
//                         threadCode: nearestThread.code,
//                         skeinLength: nearestThread.skeinLength,
//                         count: 0 // количество крестиков для подсчета длины
//                     };
//                 }

//                 colorMap[colorKey].count++;
//             }
//         }

//         // Создаем строки таблицы
//         Object.values(colorMap).forEach(item => {
//             const row = document.createElement('tr');

//             // рассчитываем длину нитки
//             const crossSizeMeters = 0.5; // допустим, 1 крестик = 0.5 метра (можно изменить)
//             let totalLengthMeters = item.count * crossSizeMeters;
//             let lengthDisplay = totalLengthMeters;

//             if (this.calculationSelect.value === 'skeins') {
//                 lengthDisplay = (totalLengthMeters / item.skeinLength).toFixed(2) + ' мот';
//             } else {
//                 lengthDisplay = totalLengthMeters.toFixed(2) + ' м';
//             }

//             // строка таблицы
//             row.innerHTML = `
//                 <td style="text-align:center;">
//                     <div style="width:20px; height:20px; background:${item.color}; display:flex; justify-content:center; align-items:center; color:#fff; font-weight:bold; border:1px solid #000;">
//                         ${item.symbol}
//                     </div>
//                 </td>
//                 <td>${item.threadCode}</td>
//                 <td>${lengthDisplay}</td>
//                 <td></td>
//             `;

//             legendBody.appendChild(row);
//         });
//     }

// }
// document.addEventListener('DOMContentLoaded',()=>{ new PatternCreationSteps(); });
document.querySelectorAll(".custom-select").forEach(select => {

    const originalSelect = select.querySelector("select"); // реальный <select>
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

            // Ключевое: меняем реальное значение select
            originalSelect.value = option.dataset.value;

            // Если это paletteSelect, вызываем функции обновления
            if (originalSelect.id === 'paletteSelect') {
                const event = new Event('change');
                originalSelect.dispatchEvent(event);
            }
        };
    });
});
;


class PatternCreationSteps {

    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;

        // Элементы навигации
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.finishBtn.style.display = 'none';

        // Другие элементы управления (можно оставить для шага 3)
        this.colorsSlider = document.getElementById('colorsSlider');
        this.colorsValue = document.getElementById('colorsValue');
        this.paletteSelect = document.getElementById('paletteSelect');
        this.calculationSelect = document.getElementById('calculationSelect');
        this.sizeSlider = document.getElementById('sizeSlider');
        

        this.bindEvents();
        this.updateUI();

    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.finishBtn.addEventListener('click', () => this.finishCreation());

        this.colorsSlider?.addEventListener('input', () => {
            this.colorsValue.textContent = this.colorsSlider.value;
        });

        this.paletteSelect?.addEventListener('change', () => {
            // Обновление, если нужно
        });

        this.calculationSelect?.addEventListener('change', () => {
            // Обновление, если нужно
        });
        this.sizeSlider?.addEventListener('input', () => this.updatePreviewCrosses());
        this.updatePreviewCrosses(); // сразу при загрузке
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateUI();
        }
    }

    previousStep() {
        if (this.currentStep === 1) {
            window.location.href = '/add_image_for_create/';
        } else {
            this.currentStep--;
            this.updateUI();
        }
    }

    updateUI() {
        this.stepContents.forEach((content, index) => {
            content.classList.toggle('active', index + 1 === this.currentStep);
        });

        // Обновление кнопок
        this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        this.finishBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
        this.prevBtn.innerHTML = this.currentStep === 1 ? '← К изображению' : 'Назад';
        
        // Обновление прогресс-бар
        this.progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        // Линия прогресса
        const minPercent = 5;   // прогресс на шаге 1
        const maxPercent = 95;  // прогресс на шаге последнем
        const stepPercent = (maxPercent - minPercent) / (this.totalSteps - 1);
        const percent = minPercent + (this.currentStep - 1) * stepPercent;

        document.querySelector('.progress-bar').style.setProperty('--progress', percent + '%');
    }
    finishCreation() {
        document.querySelector('.progress-bar').style.setProperty('--progress', '100%');

        setTimeout(() => {
            alert('Процесс завершен!');
            window.location.href = '/my_patterns/';
        }, 500);
    }

    updatePreviewCrosses() {
        if (!this.sizeSlider || !this.previewCrosses) return;
        const maxCrosses = 100;
        const value = parseInt(this.sizeSlider.value);
        this.previewCrosses.textContent = Math.floor((value / this.sizeSlider.max) * maxCrosses);
    }


}

document.addEventListener('DOMContentLoaded', () => {
    new PatternCreationSteps();
});


