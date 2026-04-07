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
```

### 2. Создать таблицы create.sql

### 3. Загрузить справочные данные (нитки, палитры, холсты) из data.sql

### 4. Создать суперпользователя (администратора)
```bash
python manage.py createsuperuser
```

### 5. Запустить разработческий сервер
```bash
python manage.py runserver
```

Приложение будет доступно по адресу `http://127.0.0.1:8000/`