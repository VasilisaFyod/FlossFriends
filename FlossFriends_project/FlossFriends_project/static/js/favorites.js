document.addEventListener('DOMContentLoaded', function () {
    function getCsrfToken() {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : '';
    }

    function ensureEmptyMessage() {
        const grid = document.querySelector('.patterns-grid');
        if (!grid) return;

        const hasCards = grid.querySelectorAll('.pattern-card').length > 0;
        const existing = grid.querySelector('.no-patterns');

        if (!hasCards && !existing) {
            const message = document.createElement('p');
            message.className = 'no-patterns';
            message.textContent = 'В избранном пока нет схем';
            grid.appendChild(message);
        }
    }

    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const patternMenu = this.closest('.pattern-menu');
            document.querySelectorAll('.pattern-menu').forEach(m => {
                if (m !== patternMenu) m.classList.remove('active');
            });
            patternMenu.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.pattern-menu').forEach(m => m.classList.remove('active'));
    });

    document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const patternId = this.dataset.patternId;
            fetch(`/api/toggle-favorite/${patternId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken(), 'Content-Type': 'application/json' },
            })
            .then(r => r.json())
            .then(() => {
                const card = document.querySelector(`.pattern-card[data-pattern-id="${patternId}"]`);
                if (card) card.remove();
                ensureEmptyMessage();
            })
            .catch(err => console.error(err));
        });
    });
});
