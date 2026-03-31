document.addEventListener("DOMContentLoaded", function () {

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
