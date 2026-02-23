.PHONY: help install dev clean test docker-up docker-down migrate db-init

help:
	@echo "E-Com Auditor 2026 - Available commands:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Run development servers"
	@echo "  make test        - Run tests"
	@echo "  make migrate     - Run database migrations"
	@echo "  make db-init     - Initialize database with test data"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make clean       - Clean temporary files"

install:
	@echo "Installing backend dependencies..."
	cd backend && python3 -m pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Dependencies installed"

dev:
	@echo "Starting development servers..."
	@echo "Starting backend on http://localhost:8000"
	@cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting Telegram bot..."
	@cd telegram_bot && python bot.py &
	@echo "✓ Servers started"
	@echo "API: http://localhost:8000/api/docs"
	@echo "Frontend: Open frontend/src/pages/index.html in browser"

test:
	@echo "Running tests..."
	cd backend && pytest tests/ -v --cov=app

migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head
	@echo "✓ Migrations applied"

db-init:
	@echo "Initializing database..."
	python scripts/init_db.py seed
	@echo "✓ Database initialized with test data"

db-reset:
	@echo "Resetting database..."
	python scripts/init_db.py reset
	@echo "✓ Database reset"

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "✓ Containers started"
	@echo "API: http://localhost:8000"
	@echo "Database: localhost:5432"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down
	@echo "✓ Containers stopped"

docker-logs:
	docker-compose logs -f

clean:
	@echo "Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	rm -rf backend/.pytest_cache
	rm -rf backend/.coverage
	rm -rf backend/htmlcov
	@echo "✓ Cleaned"

lint:
	@echo "Running linters..."
	cd backend && flake8 app/
	cd backend && black --check app/
	@echo "✓ Linting complete"

format:
	@echo "Formatting code..."
	cd backend && black app/
	@echo "✓ Code formatted"

backup-db:
	@echo "Creating database backup..."
	pg_dump -U ecom_user ecom_auditor > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup created"

.DEFAULT_GOAL := help
