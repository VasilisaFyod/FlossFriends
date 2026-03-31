чтобы запустилось:

1. создать окружение
python -m venv myenv
myenv\Scripts\Activate.ps1

2. установка зависимостей из файла requirements.txt:
python -m pip install -r requirements.txt

3. создать .env файл по шаблону

4. Создать БД с названием Floss_friends
(в идеале сделать отдельный контейнер с настроенной бд сразу)

5. python manage.py migrate
Закинул автосгенерированную миграцию, без нее даже createsuperuser не проходил.

6. python manage.py createsuperuser

7. Дальше подтверждать email непонятно как, через /login видимо пока никак...
зашел через /admin, авторизация проходит
в создании схемы выбираю файл - жму создать - ничего не происходит.
при повторном нажатии:

\FlossFriends_project\views\api_views.py", line 25, in generate_pattern_api
    colors=int(data["colors"]),
           ^^^^^^^^^^^^^^^^^^^
TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'

успех так и не достигнут(