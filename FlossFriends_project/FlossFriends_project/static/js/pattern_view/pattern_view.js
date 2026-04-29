window.patternViewApp = {
    mode: 'drag',
    setMode(nextMode) {
        this.mode = nextMode || 'drag';
    },
    setUnit() {},
    setCanvasCountPerCm() {},
    zoomIn() {},
    zoomOut() {},
    resetView() {},
    navigateBack() {},
};

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patternId = urlParams.get('id');
    if (!patternId) return console.error("ID паттерна не найден");

    const canvas = document.getElementById('patternCanvas');
    const ctx = canvas.getContext('2d');

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let isMarking = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentCellSize = 1;

    const res = await fetch(`/api/pattern/${patternId}/`);
    if (!res.ok) return console.error("Не удалось загрузить паттерн");

    const data = await res.json();
    const patternCells = data.cells || [];
    const legend = data.legend || [];
    let inventoryThreads = [];
    const palette = data.palette || 'DMC';
    const width = data.width;
    const height = data.height;

    const marginCells = 10;
    const newWidth = width + 2 * marginCells;
    const newHeight = height + 2 * marginCells;
    const newCells = Array.from(
        { length: newHeight },
        () => Array.from({ length: newWidth }, () => ({ r: 255, g: 255, b: 255, code: null, symbol: null }))
    );
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            newCells[y + marginCells][x + marginCells] = patternCells[y][x];
        }
    }

    const cells = newCells;
    const patternWidth = newWidth;
    const patternHeight = newHeight;

    const storageKey = `completed_${patternId}`;
    let completed = JSON.parse(localStorage.getItem(storageKey)) || Array.from({ length: patternHeight }, () => Array(patternWidth).fill(false));

    let currentRealWidth = data.real_width_cm;
    let currentRealHeight = data.real_height_cm;
    const originalRealWidth = data.real_width_cm;
    let currentUnit = 'cm';

    legend.forEach(item => {
        item.original_length_cm = item.length_cm;
    });

    function getPaletteFromCode(code, fallbackPalette = palette) {
        if (!code) return fallbackPalette;
        const codeText = String(code).trim();
        if (!codeText.includes('-')) return fallbackPalette;
        return codeText.split('-', 2)[0] || fallbackPalette;
    }

    function getCodeWithoutPalette(code) {
        if (!code) return '';
        const codeText = String(code).trim();
        return codeText.includes('-') ? codeText.split('-', 2)[1] || '' : codeText;
    }

    function getInventoryThreadForLegendItem(item) {
        const itemPalette = item?.palette || getPaletteFromCode(item?.code, palette);
        const itemCode = getCodeWithoutPalette(item?.code);
        return inventoryThreads.find(thread =>
            String(thread.palette || '').trim().toLowerCase() === String(itemPalette || '').trim().toLowerCase() &&
            String(thread.code || '').trim().toLowerCase() === String(itemCode || '').trim().toLowerCase()
        ) || null;
    }

    function formatLegendCode(item) {
        const code = item?.code;
        if (!code) return '';
        const codeText = String(code).trim();
        if (codeText.includes('-')) return codeText;
        const itemPalette = item?.palette || palette;
        return `${itemPalette}-${codeText}`;
    }

    async function loadInventoryThreads() {
        try {
            const inventoryRes = await fetch(`/api/inventory-threads/?current_pattern_id=${encodeURIComponent(patternId)}`);
            if (!inventoryRes.ok) throw new Error('Inventory fetch failed');
            const inventoryData = await inventoryRes.json();
            inventoryThreads = Array.isArray(inventoryData.threads) ? inventoryData.threads : [];
        } catch (error) {
            console.error(error);
            inventoryThreads = [];
        }
    }

    await loadInventoryThreads();

    const infoSizeCm = document.getElementById('infoSizeCm');
    if (infoSizeCm) infoSizeCm.textContent = `${currentRealWidth.toFixed(1)} × ${currentRealHeight.toFixed(1)}`;

    function drawLegendUnits() {
        const legendTableBody = document.getElementById('legendTableBody');
        if (!legendTableBody) return;

        legendTableBody.innerHTML = '';

        legend.forEach(item => {
            item.length_cm = item.original_length_cm * (currentRealWidth / originalRealWidth);

            let lengthText = '';
            if (currentUnit === "cm") {
                lengthText = item.length_cm.toFixed(1) + " см";
            } else {
                const skeinLength = 8;
                const skeins = Math.ceil(item.length_cm / 100 / skeinLength);
                lengthText = skeins + " моток";
            }

            const tr = document.createElement('tr');
            const inventoryThread = getInventoryThreadForLegendItem(item);
            const requiredLengthCm = Math.ceil(item.length_cm || 0);
            const availableLengthCm = Math.round(inventoryThread?.available_length_cm ?? inventoryThread?.length_cm ?? 0);
            const reservedByOtherPatternsCm = Math.round(inventoryThread?.reserved_by_other_patterns_cm || 0);
            let inventoryStatus = '';

            if (inventoryThread && availableLengthCm >= requiredLengthCm) {
                inventoryStatus = `<span class="inventory-status-badge enough" title="Свободно ${availableLengthCm} см${reservedByOtherPatternsCm > 0 ? `, занято в других схемах ${reservedByOtherPatternsCm} см` : ''}">В наличии</span>`;
            } else {
                const missingLengthCm = Math.max(0, requiredLengthCm - availableLengthCm);
                inventoryStatus = `<span class="inventory-status-badge ${inventoryThread ? 'partial' : 'none'}" title="${inventoryThread ? `Свободно ${availableLengthCm} см${reservedByOtherPatternsCm > 0 ? `, занято в других схемах ${reservedByOtherPatternsCm} см` : ''}, требуется ${requiredLengthCm} см` : 'Нитки нет в инвентаре'}">Докупить ${missingLengthCm} см</span>`;
            }

            tr.innerHTML = `
                <td style="display:flex;justify-content:center;align-items:center;">
                   <div style="background: rgb(${item.r}, ${item.g}, ${item.b}); color: ${getContrastColor(item.r, item.g, item.b)};" class="symbol">
                        ${item.symbol}
                    </div>
                </td>
                <td>${formatLegendCode(item)}</td>
                <td>${lengthText}</td>
                <td>${inventoryStatus}</td>
            `;
            legendTableBody.appendChild(tr);
        });
    }

    function updateSizes(countPerCm) {
        const cellCm = 1 / countPerCm;
        currentRealWidth = width * cellCm;
        currentRealHeight = height * cellCm;
        if (infoSizeCm) infoSizeCm.textContent = `${currentRealWidth.toFixed(1)} × ${currentRealHeight.toFixed(1)}`;
        drawLegendUnits();
    }

    function hasValidCell(cell) {
        return cell && cell.code !== null && cell.code !== undefined && cell.code !== '';
    }

    function getValidCellStats(targetCells) {
        let sum = 0;
        let validCount = 0;
        let totalCount = 0;

        for (let y = 0; y < targetCells.length; y++) {
            for (let x = 0; x < targetCells[y].length; x++) {
                const cell = targetCells[y][x];
                totalCount += 1;
                if (!hasValidCell(cell)) continue;
                const brightness = (cell.r * 299 + cell.g * 587 + cell.b * 114) / 1000;
                sum += brightness;
                validCount += 1;
            }
        }

        return {
            average: validCount ? sum / validCount : 255,
            validCount,
            totalCount
        };
    }

    function getGridColors(targetCells) {
        const { average, validCount, totalCount } = getValidCellStats(targetCells);
        const emptyCount = totalCount - validCount;
        const hasLargeTransparentArea = emptyCount > totalCount * 0.15;

        if (average < 120) {
            if (hasLargeTransparentArea) {
                return {
                    minor: 'rgba(0, 0, 0, 0.35)',
                    major: 'rgba(0, 0, 0, 0.7)'
                };
            }
            return {
                minor: 'rgba(255, 255, 255, 0.55)',
                major: 'rgba(255, 255, 255, 0.95)'
            };
        }

        return {
            minor: 'rgba(0, 0, 0, 0.35)',
            major: 'rgba(0, 0, 0, 0.7)'
        };
    }

    function drawGrid(cellSize) {
        if (cellSize < 1) return;

        const { minor, major } = getGridColors(cells);
        const widthPx = patternWidth * cellSize;
        const heightPx = patternHeight * cellSize;

        ctx.save();

        ctx.beginPath();
        ctx.strokeStyle = minor;
        ctx.lineWidth = 1;
        for (let x = 0; x <= patternWidth; x++) {
            const xPos = offsetX + x * cellSize + 0.5;
            ctx.moveTo(xPos, offsetY);
            ctx.lineTo(xPos, offsetY + heightPx);
        }
        for (let y = 0; y <= patternHeight; y++) {
            const yPos = offsetY + y * cellSize + 0.5;
            ctx.moveTo(offsetX, yPos);
            ctx.lineTo(offsetX + widthPx, yPos);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = major;
        ctx.lineWidth = 2;
        for (let x = 0; x <= patternWidth; x += 10) {
            const xPos = offsetX + x * cellSize + 0.5;
            ctx.moveTo(xPos, offsetY);
            ctx.lineTo(xPos, offsetY + heightPx);
        }
        for (let y = 0; y <= patternHeight; y += 10) {
            const yPos = offsetY + y * cellSize + 0.5;
            ctx.moveTo(offsetX, yPos);
            ctx.lineTo(offsetX + widthPx, yPos);
        }
        ctx.stroke();

        ctx.restore();
    }

    function centerPattern() {
        const canvasWrapper = canvas.parentElement;
        const wrapperWidth = canvasWrapper.clientWidth;
        const wrapperHeight = canvasWrapper.clientHeight;

        const cellSize = Math.floor(Math.min(wrapperWidth / patternWidth, wrapperHeight / patternHeight));
        currentCellSize = Math.max(1, cellSize);
        scale = currentCellSize / 20;
        offsetX = (canvasWrapper.clientWidth - patternWidth * currentCellSize) / 2;
        offsetY = (canvasWrapper.clientHeight - patternHeight * currentCellSize) / 2;

        canvas.width = canvasWrapper.clientWidth;
        canvas.height = canvasWrapper.clientHeight;
    }

    function getContrastColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    }

    function drawPattern() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = Math.max(1, Math.round(20 * scale));
        currentCellSize = cellSize;
        ctx.font = `${cellSize * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                const cell = cells[y][x];
                ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`;
                ctx.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
                const validCode = hasValidCell(cell);
                if (validCode) {
                    ctx.fillStyle = getContrastColor(cell.r, cell.g, cell.b);
                    ctx.fillText(cell.symbol || '?', x * cellSize + offsetX + cellSize / 2, y * cellSize + offsetY + cellSize / 2);
                }
                if (completed[y][x]) {
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x * cellSize + offsetX + 2, y * cellSize + offsetY + 2);
                    ctx.lineTo((x + 1) * cellSize + offsetX - 2, (y + 1) * cellSize + offsetY - 2);
                    ctx.moveTo((x + 1) * cellSize + offsetX - 2, y * cellSize + offsetY + 2);
                    ctx.lineTo(x * cellSize + offsetX + 2, (y + 1) * cellSize + offsetY - 2);
                    ctx.stroke();
                }
            }
        }

        drawGrid(cellSize);
    }

    function markCellAtPosition(clientX, clientY, value = null) {
        const rect = canvas.getBoundingClientRect();
        const clickX = clientX - rect.left - offsetX;
        const clickY = clientY - rect.top - offsetY;
        const cellSize = Math.max(1, Math.round(20 * scale));
        const cellX = Math.floor(clickX / cellSize);
        const cellY = Math.floor(clickY / cellSize);
        if (cellX >= 0 && cellX < patternWidth && cellY >= 0 && cellY < patternHeight) {
            completed[cellY][cellX] = value === null ? !completed[cellY][cellX] : value;
            localStorage.setItem(storageKey, JSON.stringify(completed));
            drawPattern();
        }
    }

    canvas.addEventListener('click', e => {
        if (window.patternViewApp.mode === 'mark') {
            markCellAtPosition(e.clientX, e.clientY, true);
        } else if (window.patternViewApp.mode === 'erase') {
            markCellAtPosition(e.clientX, e.clientY, false);
        }
    });

    canvas.addEventListener('mousedown', e => {
        if (window.patternViewApp.mode === 'drag') {
            isDragging = true;
            dragStartX = e.clientX - offsetX;
            dragStartY = e.clientY - offsetY;
        } else if (window.patternViewApp.mode === 'mark') {
            isMarking = true;
            markCellAtPosition(e.clientX, e.clientY, true);
        } else if (window.patternViewApp.mode === 'erase') {
            isMarking = true;
            markCellAtPosition(e.clientX, e.clientY, false);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        isMarking = false;
    });
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        isMarking = false;
    });
    canvas.addEventListener('mousemove', e => {
        if (isMarking) {
            if (window.patternViewApp.mode === 'mark') {
                markCellAtPosition(e.clientX, e.clientY, true);
            } else if (window.patternViewApp.mode === 'erase') {
                markCellAtPosition(e.clientX, e.clientY, false);
            }
        } else if (isDragging) {
            offsetX = e.clientX - dragStartX;
            offsetY = e.clientY - dragStartY;
            drawPattern();
        }
    });

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.05 : 0.95;
        scale *= delta;
        scale = Math.max(0.1, Math.min(scale, 10));
        drawPattern();
    });

    centerPattern();
    drawPattern();
    drawLegendUnits();

    window.patternViewApp.setUnit = (unit) => {
        currentUnit = unit === 'skeins' ? 'skeins' : 'cm';
        drawLegendUnits();
    };
    window.patternViewApp.setCanvasCountPerCm = (countPerCm) => {
        const parsed = parseFloat(countPerCm);
        if (Number.isFinite(parsed) && parsed > 0) {
            updateSizes(parsed);
        }
    };
    window.patternViewApp.zoomIn = () => {
        scale *= 1.2;
        drawPattern();
    };
    window.patternViewApp.zoomOut = () => {
        scale /= 1.2;
        drawPattern();
    };
    window.patternViewApp.resetView = () => {
        centerPattern();
        drawPattern();
    };
    window.patternViewApp.navigateBack = () => {
        const prevBtn = document.getElementById('prevBtn');
        const backUrl = prevBtn?.dataset.backUrl;
        window.location.href = backUrl || '/my_patterns/';
    };
});
