# FlossFriends - настройка проекта

## Описание
FlossFriends - веб-приложение на Django для учета ниток, создания схем вышивки и публикации паттернов.

## Требования
- Python 3.10+
- SQL Server и установленный ODBC Driver 18 for SQL Server
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

# Linux / MacOS
source FlossFriends_project/.venv/bin/activate
```

### 4. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 5. Настройка `.env`
Скопируйте шаблон:
```bash
copy .env.example .env
```

Заполните в `.env` параметры своей базы данных:
```env
DB_ENGINE=mssql
DB_NAME=Floss_friends
DB_HOST=localhost\SQLEXPRESS
DB_USER=
DB_PASSWORD=
```

Важно:
- `DB_HOST` должен указывать на SQL Server на компьютере пользователя, а не на чужой ПК.
- Если используется именованный экземпляр SQL Server, обычно это что-то вроде `localhost\SQLEXPRESS`.
- Если база еще не создана, сначала создайте пустую базу `Floss_friends` в SQL Server.

### 6. Применение миграций
```bash
cd FlossFriends_project
python manage.py migrate
```

### 7. Загрузка стартовых данных
Если нужны категории, палитры, канва и нитки:
```bash
python manage.py loaddata FlossFriends_project/fixtures/categories.json
python manage.py loaddata FlossFriends_project/fixtures/palettes.json
python manage.py loaddata FlossFriends_project/fixtures/canvas.json
python manage.py loaddata FlossFriends_project/fixtures/threads.json
```

### 8. Создание суперпользователя
```bash
python manage.py createsuperuser
```

### 9. Запуск проекта
```bash
python manage.py runserver
```

Приложение будет доступно по адресу `http://127.0.0.1:8000/`.

## Если миграции падают

### 1. Проверьте `.env`
Чаще всего ошибка связана не с Django, а с неверным подключением к SQL Server:
- неверный `DB_HOST`
- не существует база `DB_NAME`
- SQL Server не запущен
- не установлен `ODBC Driver 18 for SQL Server`

### 2. Убедитесь, что база пустая или новая
Проект рассчитан на применение миграций с нуля. Если в базе уже есть старые таблицы от предыдущих попыток, удалите их или создайте новую пустую базу и выполните миграции снова.

### 3. Проверьте, что миграции не нужно создавать заново
```bash
python manage.py makemigrations --check --dry-run --noinput
```

Если команда пишет `No changes detected`, значит файлы миграций в репозитории актуальны.

### 4. Примените миграции повторно
```bash
python manage.py migrate
```

## Полезные команды
- `python manage.py regenerate_previews` - пересоздать превью изображений
- `python manage.py loaddata FlossFriends_project/fixtures/<file>.json` - загрузить фикстуры

## Структура проекта
- `FlossFriends_project/FlossFriends_django/` - Django settings и маршруты
- `FlossFriends_project/FlossFriends_project/` - основное приложение
- `FlossFriends_project/media/` - пользовательские изображения
- `FlossFriends_project/FlossFriends_project/static/` - статические файлы
