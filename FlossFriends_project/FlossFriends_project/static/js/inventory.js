document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('.table-body').addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;

        const threadRow = deleteBtn.closest('.table-row');
        const threadCode = threadRow.querySelector('.thread-code').textContent;

        showConfirm(`Удалить нитку (${threadCode}) из инвентаря?`, function() {
        });
    });

    const addThreadBtn = document.getElementById('add-thread');
    const addThreadModal = document.getElementById('addThreadModal');
    const cancelThreadBtn = document.getElementById('cancelThreadBtn');
    const saveThreadBtn = document.getElementById('saveThreadBtn');

    addThreadBtn.addEventListener('click', () => {
        addThreadModal.classList.add('active');
        document.body.classList.add('modal-open');
    });

    cancelThreadBtn.addEventListener('click', () => {
        addThreadModal.classList.remove('active');
        document.body.classList.remove('modal-open');

    });

    saveThreadBtn.addEventListener('click', () => {
        addThreadModal.classList.remove('active');
        document.body.classList.remove('modal-open');

    });

});
