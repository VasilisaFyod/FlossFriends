document.addEventListener("DOMContentLoaded", () => {
    const toggleButtons = document.querySelectorAll(".password-toggle");

    toggleButtons.forEach((button) => {
        const inputId = button.getAttribute("data-target");
        const showIcon = button.getAttribute("data-show-icon");
        const hideIcon = button.getAttribute("data-hide-icon");
        const icon = button.querySelector("img");
        const input = document.getElementById(inputId);
        if (!input) {
            return;
        }

        button.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            if (icon && showIcon && hideIcon) {
                icon.src = isPassword ? hideIcon : showIcon;
            }
            button.setAttribute(
                "aria-label",
                isPassword ? "Скрыть пароль" : "Показать пароль"
            );
        });
    });
});
