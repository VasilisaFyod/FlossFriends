function handleCustomSelectChange(select) {
    const creator = window.patternCreator;
    if (!select || !creator) return;

    if (select.id === "paletteSelect") {
        creator.updateColorsSliderRange();
        creator.updateColors();
        return;
    }

    if (select.id === "typeSelect") {
        creator.updateFabricSize();
        creator.updateLegendUnits();
        creator.updateColors();
        return;
    }

    if (select.closest("#step3")) {
        creator.updateLegendUnits();
    }
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

    items.addEventListener("click", (event) => {
        const option = event.target.closest("div");
        if (!option || !items.contains(option)) return;

        selected.textContent = option.textContent;
        items.style.visibility = "hidden";
        select.classList.remove("open");
        handleCustomSelectChange(select);
    });
});
