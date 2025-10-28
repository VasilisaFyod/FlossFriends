document.addEventListener('DOMContentLoaded', function() {
    const likeBtn = document.querySelector('.like-btn');
    const likeCount = document.querySelector('.action-count');
    
    likeBtn.addEventListener('click', function() {
        let count = parseInt(likeCount.textContent);
        
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            count--;
            this.style.background = 'rgba(231, 76, 60, 0.1)';
            showNotification('Лайк удален', 'info');
        } else {
            this.classList.add('active');
            count++;
            this.style.background = 'rgba(231, 76, 60, 0.2)';
            showNotification('Схема понравилась!', 'success');
        }
        
        likeCount.textContent = count;
    });
    
    const favoriteBtn = document.querySelector('.favorite-btn');
    
    favoriteBtn.addEventListener('click', function() {
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.innerHTML = '<span class="plus-icon">+</span><span class="action-text">Добавить в избранное</span>';
            this.style.background = 'rgba(39, 174, 96, 0.1)';
            showNotification('Удалено из избранного', 'info');
        } else {
            this.classList.add('active');
            this.innerHTML = '<span class="check-icon">✓</span><span class="action-text">В избранном</span>';
            this.style.background = 'rgba(39, 174, 96, 0.2)';
            showNotification('Добавлено в избранное!', 'success');
        }
    });
    
    const commentForm = document.querySelector('.comment-form');
    const commentInput = document.querySelector('.comment-input');
    const commentsList = document.querySelector('.comments-list');
    const commentsCount = document.querySelector('.comments-count');
    
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const commentText = commentInput.value.trim();
        
        if (commentText) {
            addNewComment(commentText);
            commentInput.value = '';
            updateCommentsCount(1);
            showNotification('Комментарий добавлен', 'success');
        }
    });
    
    function addNewComment(text) {
        const newComment = document.createElement('div');
        newComment.className = 'comment-item';
        newComment.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">Вы</span>
                <span class="comment-date">только что</span>
            </div>
            <p class="comment-text">${text}</p>
        `;
        
        commentsList.insertBefore(newComment, commentsList.firstChild);
    }
    
    function updateCommentsCount(increment) {
        const currentCount = parseInt(commentsCount.textContent.replace(/[()]/g, ''));
        commentsCount.textContent = `(${currentCount + increment})`;
    }
    
    function showNotification(message, type) {
        console.log(`${type}: ${message}`);
    }
});