document.addEventListener('DOMContentLoaded', function() {

    // Маппинг значений на русские названия
    const sizeLabels = {
        'small': 'Маленькие (≤50)',
        'medium': 'Средние (50-150)',
        'large': 'Большие (150+)'
    };
    const colorLabels = {
        'few': 'Мало (1-20)',
        'medium': 'Среднее (20-100)',
        'many': 'Много (100+)'
    };

    // ===== SIZE FILTER (multi-select checkboxes) =====
    const sizeFilter = document.getElementById('sizeFilter');
    if (sizeFilter) {
        const selected = sizeFilter.querySelector('.select-selected');
        const items = sizeFilter.querySelector('.select-items');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelects();
            items.style.display = items.style.display === 'block' ? 'none' : 'block';
            sizeFilter.classList.toggle('open');
        });

        items.addEventListener('click', (e) => e.stopPropagation());

        items.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = [...items.querySelectorAll('input:checked')].map(c => c.value);
                updateFilterLabel(selected, checked, 'Все размеры', sizeLabels);
                applyFilters();
            });
        });
    }

    // ===== COLORS FILTER (multi-select checkboxes) =====
    const colorsFilter = document.getElementById('colorsFilter');
    if (colorsFilter) {
        const selected = colorsFilter.querySelector('.select-selected');
        const items = colorsFilter.querySelector('.select-items');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelects();
            items.style.display = items.style.display === 'block' ? 'none' : 'block';
            colorsFilter.classList.toggle('open');
        });

        items.addEventListener('click', (e) => e.stopPropagation());

        items.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = [...items.querySelectorAll('input:checked')].map(c => c.value);
                updateFilterLabel(selected, checked, 'Все', colorLabels);
                applyFilters();
            });
        });
    }

    // ===== CATEGORY FILTER (multi-select checkboxes) =====
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const selected = categoryFilter.querySelector('.select-selected');
        const items = categoryFilter.querySelector('.select-items');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelects();
            items.style.display = items.style.display === 'block' ? 'none' : 'block';
            categoryFilter.classList.toggle('open');
        });

        items.addEventListener('click', (e) => e.stopPropagation());

        items.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = [...items.querySelectorAll('input:checked')].map(c => c.value);
                updateFilterLabel(selected, checked, 'Все категории');
                applyFilters();
            });
        });
    }

    function updateFilterLabel(selected, checked, allLabel = 'Все', mapper = null) {
        if (checked.length === 0) {
            selected.textContent = allLabel;
        } else if (checked.length === 1) {
            const text = mapper ? (mapper[checked[0]] || checked[0]) : checked[0];
            selected.textContent = text;
        } else {
            const firstText = mapper ? (mapper[checked[0]] || checked[0]) : checked[0];
            selected.textContent = `${firstText} +${checked.length - 1}`;
        }
    }

    function closeAllSelects() {
        document.querySelectorAll('.filter-group .custom-select').forEach(s => {
            s.querySelector('.select-items').style.display = 'none';
            s.classList.remove('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group .custom-select')) closeAllSelects();
    });

    // ===== FILTERING =====
    function applyFilters() {
        const checkedSize = sizeFilter
            ? [...sizeFilter.querySelectorAll('input:checked')].map(c => c.value)
            : [];
        const checkedColors = colorsFilter
            ? [...colorsFilter.querySelectorAll('input:checked')].map(c => c.value)
            : [];
        const checkedCats = categoryFilter
            ? [...categoryFilter.querySelectorAll('input:checked')].map(c => c.value)
            : [];
        const searchInput = document.querySelector('.search-input');
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

        document.querySelectorAll('.pattern-card').forEach(card => {
            const cardSize = (card.dataset.size || '').trim();
            const cardColors = (card.dataset.colors || '').trim();
            const cardCats = (card.dataset.categories || '').split(',').map(s => s.trim()).filter(Boolean);
            const title = (card.dataset.title || '').toLowerCase();

            const sizeMatch = checkedSize.length === 0 || checkedSize.includes(cardSize);
            const colorsMatch = checkedColors.length === 0 || checkedColors.includes(cardColors);
            const catMatch = checkedCats.length === 0 || checkedCats.some(cat => cardCats.includes(cat));
            const searchMatch = query === '' || title.includes(query);

            const show = sizeMatch && colorsMatch && catMatch && searchMatch;
            card.style.display = show ? '' : 'none';
        });

        updateNoPatterns();
    }

    function callApi(url, button, onAdded, onRemoved) {
        fetch(url, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCsrfToken(), 'Content-Type': 'application/json' },
        })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => { data.status === 'added' ? onAdded() : onRemoved(); })
        .catch(err => console.error('[API ERROR]', err));
    }

    document.querySelectorAll('.add-to-inventory').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('.plus-icon-favorite');
            const patternId = this.dataset.patternId;
            callApi(`/api/toggle-favorite/${patternId}/`, this,
                () => { this.classList.add('active'); icon.textContent = '✓'; icon.style.color = '#219653'; },
                () => { this.classList.remove('active'); icon.textContent = '+'; icon.style.color = ''; }
            );
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('.heart-icon');
            const patternId = this.dataset.patternId;
            callApi(`/api/toggle-like/${patternId}/`, this,
                () => { this.classList.add('active'); icon.textContent = '♥'; icon.style.color = '#e74c3c'; },
                () => { this.classList.remove('active'); icon.textContent = '♡'; icon.style.color = ''; }
            );
        });
    });

    function getCsrfToken() {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : '';
    }
    
        function updateNoPatterns() {
            const grid = document.getElementById('patternsGrid');
            const noPatterns = document.getElementById('noPatterns');
            if (grid && noPatterns) {
                const allCards = [...grid.querySelectorAll('.pattern-card')];
                const visibleCards = allCards.filter(c => c.style.display !== 'none');
                noPatterns.style.display = (allCards.length > 0 && visibleCards.length === 0) ? 'block' : 'none';
            }
        }

        function performSearch() {
            applyFilters();
        }

        const searchBtn = document.querySelector('.search-btn');
        const searchInput = document.querySelector('.search-input');
        if (searchBtn) searchBtn.addEventListener('click', performSearch);
        if (searchInput) searchInput.addEventListener('input', performSearch);

    applyFilters();
});