from .settings import *

from django.db.backends.signals import connection_created


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

MEDIA_ROOT = BASE_DIR / "test_media"


def _register_sqlite_collations(sender, connection, **kwargs):
    if connection.vendor != "sqlite":
        return

    def cyrillic_general_ci_as(value1, value2):
        left = (value1 or "").casefold()
        right = (value2 or "").casefold()
        if left < right:
            return -1
        if left > right:
            return 1
        return 0

    connection.connection.create_collation("Cyrillic_General_CI_AS", cyrillic_general_ci_as)


connection_created.connect(_register_sqlite_collations)
