document.addEventListener('DOMContentLoaded', function () {
    const MAX_CATEGORY_SELECTION = 3;
    const confirmModal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    const publishModal = document.getElementById('publishModal');
    const publishModalTitle = document.getElementById('publishModalTitle');
    const publishForm = document.getElementById('publishPatternForm');
    const publishPatternIdInput = document.getElementById('publishPatternId');
    const publishCancelBtn = document.getElementById('publishModalCancel');
    const publishSubmitBtn = document.getElementById('publishModalSubmit');
    const publishError = document.getElementById('publishModalError');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentForm = null;
    const defaultPublishErrorText = publishError?.innerText || 'Выберите от 1 до 3 категорий.';

    function closeAllMenus() {
        document.querySelectorAll('.pattern-menu').forEach((menu) => {
            menu.classList.remove('active');
        });
    }

    function activateTab(targetTab) {
        const targetContent = document.getElementById(`${targetTab}-tab`);
        const targetButton = document.querySelector(`.tab-button[data-tab="${targetTab}"]`);

        if (!targetContent || !targetButton) {
            return;
        }

        tabButtons.forEach((btn) => btn.classList.remove('active'));
        tabContents.forEach((content) => content.classList.remove('active'));
        targetButton.classList.add('active');
        targetContent.classList.add('active');
        closeAllMenus();
    }

    function closeConfirmModal() {
        if (!confirmModal) {
            return;
        }
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open-delete');
        currentForm = null;
    }

    function closePublishModal() {
        if (!publishModal) {
            return;
        }
        publishModal.classList.remove('active');
        document.body.classList.remove('modal-open-publish');

        if (publishError) {
            publishError.classList.remove('active');
        }
    }

    function showPublishError(text) {
        if (!publishError) {
            return;
        }
        publishError.innerText = text;
        publishError.classList.add('active');
    }

    function clearPublishError() {
        if (!publishError) {
            return;
        }
        publishError.innerText = defaultPublishErrorText;
        publishError.classList.remove('active');
    }

    tabButtons.forEach((button) => {
        button.addEventListener('click', function () {
            activateTab(this.getAttribute('data-tab'));
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get('tab');
    if (requestedTab) {
        activateTab(requestedTab);
    }

    if (message) {
        message.innerText = 'Вы уверены, что хотите удалить схему?';
    }

    document.querySelectorAll('.delete').forEach((btn) => {
        btn.addEventListener('click', function (event) {
            event.preventDefault();
            const formId = this.dataset.formId;

            if (formId) {
                currentForm = document.getElementById(formId);
            } else {
                currentForm = this.closest('.pattern-card')?.querySelector('form');
            }

            if (!currentForm || !confirmModal) {
                return;
            }

            confirmModal.classList.add('active');
            document.body.classList.add('modal-open-delete');
            closeAllMenus();
        });
    });

    if (yesBtn) {
        yesBtn.addEventListener('click', function (event) {
            event.preventDefault();
            if (!currentForm) {
                closeConfirmModal();
                return;
            }
            currentForm.submit();
            closeConfirmModal();
        });
    }

    if (noBtn) {
        noBtn.addEventListener('click', closeConfirmModal);
    }

    if (confirmModal) {
        confirmModal.addEventListener('click', function (event) {
            if (event.target === confirmModal) {
                closeConfirmModal();
            }
        });
    }

    document.querySelectorAll('.publish-pattern-btn').forEach((button) => {
        button.addEventListener('click', function (event) {
            event.preventDefault();

            if (!publishModal || !publishForm || !publishPatternIdInput) {
                return;
            }

            const patternId = this.dataset.patternId || '';
            const patternTitle = this.dataset.patternTitle || '';
            const isPublic = this.dataset.isPublic === 'true';
            const selectedCategoriesRaw = this.dataset.selectedCategories || '';
            const selectedCategories = new Set(
                selectedCategoriesRaw
                    .split(',')
                    .map((id) => id.trim())
                    .filter((id) => id.length > 0)
            );

            publishPatternIdInput.value = patternId;
            publishForm.querySelectorAll('input[name="categories"]').forEach((checkbox) => {
                checkbox.checked = selectedCategories.has(checkbox.value);
            });

            if (publishModalTitle) {
                publishModalTitle.innerText = isPublic
                    ? `Изменить публикацию: ${patternTitle}`
                    : `Опубликовать схему: ${patternTitle}`;
            }

            if (publishSubmitBtn) {
                publishSubmitBtn.innerText = isPublic ? 'Сохранить' : 'Опубликовать';
            }

            clearPublishError();

            publishModal.classList.add('active');
            document.body.classList.add('modal-open-publish');
            closeAllMenus();
        });
    });

    if (publishForm) {
        const categoryInputs = publishForm.querySelectorAll('input[name="categories"]');

        if (publishSubmitBtn && categoryInputs.length === 0) {
            publishSubmitBtn.disabled = true;
        }

        categoryInputs.forEach((input) => {
            input.addEventListener('change', function () {
                const checkedCategories = publishForm.querySelectorAll('input[name="categories"]:checked');

                if (this.checked && checkedCategories.length > MAX_CATEGORY_SELECTION) {
                    this.checked = false;
                    showPublishError(`Можно выбрать максимум ${MAX_CATEGORY_SELECTION} категории.`);
                    return;
                }

                clearPublishError();
            });
        });

        publishForm.addEventListener('submit', function (event) {
            const checkedCategories = publishForm.querySelectorAll('input[name="categories"]:checked');
            const patternId = publishPatternIdInput ? publishPatternIdInput.value.trim() : '';

            if (!patternId || checkedCategories.length === 0) {
                event.preventDefault();
                showPublishError('Выберите хотя бы одну категорию.');
                return;
            }

            if (checkedCategories.length > MAX_CATEGORY_SELECTION) {
                event.preventDefault();
                showPublishError(`Можно выбрать максимум ${MAX_CATEGORY_SELECTION} категории.`);
                return;
            }

            clearPublishError();
        });
    }

    if (publishCancelBtn) {
        publishCancelBtn.addEventListener('click', closePublishModal);
    }

    if (publishModal) {
        publishModal.addEventListener('click', function (event) {
            if (event.target === publishModal) {
                closePublishModal();
            }
        });
    }

    document.querySelectorAll('.menu-toggle').forEach((toggle) => {
        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            event.preventDefault();

            const menu = this.closest('.pattern-menu');
            const isActive = menu.classList.contains('active');

            closeAllMenus();
            if (!isActive) {
                menu.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.pattern-menu').forEach((menu) => {
        menu.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    });

    document.addEventListener('click', function () {
        closeAllMenus();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
            return;
        }
        closeAllMenus();
        closeConfirmModal();
        closePublishModal();
    });
});
