"""
Django settings for PROTOTIPO sandbox.
"""
import os
import random
import string
from pathlib import Path

from dotenv import load_dotenv
from str2bool import str2bool

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = "".join(random.choice(string.ascii_lowercase) for _ in range(32))

DEBUG = str2bool(os.environ.get("DEBUG"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "DEVELOPMENT")
BASE_URL = os.getenv("BASE_URL", "http://localhost:5091")

ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5091",
    "http://127.0.0.1:5091",
    BASE_URL,
]
X_FRAME_OPTIONS = "SAMEORIGIN"

INSTALLED_APPS = [
    "admin_datta.apps.AdminDattaConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "home",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

HOME_TEMPLATES = os.path.join(BASE_DIR, "templates")

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [HOME_TEMPLATES],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.context_processors.environment",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

DB_ENGINE = os.getenv("DB_ENGINE", None)
DB_USERNAME = os.getenv("MYSQL_USER", None)
DB_PASS = os.getenv("MYSQL_PASSWORD", None)
DB_HOST = os.getenv("DB_HOST", None)
DB_PORT = os.getenv("DB_PORT", None)
DB_NAME = os.getenv("MYSQL_DATABASE", None)

if DB_ENGINE and DB_NAME and DB_USERNAME:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends." + DB_ENGINE,
            "NAME": DB_NAME,
            "USER": DB_USERNAME,
            "PASSWORD": DB_PASS,
            "HOST": DB_HOST,
            "PORT": DB_PORT,
        },
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-CL"
TIME_ZONE = "America/Santiago"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)

# Simple storage for sandbox / first boot (avoid Manifest missing-file errors)
STORAGES = {
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_URL = "/login"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/login"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
