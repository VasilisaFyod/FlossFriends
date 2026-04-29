Object.assign(PatternCreator.prototype, {
    normalizeCode(code) {
        if (code === null || code === undefined) return '';
        return String(code).trim().toUpperCase();
    },

    parseRgb(source) {
        if (!source) return null;
        const r = Number(source.r);
        const g = Number(source.g);
        const b = Number(source.b);

        if (![r, g, b].every(Number.isFinite)) return null;
        if ([r, g, b].some(v => v < 0 || v > 255)) return null;

        return { r, g, b };
    },

    getDistance(c1, c2) {
        const color1 = this.parseRgb(c1);
        const color2 = this.parseRgb(c2);
        if (!color1 || !color2) return Number.POSITIVE_INFINITY;

        return Math.sqrt(
            (color1.r - color2.r) ** 2 +
            (color1.g - color2.g) ** 2 +
            (color1.b - color2.b) ** 2
        );
    },

    getHueDistance(h1, h2) {
        const diff = Math.abs(h1 - h2);
        return Math.min(diff, 360 - diff);
    },

    getDominant(color) {
        if (color.r > color.g && color.r > color.b) return "red";
        if (color.g > color.r && color.g > color.b) return "green";
        if (color.b > color.r && color.b > color.g) return "blue";
        return "neutral";
    },

    getBrightness(color) {
        return (color.r + color.g + color.b) / 3;
    },

    formatLegendCode(code, palettePrefix = this.getSelectedPalette() || 'DMC') {
        if (!code) return '';
        const codeText = String(code).trim();
        if (codeText.includes('-')) return codeText;
        return `${palettePrefix}-${codeText}`;
    },

    getCodeWithoutPalette(code) {
        if (!code) return '';
        const codeText = String(code).trim();
        return codeText.includes('-') ? codeText.split('-', 2)[1] || '' : codeText;
    },

    getPaletteFromCode(code, fallbackPalette = this.getSelectedPalette() || 'DMC') {
        if (!code) return fallbackPalette;
        const codeText = String(code).trim();
        if (!codeText.includes('-')) return fallbackPalette;
        return codeText.split('-', 2)[0] || fallbackPalette;
    },

    attachPaletteToLegend(legend, fallbackPalette = this.getSelectedPalette() || 'DMC') {
        if (!Array.isArray(legend)) return [];
        return legend.map(item => {
            if (!item || typeof item !== 'object') return item;
            return {
                ...item,
                palette: item.palette || this.getPaletteFromCode(item.code, fallbackPalette)
            };
        });
    },

    getComparableThreadCode(code, palettePrefix = this.getSelectedPalette() || 'DMC') {
        return this.formatLegendCode(code, palettePrefix).trim().toLowerCase();
    },

    codesMatch(codeA, codeB, paletteA = this.getSelectedPalette() || 'DMC', paletteB = this.getSelectedPalette() || 'DMC') {
        return this.getComparableThreadCode(codeA, paletteA) === this.getComparableThreadCode(codeB, paletteB);
    },

    rgbToHsv({ r, g, b }) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;

        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta) % 6;
            } else if (max === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
            h *= 60;
            if (h < 0) h += 360;
        }

        const s = max === 0 ? 0 : delta / max;
        const v = max;

        return { h, s: s * 100, v: v * 100 };
    },

    hasEnoughInventoryLength(thread, requiredLengthCm) {
        return this.getAvailableInventoryLength(thread) >= parseFloat(requiredLengthCm || 0);
    },

    getAvailableInventoryLength(thread) {
        if (!thread) return 0;

        const availableLength = parseFloat(thread.available_length_cm ?? thread.length_cm ?? 0);
        return availableLength > 0 ? availableLength : 0;
    },

    getExactInventoryThread(legendItem) {
        if (!Array.isArray(this.inventoryThreads) || !legendItem) return null;
        return this.inventoryThreads.find(t =>
            this.codesMatch(t.code, legendItem.code, t.palette, legendItem.palette || this.getSelectedPalette() || 'DMC')
        ) || null;
    },

    findClosestInventoryThread(legendItem, palettePrefix, requiredLengthCm = 0, requireEnoughLength = true) {
        if (!Array.isArray(this.inventoryThreads) || this.inventoryThreads.length === 0) return null;
        if (!legendItem) return null;

        const legendRgb = this.parseRgb(legendItem);
        if (!legendRgb) return null;

        const legendHsv = this.rgbToHsv(legendRgb);
        const maxDistance = 100;
        const maxHueDiff = 25;
        const maxSatDiff = 40;
        const maxValDiff = 40;

        let closest = null;
        let minDistance = Number.POSITIVE_INFINITY;

        this.inventoryThreads.forEach(thread => {
            if (this.codesMatch(thread.code, legendItem.code, thread.palette, legendItem.palette || this.getSelectedPalette() || 'DMC')) return;
            if (requireEnoughLength && !this.hasEnoughInventoryLength(thread, requiredLengthCm)) return;

            const threadRgb = this.parseRgb(thread);
            if (!threadRgb) return;

            const threadHsv = this.rgbToHsv(threadRgb);
            const distance = this.getDistance(legendRgb, threadRgb);
            const hueDiff = this.getHueDistance(legendHsv.h, threadHsv.h);
            const satDiff = Math.abs(legendHsv.s - threadHsv.s);
            const valDiff = Math.abs(legendHsv.v - threadHsv.v);

            if (
                hueDiff < maxHueDiff &&
                satDiff < maxSatDiff &&
                valDiff < maxValDiff &&
                distance < maxDistance
            ) {
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = thread;
                }
            }
        });

        return closest;
    },

    isThreadInInventory(legendItem) {
        return Boolean(this.getExactInventoryThread(legendItem));
    },

    bindReplacementModalEvents() {
        if (!this.replacementModal) return;
        this.replacementModal.style.display = 'none';
        this.replacementModal.setAttribute('aria-hidden', 'true');

        const closeButtons = this.replacementModal.querySelectorAll('[data-close-replacement-modal]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeReplacementModal());
        });

        const confirmBtn = document.getElementById('confirmReplaceBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.applyThreadReplacement());
        }

        this.replacementModal.addEventListener('click', (event) => {
            if (event.target === this.replacementModal) {
                this.closeReplacementModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.replacementModal.classList.contains('active')) {
                this.closeReplacementModal();
            }
        });
    },

    setReplacementModalThreadData(prefix, thread) {
        const colorEl = document.getElementById(`${prefix}ThreadColor`);
        const codeEl = document.getElementById(`${prefix}ThreadCode`);
        const nameEl = document.getElementById(`${prefix}ThreadName`);
        if (!colorEl || !codeEl || !nameEl || !thread) return;

        colorEl.style.backgroundColor = `rgb(${thread.r}, ${thread.g}, ${thread.b})`;
        codeEl.textContent = thread.code;
        const parts = [thread.name || ''];
        if (prefix === 'from' && thread.required_length_cm) {
            parts.push(`Нужно: ${Math.ceil(thread.required_length_cm)} см`);
        }
        if (prefix === 'to' && thread.available_length_cm !== undefined) {
            parts.push(`Свободно: ${Math.round(thread.available_length_cm)} см`);
        } else if (prefix === 'to' && thread.length_cm) {
            parts.push(`В наличии: ${Math.round(thread.length_cm)} см`);
        }
        nameEl.textContent = parts.filter(Boolean).join(' • ');
    },

    openReplacementModal(fromThread, toThread) {
        if (!this.replacementModal) return;

        this.setReplacementModalThreadData('from', fromThread);
        this.setReplacementModalThreadData('to', toThread);
        this._pendingReplacement = { fromThread, toThread };

        this.replacementModal.style.display = 'flex';
        this.replacementModal.setAttribute('aria-hidden', 'false');
        this.replacementModal.classList.add('active');
        document.body.classList.add('modal-open-replacement');
    },

    closeReplacementModal() {
        if (!this.replacementModal) return;
        this.replacementModal.classList.remove('active');
        this.replacementModal.style.display = 'none';
        this.replacementModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open-replacement');
        this._pendingReplacement = null;
    },

    applyThreadReplacement() {
        const pending = this._pendingReplacement;
        if (!pending) return;

        const { fromThread, toThread } = pending;
        const fromCode = fromThread.rawCode ?? fromThread.code;
        const toCode = toThread.rawCode ?? toThread.code;
        const fromPalette = fromThread.palette || this.getPaletteFromCode(fromCode, this.getSelectedPalette() || 'DMC');
        const normalizedFromCode = this.getCodeWithoutPalette(fromCode);
        const normalizedToCode = this.getCodeWithoutPalette(toCode);
        const toPalette = toThread.palette || this.getPaletteFromCode(toCode, this.getSelectedPalette() || 'DMC');
        const toLegendCode = toCode.includes('-') ? toCode : this.formatLegendCode(normalizedToCode, toPalette);

        for (const row of this.patternCells) {
            for (const cell of row) {
                if (this.getCodeWithoutPalette(cell.code) === normalizedFromCode) {
                    cell.code = toLegendCode;
                    cell.r = toThread.r;
                    cell.g = toThread.g;
                    cell.b = toThread.b;
                    cell.name = toThread.name;
                }
            }
        }

        const idx = this.lastLegend.findIndex(l =>
            this.codesMatch(l.code, fromCode, l.palette || fromPalette, fromPalette)
        );
        let targetSymbol = null;
        if (idx !== -1) {
            const existing = this.lastLegend[idx];
            const merged = this.lastLegend.find((l, legendIndex) =>
                legendIndex !== idx &&
                this.codesMatch(l.code, toLegendCode, l.palette || this.getSelectedPalette() || 'DMC', toPalette)
            );
            if (merged) {
                targetSymbol = merged.symbol;
                merged.palette = toPalette;
                merged.code = toLegendCode;
                merged.name = toThread.name;
                merged.r = toThread.r;
                merged.g = toThread.g;
                merged.b = toThread.b;
                merged.count = parseInt(merged.count || 0, 10) + parseInt(existing.count || 0, 10);
                merged.length_cm = parseFloat(
                    (parseFloat(merged.length_cm || 0) + parseFloat(existing.length_cm || 0)).toFixed(1)
                );
                this.lastLegend.splice(idx, 1);
            } else {
                targetSymbol = existing.symbol;
                existing.code = toLegendCode;
                existing.palette = toPalette;
                existing.name = toThread.name;
                existing.r = toThread.r;
                existing.g = toThread.g;
                existing.b = toThread.b;
            }
        }

        if (targetSymbol !== null) {
            for (const row of this.patternCells) {
                for (const cell of row) {
                    if (this.codesMatch(cell.code, toLegendCode, this.getPaletteFromCode(cell.code), toPalette)) {
                        cell.symbol = targetSymbol;
                    }
                }
            }
        }

        this.drawPatternGrid(this.currentCellSize, this.currentOffsetX, this.currentOffsetY);
        const step3Active = document.getElementById('step3')?.classList.contains('active');
        if (step3Active) this.drawPatternSymbols();
        this.updateLegendTable(this.lastLegend);
        this.closeReplacementModal();
    },

    updateLegendTable(legend) {
        const tbody = document.getElementById('legendTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const unit = this.getSelectedLengthUnit();
        const palettePrefix = this.getSelectedPalette() || 'DMC';

        legend.forEach(item => {
            const tr = document.createElement('tr');
            const length = this.convertLength(item.length_cm, unit);
            const formattedFromCode = this.formatLegendCode(item.code, item.palette || palettePrefix);
            const exactInventoryThread = this.getExactInventoryThread(item);
            const inInventory = Boolean(exactInventoryThread);
            const enoughExactLength = this.hasEnoughInventoryLength(exactInventoryThread, item.length_cm);
            const replacementThread = enoughExactLength
                ? null
                : this.findClosestInventoryThread(item, palettePrefix, item.length_cm, true);
            const fallbackReplacementThread = replacementThread
                ? null
                : this.findClosestInventoryThread(item, palettePrefix, item.length_cm, false);
            const isReplacementAvailable = Boolean(replacementThread);

            const replacementData = replacementThread
                ? {
                    code: replacementThread.full_code || this.formatLegendCode(replacementThread.code, replacementThread.palette),
                    palette: replacementThread.palette,
                    name: replacementThread.name || '',
                    r: replacementThread.r,
                    g: replacementThread.g,
                    b: replacementThread.b,
                    length_cm: replacementThread.length_cm,
                    available_length_cm: this.getAvailableInventoryLength(replacementThread)
                }
                : null;

            let actionCell;
            if (inInventory && enoughExactLength) {
                const reservedByOtherPatterns = Math.round(exactInventoryThread.reserved_by_other_patterns_cm || 0);
                actionCell = `<span class="in-inventory-badge" title="Свободно ${Math.round(this.getAvailableInventoryLength(exactInventoryThread))} см${reservedByOtherPatterns > 0 ? `, занято в других схемах ${reservedByOtherPatterns} см` : ''}, требуется ${Math.ceil(item.length_cm || 0)} см">✓ В наличии</span>`;
            } else if (inInventory) {
                const freeLength = Math.round(this.getAvailableInventoryLength(exactInventoryThread));
                const missingLength = Math.max(0, Math.ceil(item.length_cm || 0) - freeLength);
                const reservedByOtherPatterns = Math.round(exactInventoryThread.reserved_by_other_patterns_cm || 0);
                actionCell = `<span class="in-inventory-badge insufficient" title="Свободно ${freeLength} см${reservedByOtherPatterns > 0 ? `, занято в других схемах ${reservedByOtherPatterns} см` : ''}, требуется ${Math.ceil(item.length_cm || 0)} см">Докупить ${missingLength} см</span>`;
            } else {
                actionCell = `<button type="button" class="change-btn ${isReplacementAvailable ? 'available' : 'disabled'}" ${isReplacementAvailable ? '' : 'disabled'}>
                    <img src="/static/images/change-color.png" class="change-icon">
                </button>`;
            }

            tr.innerHTML = `
                <td style="display:flex;justify-content:center;align-items:center;">
                    <div style="background: rgb(${item.r}, ${item.g}, ${item.b}); color: ${this.getContrastColor(item.r, item.g, item.b)};" class="symbol">
                        ${item.symbol}
                    </div>
                </td>
                <td>${formattedFromCode}</td>
                <td>${length}</td>
                <td>${actionCell}</td>
            `;

            const changeButton = tr.querySelector('.change-btn');
            if (changeButton && replacementData) {
                changeButton.addEventListener('click', () => {
                    this.openReplacementModal(
                        {
                            code: formattedFromCode,
                            rawCode: item.code,
                            palette: item.palette || palettePrefix,
                            name: item.name || '',
                            r: item.r,
                            g: item.g,
                            b: item.b,
                            required_length_cm: item.length_cm
                        },
                        {
                            ...replacementData,
                            rawCode: replacementThread.code
                        }
                    );
                });
            } else if (changeButton) {
                if (fallbackReplacementThread) {
                    const availableLength = Math.round(this.getAvailableInventoryLength(fallbackReplacementThread));
                    const requiredLength = Math.ceil(item.length_cm || 0);
                    changeButton.title = `Похожая нитка есть, но свободной длины не хватает: ${availableLength} см из ${requiredLength} см`;
                } else {
                    changeButton.title = 'В инвентаре нет подходящей нитки для замены';
                }
            }

            tbody.appendChild(tr);
        });
    },

    updateLegendUnits() {
        this.updateLegendTable(this.lastLegend || []);
    },

    getContrastColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    }
});
