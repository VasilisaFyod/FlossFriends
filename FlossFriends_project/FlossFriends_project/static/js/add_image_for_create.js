document.addEventListener("DOMContentLoaded", () => {
    console.log("add_image_for_create.js loaded");

    const tabButtons = document.querySelectorAll(".tab-button")
    const tabContents = document.querySelectorAll(".tab-content")
    const uploadArea = document.getElementById("uploadArea")
    const uploadBtn = document.getElementById("uploadBtn")
    const imageUpload = document.getElementById("imageUpload")  
    const createPatternBtn = document.getElementById("createPatternBtn")
    const createPatternHint = document.getElementById("createPatternHint")
    const previewContainer = document.getElementById("previewContainer")
    const previewImg = document.getElementById("previewImg")
    const fileError = document.getElementById("fileError")  
    const generateAiBtn = document.getElementById("generateAiBtn")
    const promptInput = document.getElementById("promptInput")
    const aiResultContainer = document.getElementById("aiResultContainer")
    const aiGeneratedImage = document.getElementById("aiGeneratedImage")
    const backBtn = document.getElementById("backBtn")
    
    const savedImage = sessionStorage.getItem("tempImage");
    const savedTab = localStorage.getItem("activeTab");

    if (aiResultContainer) {
        aiResultContainer.style.display = "none";
    }

    let lastGeneratedImage = "";

    if (savedTab === "generate" && savedImage && savedImage.startsWith("data:image")) {
        lastGeneratedImage = savedImage;
        if (aiGeneratedImage) aiGeneratedImage.src = savedImage;
        if (aiResultContainer) aiResultContainer.style.display = "block";
    } else if (savedImage && savedTab === "upload") {
        previewImg.src = savedImage;
        previewContainer.style.display = "flex";
    }

    updateCreateButtonState();

    function updateCreateButtonState() {
        if (!createPatternBtn) return;
        const savedImage = sessionStorage.getItem("tempImage");
        const generatedImageReady = Boolean(lastGeneratedImage);
        const uploadedImageReady = Boolean(previewImg?.src);
        createPatternBtn.disabled = !(savedImage || generatedImageReady || uploadedImageReady);
        if (createPatternHint) {
            createPatternHint.style.display = createPatternBtn.disabled ? "block" : "none";
        }
    }

    function setGenerateButtonState(isLoading) {
        if (!generateAiBtn) return;
        generateAiBtn.disabled = isLoading;
        generateAiBtn.textContent = isLoading ? "Генерируем..." : "Сгенерировать";
    }

    async function generateImageFromPrompt(prompt) {
        const trimmedPrompt = (prompt || "").trim();
        if (!trimmedPrompt) {
            alert("Пожалуйста, опишите изображение для генерации.");
            return;
        }

        console.log("AI generate started", { prompt: trimmedPrompt });
        setGenerateButtonState(true);
        try {
            const response = await fetch("/api/generate-ai-image/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },
                body: JSON.stringify({ prompt: trimmedPrompt })
            });

            const contentType = response.headers.get("Content-Type") || "";
            let data;
            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (_) {
                    throw new Error(text || "Не удалось распознать ответ сервера");
                }
            }

            if (!response.ok) {
                const message = (data && data.error) || (data && data.message) || "Ошибка генерации";
                throw new Error(message);
            }

            if (!data.image_url) {
                throw new Error("Сервер не вернул изображение");
            }

            console.log("AI generate success", { image_url: data.image_url, translated_prompt: data.translated_prompt });
            lastGeneratedImage = data.image_url;
            sessionStorage.setItem("tempImage", data.image_url);

            if (aiGeneratedImage) aiGeneratedImage.src = data.image_url;
            if (aiResultContainer) aiResultContainer.style.display = "block";
            updateCreateButtonState();
        } catch (error) {
            console.error("AI generate error", error);
            alert(error.message || "Ошибка генерации изображения.");
        } finally {
            setGenerateButtonState(false);
        }
    }
    
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";")
            for (let cookie of cookies) {
                cookie = cookie.trim()
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                    break
                }
            }
        }
        return cookieValue
    }
    const csrftoken = getCookie("csrftoken")
    
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tab = button.dataset.tab
            tabButtons.forEach(btn => btn.classList.remove("active"))
            tabContents.forEach(content => content.classList.remove("active"))
            button.classList.add("active")
            document.getElementById(tab + "-tab").classList.add("active")
            updateCreateButtonState()
        })
    })
    
    // восстановление вкладки
    if (savedTab) {
        const tabBtn = document.querySelector(`.tab-button[data-tab="${savedTab}"]`);
        if (tabBtn) tabBtn.click();
    }

    uploadBtn.addEventListener("click", () => imageUpload.click())

    backBtn?.addEventListener("click", () => {
        window.history.back()
    })

    function showPreview(file) {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
            fileError.textContent = "Неверный тип файла. Разрешены только PNG, JPG, JPEG, GIF."
            fileError.style.display = "block"
            imageUpload.value = ""
            previewContainer.style.display = "none"
            return
        }

        fileError.style.display = "none"
        const reader = new FileReader()
        reader.onload = function(e) {
            previewImg.src = e.target.result
            previewContainer.style.display = "flex"
            updateCreateButtonState()
        }
        reader.readAsDataURL(file)
    }

    imageUpload.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (!file) return
        showPreview(file)
    })

    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault()
        uploadArea.classList.add("dragover")
    })
    uploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault()
        uploadArea.classList.remove("dragover")
    })
    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault()
        uploadArea.classList.remove("dragover")
        const file = e.dataTransfer.files[0]
        if (file) {
            imageUpload.files = e.dataTransfer.files
            showPreview(file)
        }
    })

    generateAiBtn?.addEventListener("click", async () => {
        await generateImageFromPrompt(promptInput?.value || "");
    });

    // окно загрузки
    createPatternBtn.addEventListener("click", async () => {
        if (createPatternBtn.disabled) {
            return;
        }

        const savedImage = sessionStorage.getItem("tempImage");
        const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;

        if (activeTab === "generate") {
            const aiImageSrc = lastGeneratedImage || aiGeneratedImage?.src || savedImage || "";
            if (!aiImageSrc || !aiImageSrc.startsWith("data:image")) {
                alert("Сначала сгенерируйте изображение.");
                return;
            }
            sessionStorage.setItem("tempImage", aiImageSrc);
            localStorage.setItem("activeTab", "generate");
            window.location.href = "/create_pattern_steps/";
            return;
        }

        // если файл уже загружали и вернулись назад
        if (!imageUpload.files.length && savedImage) {
            window.location.href = "/create_pattern_steps/";
            return;
        }

        // если файла вообще нет
        if (!imageUpload.files.length) {
            alert("Пожалуйста, выберите изображение.");
            return;
        }

        if (activeTab) localStorage.setItem("activeTab", activeTab);

        const formData = new FormData();
        formData.append("image", imageUpload.files[0]);

        try {
            const response = await fetch("/add_image_for_create/", {
                method: "POST",
                headers: { "X-CSRFToken": csrftoken },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem("tempImage", data.image_url);
                window.location.href = "/create_pattern_steps/";
            } else {
                alert(data.error || "Ошибка загрузки изображения.");
            }

        } catch (error) {
            console.error(error);
            alert("Ошибка сети.");
        }

    });

})
