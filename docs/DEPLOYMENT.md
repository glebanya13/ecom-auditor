# Руководство по развертыванию E-Com Auditor 2026

## Содержание
1. [Требования](#требования)
2. [Установка и настройка](#установка-и-настройка)
3. [Запуск приложения](#запуск-приложения)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Развертывание в production](#развертывание-в-production)

## Требования

### Системные требования
- Python 3.10+
- PostgreSQL 14+
- Node.js 18+ (для frontend)
- Redis 6+ (опционально, для кэширования)

### API ключи (необходимо получить)
- Telegram Bot Token (через @BotFather)
- Wildberries API Key
- Ozon Client ID и API Key
- OpenAI API Key (опционально)

## Установка и настройка

### 1. Клонирование и настройка окружения

```bash
cd /path/to/audit

# Создание виртуального окружения Python
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установка зависимостей backend
cd backend
pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
nano .env  # или любой другой редактор
```

Обязательные поля:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecom_auditor
DB_PASSWORD=your_strong_password

# Security
SECRET_KEY=your-32-character-secret-key-here
AES_ENCRYPTION_KEY=another-32-character-key-here

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Настройка PostgreSQL

```bash
# Войдите в PostgreSQL
sudo -u postgres psql

# Создайте базу данных и пользователя
CREATE DATABASE ecom_auditor;
CREATE USER ecom_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE ecom_auditor TO ecom_user;
\q
```

### 4. Миграции базы данных

```bash
# Из директории backend
cd backend

# Инициализация Alembic (если еще не сделано)
alembic init alembic

# Создание миграции
alembic revision --autogenerate -m "Initial migration"

# Применение миграций
alembic upgrade head
```

Или создайте таблицы напрямую:

```bash
python -c "from app.core.database import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine)"
```

## Запуск приложения

### Режим разработки

#### Backend API
```bash
cd backend
source ../venv/bin/activate

# Запуск FastAPI с hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступен на:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

#### Telegram Bot
```bash
cd telegram_bot
source ../venv/bin/activate

# Запуск бота
python bot.py
```

#### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

В production соберите и запустите Node-сервер:
```bash
cd frontend
npm ci
npm run build
npm start
```
Или используйте PM2: `pm2 start npm --name "audit-frontend" -- start`

Frontend будет доступен на http://localhost:3000

### Режим production

#### 1. Backend с Gunicorn
```bash
cd backend

# Установка Gunicorn
pip install gunicorn

# Запуск с 4 воркерами
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --daemon
```

#### 2. Nginx как reverse proxy

```nginx
# /etc/nginx/sites-available/ecom-auditor

server {
    listen 80;
    server_name your-domain.com;

    # Next.js (запущен на порту 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активация конфигурации:
```bash
sudo ln -s /etc/nginx/sites-available/ecom-auditor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Telegram Bot как systemd service

Создайте файл `/etc/systemd/system/ecom-bot.service`:

```ini
[Unit]
Description=E-Com Auditor Telegram Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/audit/telegram_bot
Environment="PATH=/path/to/audit/venv/bin"
ExecStart=/path/to/audit/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ecom-bot
sudo systemctl start ecom-bot
sudo systemctl status ecom-bot
```

## Тестирование

### Запуск тестов
```bash
cd backend
pytest tests/ -v
```

### Проверка API
```bash
# Health check
curl http://localhost:8000/health

# Регистрация пользователя
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

## Мониторинг

### Логи

Backend логи:
```bash
tail -f backend/logs/error.log
tail -f backend/logs/access.log
```

Telegram Bot логи:
```bash
journalctl -u ecom-bot -f
```

Nginx логи:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Резервное копирование

### База данных
```bash
# Создание бэкапа
pg_dump -U ecom_user ecom_auditor > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
psql -U ecom_user ecom_auditor < backup_20260215.sql
```

### Автоматическое резервное копирование (cron)
```bash
# Добавьте в crontab
0 2 * * * pg_dump -U ecom_user ecom_auditor > /backups/ecom_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### База данных не подключается
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте права пользователя БД

### Telegram бот не отвечает
- Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
- Убедитесь, что бот запущен: `sudo systemctl status ecom-bot`
- Проверьте логи: `journalctl -u ecom-bot -n 50`

### API возвращает 500 ошибку
- Проверьте логи backend
- Убедитесь, что все миграции применены
- Проверьте переменные окружения

## Безопасность

1. **Всегда используйте HTTPS в production**
2. **Храните .env в безопасности** (не коммитьте в git)
3. **Регулярно обновляйте зависимости**
4. **Используйте сильные пароли для БД**
5. **Ограничьте доступ к API через firewall**

## Масштабирование

### Горизонтальное масштабирование
- Запустите несколько инстансов backend за load balancer
- Используйте PostgreSQL в режиме master-replica
- Добавьте Redis для кэширования

### Вертикальное масштабирование
- Увеличьте количество Gunicorn воркеров
- Увеличьте пул соединений PostgreSQL
- Оптимизируйте SQL запросы

## Полезные команды

```bash
# Проверка статуса всех сервисов
sudo systemctl status postgresql nginx ecom-bot

# Перезапуск backend
sudo systemctl restart ecom-api

# Просмотр активных соединений к БД
psql -U ecom_user -d ecom_auditor -c "SELECT * FROM pg_stat_activity;"

# Очистка старых логов
find backend/logs/ -name "*.log" -mtime +30 -delete
```

## Поддержка

При возникновении проблем:
1. Проверьте логи
2. Убедитесь, что все зависимости установлены
3. Проверьте конфигурацию `.env`
4. Обратитесь в техподдержку: support@ecom-auditor.ru
