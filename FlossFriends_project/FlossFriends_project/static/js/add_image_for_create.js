document.addEventListener("DOMContentLoaded", () => {

    const tabButtons = document.querySelectorAll(".tab-button")
    const tabContents = document.querySelectorAll(".tab-content")
    const uploadArea = document.getElementById("uploadArea")
    const uploadBtn = document.getElementById("uploadBtn")
    const imageUpload = document.getElementById("imageUpload")  
    const createPatternBtn = document.getElementById("createPatternBtn")
    const previewContainer = document.getElementById("previewContainer")
    const previewImg = document.getElementById("previewImg")
    const fileError = document.getElementById("fileError")
    
    // AI элементы
    const generateAiBtn = document.getElementById("generateAiBtn")
    const promptInput = document.getElementById("promptInput")
    const aiGeneratedImage = document.getElementById("aiGeneratedImage")
    const aiResultContainer = document.getElementById("aiResultContainer")
    const useAiImageBtn = document.getElementById("useAiImageBtn")
    const regenerateBtn = document.getElementById("regenerateBtn")
    
    let currentGeneratedBlob = null
    
    const savedImage = sessionStorage.getItem("tempImage"); 
    if (savedImage) {
        previewImg.src = savedImage;
        previewContainer.style.display = "flex";
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
        })
    })
    
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) {
        const tabBtn = document.querySelector(`.tab-button[data-tab="${savedTab}"]`);
        if (tabBtn) tabBtn.click();
    }

    uploadBtn.addEventListener("click", () => imageUpload.click())

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

    // Функция генерации через бэкенд
    async function generateImageWithHuggingFace(prompt) {
    const response = await fetch("/generate-image/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка генерации");
    }
    
    const result = await response.blob();
    return result;
}

    // Генерация изображения
    async function generateImage() {
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            alert("Пожалуйста, введите описание изображения");
            return;
        }

        aiResultContainer.style.display = "block";
        const originalText = generateAiBtn.textContent;
        generateAiBtn.textContent = "Генерация...";
        generateAiBtn.disabled = true;
        regenerateBtn.disabled = true;
        aiGeneratedImage.style.opacity = "0.5";

        try {
            const blob = await generateImageWithHuggingFace(prompt);
            currentGeneratedBlob = blob;
            
            const imageUrl = URL.createObjectURL(blob);
            aiGeneratedImage.src = imageUrl;
            aiGeneratedImage.style.opacity = "1";
            
        } catch (error) {
            console.error("Ошибка генерации:", error);
            alert("Ошибка при генерации изображения: " + error.message);
        } finally {
            generateAiBtn.textContent = originalText;
            generateAiBtn.disabled = false;
            regenerateBtn.disabled = false;
        }
    }

    // Использовать сгенерированное изображение
    function useGeneratedImage() {
        if (!currentGeneratedBlob) {
            alert("Сначала сгенерируйте изображение");
            return;
        }

        const file = new File([currentGeneratedBlob], "ai_generated.png", { type: "image/png" });
        
        showPreview(file);
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageUpload.files = dataTransfer.files;
        
        const uploadTab = document.querySelector('.tab-button[data-tab="upload"]');
        if (uploadTab) uploadTab.click();
    }

    // Обработчики событий для AI
    if (generateAiBtn) {
        generateAiBtn.addEventListener("click", generateImage);
    }
    
    if (regenerateBtn) {
        regenerateBtn.addEventListener("click", generateImage);
    }
    
    if (useAiImageBtn) {
        useAiImageBtn.addEventListener("click", useGeneratedImage);
    }

    // Создание схемы
    createPatternBtn.addEventListener("click", async () => {
        const savedImage = sessionStorage.getItem("tempImage");

        if (!imageUpload.files.length && savedImage) {
            window.location.href = "/create_pattern_steps/";
            return;
        }

        if (!imageUpload.files.length) {
            alert("Пожалуйста, выберите или сгенерируйте изображение.");
            return;
        }

        const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;
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
                window.location.href = "/add_image_for_create/";
            } else {
                alert(data.error || "Ошибка загрузки изображения.");
            }

        } catch (error) {
            console.error(error);
            alert("Ошибка сети.");
        }
    });

})