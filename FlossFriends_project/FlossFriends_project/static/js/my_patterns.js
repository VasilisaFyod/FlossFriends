document.addEventListener('DOMContentLoaded', function() {
    const confirmModal = document.getElementById("confirmModal");
    const message = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    message.innerText = "Вы уверены, что хотите удалить схему?";
    let currentFormId = null;

   document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFormId = this.dataset.formId; 
            confirmModal.classList.add("active");
        });
    });

    yesBtn.addEventListener('click', function() {
        if (currentFormId) {
            const form = document.getElementById(currentFormId);
            if (form) {
                form.submit();
                confirmModal.classList.remove("active");
            } else {
                console.error("Форма с id", currentFormId, "не найдена!");
            }
        }
    });

    noBtn.addEventListener('click', function() {
        confirmModal.classList.remove("active");
    });
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function closeAllMenus() {
        document.querySelectorAll('.pattern-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    // обработка меню ⋮
    document.querySelectorAll('.menu-toggle').forEach(toggle => {
        toggle.addEventListener('click', function (event) {
            event.stopPropagation();

            const menu = this.closest('.pattern-menu');
            const isActive = menu.classList.contains('active');

            closeAllMenus();

            if (!isActive) {
                menu.classList.add('active');
            }
        });
    });

    // переключение вкладок
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

    // клик вне — закрывает меню
    document.addEventListener('click', function() {
        closeAllMenus();
    });

    // Esc закрывает
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllMenus();
        }
    });

});
