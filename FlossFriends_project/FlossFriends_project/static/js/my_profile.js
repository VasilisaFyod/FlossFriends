document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("profile-password");
    if (passwordInput) {
        const expectedPassword = passwordInput.dataset.formPassword || "";
        const keepServerValue = () => {
            if (passwordInput.value !== expectedPassword) {
                passwordInput.value = expectedPassword;
            }
        };

        keepServerValue();
        requestAnimationFrame(keepServerValue);
        setTimeout(keepServerValue, 120);
    }

    function openDeleteModal() {
        const modal = document.getElementById("confirmModal");
        const message = document.getElementById("confirmMessage");
        const yesBtn = document.getElementById("confirmYes");
        const noBtn = document.getElementById("confirmNo");

        message.innerText = "Вы уверены, что хотите удалить профиль?";

        modal.classList.add("active");

        yesBtn.onclick = function () {
            document.getElementById("deleteForm").submit();
        };

        noBtn.onclick = function () {
            modal.classList.remove("active");
        };
    }


    // делаем глобальной
    window.openDeleteModal = openDeleteModal;
    
    function openExitModal() {
        const modal = document.getElementById("confirmModal");
        const message = document.getElementById("confirmMessage");
        const yesBtn = document.getElementById("confirmYes");
        const noBtn = document.getElementById("confirmNo");

        message.innerText = "Вы уверены, что хотите выйти?";

        modal.classList.add("active");

        yesBtn.onclick = function () {
            document.getElementById("exitForm").submit();
        };

        noBtn.onclick = function () {
            modal.classList.remove("active");
        };
    }


    // делаем глобальной
    window.openExitModal = openExitModal;

});
