document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('imageUpload').click();
    });

    // Когда выбран файл, можно сразу показать имя (опционально)
document.getElementById('imageUpload').addEventListener('change', function() {
    if(this.files.length > 0){
        console.log('Выбран файл:', this.files[0].name);
    }
});

// Кнопка "Создать схему" сабмитит форму
document.getElementById('createPatternBtn').addEventListener('click', function() {
    document.getElementById('uploadForm').submit();
});