document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            closeAllMenus();
        });
    });
    
    function initMenuHandlers() {
        const menuToggles = document.querySelectorAll('.menu-toggle');
        
        menuToggles.forEach(toggle => {
            toggle.removeEventListener('click', handleMenuClick);
            toggle.addEventListener('click', handleMenuClick);
        });
    }
    
    function handleMenuClick(event) {
        event.stopPropagation();
        const menu = this.closest('.pattern-menu');
        
        closeAllMenus();
        
        if (menu.classList.contains('active')) {
            menu.classList.remove('active');
        } else {
            menu.classList.add('active');
        }
    }
    
    function closeAllMenus() {
        document.querySelectorAll('.pattern-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    }
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.pattern-menu')) {
            closeAllMenus();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllMenus();
        }
    });
    
    initMenuHandlers();
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (mutation.target.classList.contains('active')) {
                    setTimeout(initMenuHandlers, 50);
                }
            }
        });
    });
    
    tabContents.forEach(content => {
        observer.observe(content, { attributes: true });
    });
});