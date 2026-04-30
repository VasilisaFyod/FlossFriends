# FlossFriends - Настройка проекта

## Описание
FlossFriends - веб-приложение на Django для управления инвентарем ниток для вышивки, создания паттернов и сообщества.

## Требования
- Python 3.8+
- MSSQL Server (или другой поддерживаемый Django бэкенд)
- Git

## Установка

### 1. Клонирование репозитория
```bash
git clone <url-репозитория>
cd FlossFriends
```

### 2. Создание виртуального окружения
```bash
python -m venv FlossFriends_project\.venv
```

### 3. Активация виртуального окружения
```bash
# Windows
FlossFriends_project\.venv\Scripts\activate

# Linux/Mac
source FlossFriends_project/.venv/bin/activate
```

### 4. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 5. Настройка переменных окружения
Скопируйте `.env.example` в `.env` и настройте переменные:
```bash
cp .env.example .env
```

Отредактируйте `.env` файл с вашими настройками базы данных и другими параметрами.

### 6. Миграции базы данных
```bash
cd FlossFriends_project
python manage.py migrate
```

**Если возникают ошибки миграций:**
- Убедитесь, что база данных доступна
- Проверьте конфигурацию `.env` файла (особенно DATABASE_* переменные для MSSQL)
- Попробуйте выполнить миграции конкретного приложения:
  ```bash
  python manage.py migrate FlossFriends_project
  ```

### 7. Создание суперпользователя (опционально)
```bash
python manage.py createsuperuser
```

### 8. Запуск сервера разработки
```bash
python manage.py runserver
```

Приложение будет доступно по адресу: http://127.0.0.1:8000/

## Структура проекта
- `FlossFriends_project/` - основное Django приложение
- `FlossFriends_django/` - настройки Django
- `media/` - загруженные файлы (изображения паттернов)
- `static/` - статические файлы (CSS, JS, изображения)

## Основные функции
- Управление инвентарем ниток
- Создание и публикация паттернов вышивки
- Сообщество пользователей
- Аутентификация и профили

## Команды управления
- `python manage.py regenerate_previews` - регенерация превью изображений
- `python manage.py loaddata fixtures/*.json` - загрузка тестовых данных