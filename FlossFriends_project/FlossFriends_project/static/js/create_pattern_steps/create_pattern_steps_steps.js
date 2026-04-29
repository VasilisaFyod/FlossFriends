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
            window.patternCreator.drawPatternSymbols();
        }
    }

    previousStep() {
        const creator = window.patternCreator;

        if (this.currentStep === 1) {
            const sourceImg = document.getElementById("sourceImage");
            if (sourceImg?.src) sessionStorage.setItem("tempImage", sourceImg.src);
            if (existingPattern) {
                window.location.href = '/my_patterns/';
            } else {
                creator._goingBack = true;
                window.location.href = '/add_image_for_create/';
            }
            return;
        }

        if (this.currentStep === 3) {
            this.currentStep--;
            creator.drawPatternGrid(
                creator.currentCellSize,
                creator.currentOffsetX,
                creator.currentOffsetY
            );
            this.updateUI();
            return;
        }

        if (this.currentStep === 2) {
            this.currentStep--;
            this.resetStepTwo();
            this.updateUI();
        }
    }

    resetStepTwo() {
        const creator = window.patternCreator;
        if (!creator) return;

        const paletteSelect = document.getElementById("paletteSelect");
        if (paletteSelect) {
            const selectedDiv = paletteSelect.querySelector(".select-selected");
            const firstOption = paletteSelect.querySelector(".select-items div");
            if (selectedDiv && firstOption) selectedDiv.textContent = firstOption.textContent;
        }

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

        creator.patternCells = [];
        creator.drawPattern();
        creator.updatePatternSizeDebounced();
        creator.initColorSettings();
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
        const creator = window.patternCreator;

        if (!title) {
            this.showError("Введите название схемы");
            return;
        }
        let imageData = creator.sourceImage.src;
        if (!imageData.includes("base64")) imageData = existingPattern?.image_original || imageData;

        const data = {
            title,
            image: imageData,
            width: creator.patternData.width,
            height: creator.patternData.height,
            cells: creator.patternCells,
            legend: creator.lastLegend,
            palette: creator.getSelectedPalette(),
            canvas: creator.getSelectedCanvasName()
        };

        try {
            const url = existingPattern
                ? `/api/pattern/${existingPattern.id}/update/`
                : `/api/save-pattern/`;

            const method = existingPattern ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result?.error || "Ошибка сохранения");
            }

            creator._saving = true;
            sessionStorage.removeItem('tempImage');
            await fetch('/clear-temp-image/', {
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCsrfToken() }
            }).catch(() => {});

            this.closeModal();
            document.querySelector('.progress-bar').style.setProperty('--progress', '100%');

            setTimeout(() => {
                window.location.href = `/pattern_view/?id=${result.id}`;
            }, 500);
        } catch (e) {
            console.error(e);
            creator._saving = false;
            this.showError(e?.message || "Ошибка сохранения");
        }
    }

    getCsrfToken() {
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
        return cookie ? decodeURIComponent(cookie.trim().split('=')[1]) : '';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const imgElement = document.getElementById("sourceImage");
    if (imgElement?.src && window.PatternCreator) {
        window.patternCreator = new window.PatternCreator(imgElement.src);
    }
    new PatternCreationSteps();
});

window.addEventListener('beforeunload', () => {
    const saving = window.patternCreator?._saving;
    const goingBack = window.patternCreator?._goingBack;
    if (!saving && !goingBack) {
        sessionStorage.removeItem('tempImage');
        navigator.sendBeacon('/clear-temp-image/', (() => {
            const fd = new FormData();
            const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
            if (cookie) fd.append('csrfmiddlewaretoken', decodeURIComponent(cookie.trim().split('=')[1]));
            return fd;
        })());
    }
});
