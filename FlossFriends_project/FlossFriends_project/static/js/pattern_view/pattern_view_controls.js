document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
        window.patternViewApp?.zoomIn();
    });
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
        window.patternViewApp?.zoomOut();
    });
    document.getElementById('resetViewBtn')?.addEventListener('click', () => {
        window.patternViewApp?.resetView();
    });

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            window.patternViewApp?.navigateBack();
        });
    }

    document.querySelectorAll(".custom-select").forEach(select => {
        const selected = select.querySelector(".select-selected");
        const items = select.querySelector(".select-items");
        if (!selected || !items) return;

        selected.onclick = () => {
            const newVisibility = items.style.visibility === "visible" ? "hidden" : "visible";
            items.style.visibility = newVisibility;
            select.classList.toggle("open");
        };

        items.querySelectorAll("div").forEach(option => {
            option.onclick = () => {
                selected.textContent = option.textContent;
                items.style.visibility = "hidden";
                select.classList.remove("open");

                if (select.id === "modeSelectWrapper") {
                    window.patternViewApp?.setMode(option.getAttribute("data-value"));
                } else if (select.id === "canvasSelectWrapper") {
                    window.patternViewApp?.setCanvasCountPerCm(option.getAttribute("data-count"));
                } else if (select.id === "unitsSelectWrapper") {
                    const unit = option.getAttribute("data-value") === "meters" ? "cm" : "skeins";
                    window.patternViewApp?.setUnit(unit);
                }
            };
        });
    });
});
