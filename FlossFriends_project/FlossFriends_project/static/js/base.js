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
});