# E-Com Auditor 2026

Автоматизированная система аудита селлеров на маркетплейсах Wildberries и Ozon.

Проверяет соответствие требованиям закона 289-ФЗ, отслеживает сертификаты, маркировку, позиции и цены. Генерирует PDF-отчёты и юридические документы.

---

## Возможности

- **Мониторинг товаров** — добавление по артикулу/sku, импорт всего каталога из WB/Ozon
- **Аудит** — проверка сертификатов (Росаккредитация), маркировки (Честный Знак), shadow ban
- **Аналитика** — история цен, позиций, остатков
- **Документы** — генерация PDF-отчётов, юридических документов
- **Уведомления** — Telegram-бот с алертами
- **Мультипользовательский** — каждый пользователь хранит свои API ключи (зашифрованы AES)

---

## Стек

| | |
|---|---|
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL 14, Redis |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Инфраструктура** | Docker Compose |
| **Маркетплейсы** | Wildberries Seller API, Ozon Seller API |
| **Госсервисы** | Росаккредитация, Честный Знак |

---

## Быстрый старт

### Требования
- Docker + Docker Compose
- Node.js 18+

### 1. Настройте переменные окружения

```bash
cp .env.example .env
# Отредактируйте .env: задайте SECRET_KEY, AES_ENCRYPTION_KEY и API ключи маркетплейсов
```

### 2. Запустите backend (Docker)

```bash
docker compose up -d
```

Это поднимет PostgreSQL, Redis и FastAPI backend на `http://localhost:8000`.

### 3. Инициализируйте базу данных

```bash
docker exec ecom_auditor_backend python3 scripts/init_db.py create
docker exec ecom_auditor_backend python3 scripts/create_admin.py
```

### 4. Запустите frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

---

## Конфигурация

Основные переменные в `.env`:

```env
# База данных (Docker)
DATABASE_URL=postgresql://ecom_user:password@db:5432/ecom_auditor

# Безопасность (обязательно заменить в production)
SECRET_KEY=your-secret-key-min-32-chars
AES_ENCRYPTION_KEY=your-aes-key-exactly-32-chars

# Маркетплейсы (глобальный fallback; пользователи задают свои ключи в Настройках)
WILDBERRIES_API_KEY=
OZON_CLIENT_ID=
OZON_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
```

---

## Разработка

### Backend

```bash
# Логи backend контейнера (live reload при изменении кода)
docker logs -f ecom_auditor_backend

# Тесты
cd backend && pytest tests/ -v

# Консоль PostgreSQL
docker exec -it ecom_auditor_db psql -U ecom_user -d ecom_auditor
```

### Frontend

```bash
cd frontend
npm run dev      # dev сервер с hot reload на :3000
npm run build    # production сборка
npm run lint     # ESLint
```

### Полезные make-команды

```bash
make up      # запустить все сервисы
make down    # остановить
make logs    # логи backend
make test    # pytest
make build   # пересобрать Docker образы
```

---

## Структура

```
audit/
├── backend/          FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/      Эндпоинты (auth, products, audit, legal, admin)
│   │   ├── models/   Модели БД
│   │   ├── services/ WB/Ozon/Chestnyznak/Rosaccreditation интеграции
│   │   └── main.py
│   ├── scripts/      init_db.py, create_admin.py
│   └── tests/        306 тестов
├── frontend/         Next.js 14
│   └── src/
│       ├── pages/    Dashboard, Products, Analytics, Settings, Admin
│       └── components/
├── telegram_bot/     Telegram алерты
├── docs/             API.md, DEPLOYMENT.md
└── docker-compose.yml
```

---

## API

Документация: `http://localhost:8000/docs` (Swagger UI)

Основные эндпоинты:

| Method | Endpoint | Описание |
|---|---|---|
| POST | `/api/v1/auth/login` | Авторизация (OAuth2 form) |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| PATCH | `/api/v1/auth/me` | Обновить профиль / API ключи |
| GET | `/api/v1/products` | Список товаров |
| POST | `/api/v1/products` | Добавить товар |
| POST | `/api/v1/products/import` | Импорт из WB/Ozon |
| POST | `/api/v1/products/validate` | Проверить SKU |
| POST | `/api/v1/audit/run/{id}` | Запустить аудит |

---

## Лицензия

Проприетарное ПО. Все права защищены.
