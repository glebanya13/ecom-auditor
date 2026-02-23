"""
Конфигурация pytest для E-Com Auditor 2026.
Заглушки переменных окружения для запуска тестов без .env файла.
"""
import os
import sys

# Добавляем корень backend в PYTHONPATH
sys.path.insert(0, os.path.dirname(__file__))

# Устанавливаем переменные окружения до импорта settings,
# чтобы тесты работали без реального .env файла.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-minimum-32-chars!")
os.environ.setdefault("AES_ENCRYPTION_KEY", "test-aes-key-for-unit-tests-32chars!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("DB_PASSWORD", "testpassword")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "123456:ABC-test-token")
