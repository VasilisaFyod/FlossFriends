document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const mainContent = document.getElementById('mainContent');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.add('open');
        mainContent.classList.add('sidebar-open');
    });
    
    sidebarClose.addEventListener('click', function() {
        sidebar.classList.remove('open');
        mainContent.classList.remove('sidebar-open');
    });
    
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && 
            !sidebarToggle.contains(event.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
        }
    });

    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    let confirmCallback = null;

    window.showConfirm = function(message, callback) {
        confirmMessage.textContent = message;
        confirmModal.classList.add('active');
        document.body.classList.add('modal-open-delete');
        confirmCallback = callback;
    };

    function closeConfirm() {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open-delete');
        confirmCallback = null;
    }

    confirmYes.addEventListener('click', function() {
        if (confirmCallback) confirmCallback();
        closeConfirm();
    });

    confirmNo.addEventListener('click', closeConfirm);

    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            closeConfirm();
        }
    });

});