document.addEventListener('DOMContentLoaded', function() {
    const addThreadBtn = document.querySelector('.add-thread-btn');
    if (addThreadBtn) {
        addThreadBtn.addEventListener('click', function() {
            alert('Функция добавления нитки будет реализована позже!');
        });
    }
    
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const threadRow = this.closest('.table-row');
            const threadCode = threadRow.querySelector('.thread-code').textContent;
            const colorName = threadRow.querySelector('.color-name').textContent;
            
            if (confirm(`Удалить нитку "${colorName}" (${threadCode}) из инвентаря?`)) {
                threadRow.style.opacity = '0';
                threadRow.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    threadRow.remove();
                    checkEmptyInventory();
                }, 300);
            }
        });
    });

});