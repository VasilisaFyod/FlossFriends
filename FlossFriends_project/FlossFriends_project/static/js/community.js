document.addEventListener('DOMContentLoaded', function() {

    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const heartIcon = this.querySelector('.heart-icon');
            const patternTitle = this.closest('.pattern-card').querySelector('.pattern-title').textContent;
            
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                heartIcon.textContent = '♡';
                heartIcon.style.color = '';
            } else {
                this.classList.add('active');
                heartIcon.textContent = '♥';
                heartIcon.style.color = '#e74c3c';
            }
        });
    });
    
    const addToInventoryButtons = document.querySelectorAll('.add-to-inventory');
    
    addToInventoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plusIcon = this.querySelector('.plus-icon-favorite');
            const patternTitle = this.closest('.pattern-card').querySelector('.pattern-title').textContent;
            
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                plusIcon.textContent = '+';
                plusIcon.style.color = '';
                showNotification(`Схема "${patternTitle}" удалена из избранного`, 'info');
            } else {
                this.classList.add('active');
                plusIcon.textContent = '+';
                plusIcon.style.color = '#5B7765';
                showNotification(`Схема "${patternTitle}" добавлена в избранное!`, 'success');
            }
        });
    });
    
    const searchButton = document.querySelector('.search-btn');
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#5B7765' : '#666565ff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(100%);    
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});