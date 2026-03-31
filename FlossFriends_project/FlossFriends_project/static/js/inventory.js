document.addEventListener('DOMContentLoaded', function() {
    const confirmModal = document.getElementById("confirmModal");
    const message = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    message.innerText = "Вы уверены, что хотите удалить нитку?";
    let currentFormId = null;

    // навешиваем на все кнопки удаления
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFormId = this.dataset.formId; // получаем id формы
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
    const modal = document.getElementById("addThreadModal");
    const openBtn = document.getElementById("add-thread");
    const cancelBtn = document.getElementById("cancelThreadBtn");
    const input = document.getElementById("threadCodeInput");
    const preview = document.getElementById("previewColor");
    const form = modal.querySelector("form");

    // <p> для отображения ошибки
    let errorBlock = document.getElementById("modalError");
    if (!errorBlock) {
        errorBlock = document.createElement("p");
        errorBlock.id = "modalError";
        errorBlock.className = "modal-error";
        form.insertBefore(errorBlock, form.querySelector(".modal-buttons"));
    }

    let valid = false; // флаг корректности кода

    // открыть модалку
    openBtn.addEventListener("click", () => {
        modal.classList.add("active");
        preview.style.backgroundColor = "#fff";
        preview.classList.add("not-found");
        errorBlock.textContent = "";
        input.value = "";
        valid = false;
    });

    // закрыть модалку
    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        preview.style.backgroundColor = "#fff";
        preview.classList.add("not-found");
        errorBlock.textContent = "";
        input.value = "";
        valid = false;
    });

    // проверка кода нитки и окрашивание кружочка
    input.addEventListener("input", function () {
        const code = input.value.trim();

        if (!code) {
            preview.style.backgroundColor = "#fff";
            preview.classList.add("not-found");
            valid = false;
            errorBlock.textContent = "Введите код нитки!";
            return;
        }

        fetch(`/get_thread_color/?code=${encodeURIComponent(code)}`)
            .then(res => res.json())
            .then(function(data) {
                if (data.hex) {
                    preview.style.backgroundColor = data.hex;
                    preview.classList.remove("not-found");
                    valid = true;
                    errorBlock.textContent = "";
                } else {
                    preview.style.backgroundColor = "#fff";
                    preview.classList.add("not-found");  
                    valid = false;
                    errorBlock.textContent = "Нитка не найдена!";
                }
            })
            .catch(err => {
                console.error(err);
                preview.style.backgroundColor = "#fff";
                preview.classList.add("not-found");
                valid = false;
                errorBlock.textContent = "Ошибка при проверке нитки!";
            });

    });

    // отменяем отправку формы, если код невалидный
    form.addEventListener("submit", function (e) {
        if (!valid) {
            e.preventDefault();
            errorBlock.textContent = "Введите корректный код нитки!";
        }
    });

});
