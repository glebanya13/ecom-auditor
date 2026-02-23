# E-Com Auditor — Project Context

> Быстрый справочник для Claude. Обновляй по мере изменений.

---

## Стек

| Слой | Технология |
|---|---|
| Backend | FastAPI (Python 3.10), SQLAlchemy ORM, Alembic (миграции не настроены — ALTER TABLE вручную) |
| Frontend | Next.js 14 (Pages Router), TypeScript, Tailwind CSS |
| БД | PostgreSQL 14 (Docker) |
| Кэш | Redis 6 (Docker) |
| Контейнеры | Docker Compose |
| Аутентификация | JWT + AES шифрование API ключей (passlib + bcrypt 3.2.2) |
| Маркетплейсы | Wildberries Seller API, Ozon Seller API |

---

## Структура проекта

```
audit/
├── backend/              FastAPI приложение
│   ├── app/
│   │   ├── api/          Эндпоинты (auth.py, products.py, audit.py, legal.py, admin.py)
│   │   ├── core/         Config, database, security, rate_limit
│   │   ├── models/       SQLAlchemy модели (user, product, audit_log, legal_doc, ticket)
│   │   ├── schemas/      Pydantic схемы
│   │   ├── services/     Бизнес-логика (wildberries, ozon, audit_engine, pdf, chestnyznak, rosaccreditation)
│   │   └── main.py       FastAPI app, роутеры
│   ├── scripts/
│   │   ├── init_db.py    Создание таблиц + seed тестовых данных (SQLite dev, НЕ Docker Postgres)
│   │   └── create_admin.py  Создание admin пользователя
│   ├── tests/            pytest тесты (306 штук)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             Next.js приложение
│   ├── src/pages/        Страницы (dashboard.tsx, login.tsx, register.tsx, index.tsx, ...)
│   │   └── dashboard/    (products/, analytics.tsx, settings.tsx, admin/)
│   ├── src/components/   (DashboardLayout.tsx, AdminLayout.tsx, Icons.tsx)
│   └── next.config.js    Proxy: /api/* → http://localhost:8000/api/*
├── telegram_bot/         Telegram бот (bot.py)
├── docs/                 API.md, DEPLOYMENT.md
├── .claude/              Контекст для Claude (этот файл + launch.json)
├── docker-compose.yml    PostgreSQL + Redis + Backend + Nginx
├── .env                  Секреты (gitignored)
├── .env.example          Шаблон .env
└── Makefile              Команды запуска
```

---

## Docker

### Запущенные контейнеры (prod-режим на localhost)
| Контейнер | Порт | Описание |
|---|---|---|
| `ecom_auditor_db` | 5432 | PostgreSQL 14 |
| `ecom_auditor_redis` | 6379 | Redis 6 |
| `ecom_auditor_backend` | 8000 | FastAPI (volume-mount + --reload) |

### Полезные команды
```bash
# Запуск всего
docker compose up -d

# Только бэкенд (пересборка после изменения requirements.txt)
docker compose build backend && docker compose up -d backend

# Логи бэкенда (live)
docker logs -f ecom_auditor_backend

# Консоль PostgreSQL
docker exec -it ecom_auditor_db psql -U ecom_user -d ecom_auditor

# Создать таблицы в Docker Postgres
docker exec ecom_auditor_backend python3 scripts/init_db.py create

# Создать admin пользователя
docker exec ecom_auditor_backend python3 scripts/create_admin.py
```

### Фронтенд (dev режим)
```bash
cd frontend && npm run dev   # http://localhost:3000
# Прокси: /api/* → localhost:8000
```

---

## Переменные окружения (.env)

Файл в корне проекта, используется docker-compose:

```
DATABASE_URL=postgresql://ecom_user:ecom_password@db:5432/ecom_auditor
DB_USER=ecom_user
DB_PASSWORD=ecom_password
DB_NAME=ecom_auditor

SECRET_KEY=<min 32 chars>
AES_ENCRYPTION_KEY=<min 32 chars>
ACCESS_TOKEN_EXPIRE_MINUTES=1440

WILDBERRIES_API_KEY=     # Глобальный WB ключ (fallback)
OZON_CLIENT_ID=          # Глобальный Ozon Client ID (fallback)
OZON_API_KEY=            # Глобальный Ozon API ключ (fallback)

TELEGRAM_BOT_TOKEN=
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
ENVIRONMENT=development
DEBUG=True
```

> **Важно:** Пользовательские API ключи хранятся зашифрованными в таблице `users` (AES). Глобальные ключи — только fallback.

---

## База данных

### Подключение
```
host: localhost, port: 5432
db: ecom_auditor, user: ecom_user, password: ecom_password
```

### Ключевые таблицы
```sql
users           -- id, email, hashed_password, ozon_api_key (encrypted), wb_api_key (encrypted), ozon_client_id
products        -- id, user_id, sku_id, marketplace, name, current_price, rating, shadow_ban_detected, certificate_expired, marking_issues, ...
audit_logs      -- id, product_id, user_id, audit_type, status, result_json, created_at
legal_docs      -- id, user_id, document_type, content, created_at
tickets         -- id, user_id, subject, status, messages (поддержка)
```

### Тестовые пользователи
| Email | Пароль | Роль | API ключи |
|---|---|---|---|
| `test@example.com` | `test123` | user | нет |
| `glebanya.com@gmail.com` | `s%h+bkRhK2FceMS` | admin | нет |
| `gleb.shersh@gmail.com` | (личный) | user | Ozon: client_id=70621719 (ключ протух) |

---

## API эндпоинты

Base URL: `http://localhost:8000/api/v1`

| Method | Path | Описание |
|---|---|---|
| POST | `/auth/login` | OAuth2 form login → JWT token |
| GET | `/auth/me` | Профиль текущего пользователя |
| PATCH | `/auth/me` | Обновить профиль, API ключи, пароль |
| POST | `/auth/logout` | Инвалидировать токен |
| GET | `/products` | Список товаров пользователя |
| POST | `/products` | Добавить товар (sku_id + marketplace) |
| POST | `/products/validate` | Проверить существование SKU на маркетплейсе |
| POST | `/products/import` | Импорт всех товаров из WB/Ozon каталога |
| POST | `/products/{id}/refresh` | Обновить данные товара из API |
| DELETE | `/products/{id}` | Удалить товар |
| POST | `/audit/run/{product_id}` | Запустить аудит товара |
| GET | `/audit/history` | История аудитов |

---

## Сервисы маркетплейсов

### Wildberries (`backend/app/services/wildberries.py`)
- `check_sku_exists(sku_id)` — проверка товара
- `get_product_list()` — список всех товаров продавца (offset pagination, WB Discounts API)
  - Возвращает `"__auth_error__"` при 401
  - Возвращает `[]` если нет товаров
- `get_product_info(sku_id)`, `get_product_prices(sku_id)`

### Ozon (`backend/app/services/ozon.py`)
- `check_sku_exists(sku_id)` — пробует `offer_id`, потом `product_id` если числовой
- `get_product_list()` — список товаров продавца (cursor pagination, `/v3/product/list`)
  - Возвращает `"__auth_error__"` при code=5 или 401/403
  - Возвращает `[]` если нет товаров
- Важно: Ozon Seller API возвращает только СВОИ товары (не чужие)

---

## Известные особенности и фиксы

### bcrypt совместимость
`bcrypt 4.x` несовместим с `passlib 1.7.4` — используем `bcrypt==3.2.2` в `requirements.txt`.
Причина: passlib использует 77-байтный тест-пароль в `detect_wrap_bug`, bcrypt 4+ отклоняет >72 байт.

### Ozon SKU vs product_id
URL `ozon.ru/product/name-{ID}` содержит `product_id` (Ozon internal), не `offer_id` (артикул продавца).
`check_sku_exists` пробует `offer_id` → если числовой → пробует `product_id`.

### Миграции БД
Alembic не используется. При добавлении колонок в модели — нужен вручную `ALTER TABLE`.
Таблицы создаются: `docker exec ecom_auditor_backend python3 scripts/init_db.py create`

### Docker vs Local БД
`scripts/init_db.py seed` пишет в SQLite (`dev.db`), Docker использует PostgreSQL.
Для наполнения данными — использовать кнопку "Импорт" в дашборде с реальными API ключами.

### Фронтенд dev-режим
Запускать `npm run dev` (не `npm start`/`next start`), иначе 404 на `_next/static/*`.

---

## Запуск тестов

```bash
cd backend
pytest tests/ -v              # Все 306 тестов
pytest tests/test_security_fixes.py -v  # Только security
```

---

## Makefile команды

```bash
make up          # docker compose up -d
make down        # docker compose down
make build       # docker compose build
make logs        # docker logs -f ecom_auditor_backend
make test        # pytest
make clean       # удалить __pycache__ и .pytest_cache
```
