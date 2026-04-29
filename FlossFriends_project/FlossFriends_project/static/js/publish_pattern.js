document.addEventListener('DOMContentLoaded', function () {
    const page = document.querySelector('.page-content');
    const likeBtn = document.querySelector('button.like-btn');
    const favoriteBtn = document.querySelector('button.favorite-btn[aria-label="Добавить в избранное"]');

    if (!page || !likeBtn) {
        return;
    }

    const patternId = page.dataset.patternId;

    function getCsrfToken() {
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : '';
    }

    async function postToggle(url) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    }

    likeBtn.addEventListener('click', async function () {
        const icon = this.querySelector('.heart-icon');
        const count = this.querySelector('.action-count');

        try {
            const data = await postToggle(`/api/toggle-like/${patternId}/`);
            const currentCount = parseInt(count.textContent, 10) || 0;

            if (data.status === 'added') {
                this.classList.add('active');
                icon.textContent = '♥';
                count.textContent = currentCount + 1;
            } else {
                this.classList.remove('active');
                icon.textContent = '♡';
                count.textContent = Math.max(0, currentCount - 1);
            }
        } catch (error) {
            console.error('toggle-like failed:', error);
        }
    });

    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async function () {
            const icon = this.querySelector('.plus-icon');
            const text = this.querySelector('.action-text');

            try {
                const data = await postToggle(`/api/toggle-favorite/${patternId}/`);

                if (data.status === 'added') {
                    this.classList.add('active');
                    icon.textContent = '✓';
                    text.textContent = 'В избранном';
                } else {
                    this.classList.remove('active');
                    icon.textContent = '+';
                    text.textContent = 'Добавить в избранное';
                }
            } catch (error) {
                console.error('toggle-favorite failed:', error);
            }
        });
    }
});