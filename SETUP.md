# Развёртывание FlossFriends проекта

## Первая установка

### 1. Установка зависимостей
```bash
# Создать виртуальное окружение (если его нет)
python -m venv .venv

# Активировать окружение
.\.venv\Scripts\Activate.ps1  # Для PowerShell
# или
.\.venv\Scripts\activate.bat  # Для cmd

# Установить зависимости
pip install -r requirements.txt

#Перейти в папку приложения
cd FlossFriends_project
```


### 2. Применить миграции Django
```bash
python manage.py migrate

# Если не применяются миграции
python manage.py makemigrations
```

### 3. Загрузить справочные данные (нитки, палитры, холсты)
```bash
python manage.py loaddata palettes
python manage.py loaddata canvas
python manage.py loaddata threads
```

Все фиксчи находятся в папке `FlossFriends_project/fixtures/` и Django найдёт их автоматически.

### 4. Создать суперпользователя (администратора)
```bash
python manage.py createsuperuser
```

### 5. Запустить сервер
```bash
python manage.py runserver
```

Приложение будет доступно по адресу `http://127.0.0.1:8000/`

## Структура fixtures

- **palettes.json** - палитры ниток (DMC, Gamma, и т.д.)
- **canvas.json** - типы полотна (канва) с указанием плотности
- **threads.json** - каталог всех доступных нитей с цветами (RGB, HEX) и кодами

## Загрузка дополнительных данных

Если нужно обновить фиксчи после изменений в БД:

```bash
# Выгрузить данные обратно в JSON
python manage.py dumpdata FlossFriends_project.Palette --indent 2 > FlossFriends_project/fixtures/palettes.json
python manage.py dumpdata FlossFriends_project.Canvas --indent 2 > FlossFriends_project/fixtures/canvas.json
python manage.py dumpdata FlossFriends_project.Thread --indent 2 > FlossFriends_project/fixtures/threads.json
```

Затем закоммитить обновлённые файлы в репозиторий.
