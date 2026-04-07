document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patternId = urlParams.get('id');
    if (!patternId) return console.error("ID паттерна не найден");

    const canvas = document.getElementById('patternCanvas');
    const ctx = canvas.getContext('2d');

    // Переменные для масштабирования и смещения
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const res = await fetch(`/api/pattern/${patternId}/`);
    if (!res.ok) return console.error("Не удалось загрузить паттерн");

    const data = await res.json();
    const patternCells = data.cells || [];
    const legend = data.legend || [];
    const width = data.width;
    const height = data.height;

    // Автоцентрирование схемы
    function centerPattern() {
        const canvasWrapper = canvas.parentElement;
        const wrapperWidth = canvasWrapper.clientWidth;
        const wrapperHeight = canvasWrapper.clientHeight;

        const cellSize = Math.floor(Math.min(wrapperWidth / width, wrapperHeight / height));
        scale = cellSize / 20; // если исходная клетка 20px
        offsetX = (canvasWrapper.clientWidth - width * cellSize) / 2;
        offsetY = (canvasWrapper.clientHeight - height * cellSize) / 2;

        canvas.width = canvasWrapper.clientWidth;
        canvas.height = canvasWrapper.clientHeight;
    }

    centerPattern();

    function getContrastColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    }

    function drawPattern() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = 20 * scale;
        ctx.font = `${cellSize * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = patternCells[y][x];
                ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`;
                ctx.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
                ctx.fillStyle = getContrastColor(cell.r, cell.g, cell.b);
                ctx.fillText(cell.symbol || '?', x * cellSize + offsetX + cellSize / 2, y * cellSize + offsetY + cellSize / 2);
            }
        }
    }

    drawPattern();

    // ===== Перетаскивание =====
    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
    });
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);
    canvas.addEventListener('mousemove', e => {
        if (isDragging) {
            offsetX = e.clientX - dragStartX;
            offsetY = e.clientY - dragStartY;
            drawPattern();
        }
    });

    // ===== Масштабирование колесом =====
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        scale *= delta;
        scale = Math.max(0.1, Math.min(scale, 10));
        drawPattern();
    });

    // ===== Кнопки управления =====
    document.getElementById('zoomInBtn').addEventListener('click', () => { scale *= 1.2; drawPattern(); });
    document.getElementById('zoomOutBtn').addEventListener('click', () => { scale /= 1.2; drawPattern(); });
    document.getElementById('resetViewBtn').addEventListener('click', () => { centerPattern(); drawPattern(); });

    // ===== Легенда =====
    const legendTableBody = document.getElementById('legendTableBody');

    function drawLegendUnits() {
        const unitSelect = document.querySelector("#step3 .custom-select .select-selected");
        const unit = unitSelect.textContent.includes("см") ? "cm" : "skeins";

        legendTableBody.innerHTML = '';

        legend.forEach(item => {
            let lengthText = '';
            if (unit === "cm") lengthText = item.length_cm.toFixed(1) + " см";
            else {
                const skeinLength = 8; // метров в мотке
                const skeins = Math.ceil(item.length_cm / 100 / skeinLength);
                lengthText = skeins + " моток";
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="display:flex;justify-content:center;align-items:center;">
                   <div style="background: rgb(${item.r}, ${item.g}, ${item.b}); color: ${getContrastColor(item.r, item.g, item.b)};" class="symbol">
                        ${item.symbol}
                    </div>
                </td>
                <td>${item.code}</td>
                <td>${lengthText}</td>
            `;
            legendTableBody.appendChild(tr);
        });
    }

    drawLegendUnits();

    // ===== custom-select =====
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
                drawLegendUnits();
            }; 
        }); 
    });

    // ===== Кнопка Выйти =====
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            console.log('Кнопка Выйти нажата');
            window.location.href = '/my_patterns/';
        });
    } else {
        console.log('Кнопка prevBtn не найдена');
    }
});
