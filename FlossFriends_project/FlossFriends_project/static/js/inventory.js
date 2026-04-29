document.addEventListener('DOMContentLoaded', function() {
    const SKEIN_LENGTH_CM = 800;
    let currentUnit = 'cm'; // 'skeins' or 'cm'
    let isRefreshingFromServer = false;

    function formatSkeins(lengthCm) {
        const skeins = lengthCm / SKEIN_LENGTH_CM;
        if (Number.isInteger(skeins)) {
            return `${skeins} мотков`;
        }
        return `${skeins.toFixed(2).replace(/\.?0+$/, '')} мотка`;
    }

    function updateQuantities() {
        document.querySelectorAll('.quantity-value').forEach(container => {
            const input = container.querySelector('.quantity-input');
            const unitLabel = container.querySelector('.quantity-unit-label');
            const display = container.querySelector('.quantity-display');
            const lengthCm = parseInt(display?.dataset.lengthCm || input?.dataset.lengthCm || '0', 10);

            if (input) {
                input.value = lengthCm;
                input.dataset.lengthCm = lengthCm;
                input.style.display = currentUnit === 'cm' ? 'inline-block' : 'none';
            }

            if (unitLabel) {
                unitLabel.style.display = currentUnit === 'cm' ? 'inline-block' : 'none';
            }

            if (display) {
                display.dataset.lengthCm = lengthCm;
                display.textContent = currentUnit === 'skeins'
                    ? formatSkeins(lengthCm)
                    : `${lengthCm} см`;
                display.style.display = currentUnit === 'skeins' ? 'inline-block' : 'none';
            }
        });
    }

    async function refreshInventorySnapshot() {
        if (isRefreshingFromServer) return;
        isRefreshingFromServer = true;

        try {
            const response = await fetch('/api/inventory-threads/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });
            if (!response.ok) throw new Error('Inventory refresh failed');

            const data = await response.json();
            const serverThreads = Array.isArray(data.threads) ? data.threads : [];
            const serverMap = new Map(serverThreads.map(thread => [String(thread.thread_id), thread]));
            const localInputs = Array.from(document.querySelectorAll('.quantity-input'));
            const localIds = localInputs.map(input => String(input.dataset.threadId));

            const hasDifferentSet =
                localIds.length !== serverThreads.length ||
                localIds.some(id => !serverMap.has(id));

            if (hasDifferentSet) {
                window.location.reload();
                return;
            }

            localInputs.forEach(input => {
                const thread = serverMap.get(String(input.dataset.threadId));
                if (!thread) return;

                const quantityValue = input.closest('.quantity-value');
                const display = quantityValue?.querySelector('.quantity-display');
                const nextLength = Math.max(0, Math.round(Number(thread.length_cm || 0)));

                input.dataset.lengthCm = nextLength;
                input.value = nextLength;
                if (display) {
                    display.dataset.lengthCm = nextLength;
                }
            });

            updateQuantities();
        } catch (error) {
            console.error('Ошибка обновления инвентаря:', error);
        } finally {
            isRefreshingFromServer = false;
        }
    }

    function saveQuantity(threadId, quantityCm, quantityDisplay, quantityInput) {
        const normalizedQuantity = Number.isFinite(quantityCm) ? Math.max(0, Math.round(quantityCm)) : 0;

        return fetch(`/update_quantity/${threadId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: `quantity_cm=${normalizedQuantity}`
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error('Ошибка обновления количества');
            }

            if (quantityDisplay) {
                quantityDisplay.dataset.lengthCm = data.length_cm;
            }
            if (quantityInput) {
                quantityInput.dataset.lengthCm = data.length_cm;
            }
            updateQuantities();
        });
    }

function toggleActive(activeId) {
        document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
        const activeButton = document.getElementById(activeId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Обработчики для переключателя единиц
    const skeinsButton = document.getElementById('unit-skeins');
    const cmButton = document.getElementById('unit-cm');

    skeinsButton?.addEventListener('click', () => {
        currentUnit = 'skeins';
        updateQuantities();
        toggleActive('unit-skeins');
    });

    cmButton?.addEventListener('click', () => {
        currentUnit = 'cm';
        updateQuantities();
        toggleActive('unit-cm');
    });

    updateQuantities();
    refreshInventorySnapshot();
    window.addEventListener('pageshow', refreshInventorySnapshot);

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('blur', function () {
            const threadId = this.dataset.threadId;
            const quantityDisplay = this.closest('.quantity-value')?.querySelector('.quantity-display');
            const nextValue = parseInt(this.value || '0', 10);

            saveQuantity(threadId, nextValue, quantityDisplay, this).catch(error => {
                console.error('Error:', error);
                alert('Ошибка обновления количества');
                updateQuantities();
            });
        });

        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.blur();
            }
        });
    });

    const confirmModal = document.getElementById("confirmModal");
    const message = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    if (message) {
        message.innerText = "Вы уверены, что хотите удалить нитку?";
    }
    let currentFormId = null;

    // навешиваем на все кнопки удаления
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFormId = this.dataset.formId; // получаем id формы
            if (confirmModal) {
                confirmModal.classList.add("active");
            }
        });
    });

    yesBtn?.addEventListener('click', function() {
        if (currentFormId) {
            const form = document.getElementById(currentFormId);
            if (form) {
                form.submit();
                if (confirmModal) {
                    confirmModal.classList.remove("active");
                }
            } else {
                console.error("Форма с id", currentFormId, "не найдена!");
            }
        }
    });

    noBtn?.addEventListener('click', function() {
        if (confirmModal) {
            confirmModal.classList.remove("active");
        }
    });
    const modal = document.getElementById("addThreadModal");
    const openBtn = document.getElementById("add-thread");
    const cancelBtn = document.getElementById("cancelThreadBtn");
    const input = document.getElementById("threadCodeInput");
    const preview = document.getElementById("previewColor");
    const form = modal?.closest("form");

    if (!modal || !openBtn || !cancelBtn || !input || !preview || !form) {
        return;
    }

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
        document.body.classList.add("modal-open");
        preview.style.backgroundColor = "#fff";
        preview.classList.add("not-found");
        errorBlock.textContent = "";
        input.value = "";
        valid = false;
    });

    // закрыть модалку
    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.classList.remove("modal-open");
        preview.style.backgroundColor = "#fff";
        preview.classList.add("not-found");
        errorBlock.textContent = "";
        input.value = "";
        valid = false;
    });

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
            preview.style.backgroundColor = "#fff";
            preview.classList.add("not-found");
            errorBlock.textContent = "";
            input.value = "";
            valid = false;
        }
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

    // обработчики для изменения количества
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const threadId = e.target.dataset.threadId;
            const isPlus = e.target.classList.contains('plus-btn');
            const quantityValue = e.target.parentElement.querySelector('.quantity-value');
            const quantityDisplay = quantityValue?.querySelector('.quantity-display');
            const quantityInput = quantityValue?.querySelector('.quantity-input');
            let currentLengthCm = parseInt(quantityDisplay?.dataset.lengthCm || quantityInput?.dataset.lengthCm || '0', 10);
            const step = currentUnit === 'skeins' ? SKEIN_LENGTH_CM : 1;

            if (isPlus) {
                currentLengthCm += step;
            } else {
                currentLengthCm = Math.max(0, currentLengthCm - step);
            }

            saveQuantity(threadId, currentLengthCm, quantityDisplay, quantityInput).catch(error => {
                console.error('Error:', error);
                alert('Ошибка сети');
            });
        }
    });

});
