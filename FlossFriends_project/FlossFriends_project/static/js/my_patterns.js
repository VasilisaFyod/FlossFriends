document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function closeAllMenus() {
        document.querySelectorAll('.pattern-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    function handleToggleClick(event) {
        event.stopPropagation(); 
        const menu = this.closest('.pattern-menu');
        const isActive = menu.classList.contains('active');

        closeAllMenus(); 

        if (!isActive) {
            menu.classList.add('active'); 
        }
    }

    function initMenuHandlers() {
        document.querySelectorAll('.menu-toggle').forEach(toggle => {
            toggle.removeEventListener('click', handleToggleClick);
            toggle.addEventListener('click', handleToggleClick);
        });
    }

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

    document.addEventListener('click', function() {
        closeAllMenus();
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
