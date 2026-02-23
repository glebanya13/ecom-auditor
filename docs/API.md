# API Documentation - E-Com Auditor 2026

## Base URL
```
Production: https://api.ecom-auditor.ru/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <your_jwt_token>
```

### Получение токена

**POST** `/auth/login`

Request:
```json
{
  "username": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Endpoints

### Authentication

#### Регистрация
**POST** `/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Иван Иванов",
  "telegram_id": "123456789"
}
```

Response: `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "telegram_id": "123456789",
  "balance": 0.0,
  "subscription_active": false,
  "created_at": "2026-02-15T10:00:00"
}
```

#### Получение профиля
**GET** `/auth/me`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "balance": 1000.0,
  "subscription_active": true,
  "subscription_expires_at": "2026-03-15T10:00:00"
}
```

### Products

#### Добавить товар
**POST** `/products/`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "sku_id": "SKU-12345",
  "marketplace": "wildberries",
  "name": "Кроссовки Nike Air"
}
```

Response: `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "sku_id": "SKU-12345",
  "marketplace": "wildberries",
  "name": "Кроссовки Nike Air",
  "current_price": null,
  "rating": null,
  "created_at": "2026-02-15T10:00:00"
}
```

#### Получить все товары
**GET** `/products/`

Headers: `Authorization: Bearer <token>`

Query параметры:
- `marketplace` (optional): "wildberries" или "ozon"

Response:
```json
[
  {
    "id": 1,
    "sku_id": "SKU-12345",
    "marketplace": "wildberries",
    "name": "Кроссовки Nike Air",
    "current_price": 5990.0,
    "rating": 4.8,
    "certificate_status": "valid",
    "shadow_ban_detected": false
  }
]
```

#### Получить товар по ID
**GET** `/products/{product_id}`

#### Обновить товар
**PUT** `/products/{product_id}`

Request:
```json
{
  "certificate_number": "РОСС RU.АГ99.Н12345",
  "marking_code": "01234567890123",
  "warehouse_location": "Екатеринбург"
}
```

#### Удалить товар
**DELETE** `/products/{product_id}`

Response: `204 No Content`

### Audit

#### Быстрый аудит (без авторизации)
**POST** `/audit/quick`

Request:
```json
{
  "sku_id": "SKU-12345",
  "marketplace": "wildberries"
}
```

Response:
```json
{
  "sku_id": "SKU-12345",
  "marketplace": "wildberries",
  "score": 45.0,
  "issues_found": [
    "Сертификат не найден в базе Росаккредитации",
    "Время доставки превышает средний показатель",
    "Рейтинг товара ниже 4.7"
  ],
  "message": "Зарегистрируйтесь для получения полного отчета"
}
```

#### Полный аудит
**POST** `/audit/full`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "product_id": 1,
  "audit_type": "full"
}
```

Response:
```json
{
  "id": 1,
  "product_id": 1,
  "audit_type": "full",
  "audit_date": "2026-02-15T10:00:00",
  "scores": {
    "total_score": 67.5,
    "legal_score": 30.0,
    "delivery_score": 20.0,
    "seo_score": 12.5,
    "price_score": 5.0
  },
  "risks_detected": [
    {
      "type": "certificate_suspended",
      "severity": "high",
      "description": "Сертификат приостановлен в базе Росаккредитации",
      "recommendation": "Срочно свяжитесь с органом сертификации"
    }
  ],
  "certificate_check_passed": false,
  "marking_check_passed": true,
  "seo_check_passed": false,
  "delivery_check_passed": true,
  "margin_percentage": 35.5,
  "estimated_profit": 1250.0,
  "vat_amount": 1098.0,
  "report_generated": false
}
```

#### История аудитов
**GET** `/audit/history`

Headers: `Authorization: Bearer <token>`

Query параметры:
- `limit` (optional): количество результатов (default: 10)

#### Финансовый калькулятор
**POST** `/audit/calculate-finances`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "product_price": 5000.0,
  "cost_price": 3000.0,
  "logistics_cost": 200.0,
  "marketplace_commission": 15.0,
  "return_rate": 5.0,
  "include_vat": true
}
```

Response:
```json
{
  "gross_revenue": 5000.0,
  "revenue_without_vat": 4098.36,
  "vat_amount": 901.64,
  "marketplace_fee": 750.0,
  "logistics_cost": 200.0,
  "return_losses": 250.0,
  "net_profit": 898.36,
  "margin_percentage": 40.0,
  "effective_margin_percentage": 17.97
}
```

### Legal Documents

#### Сгенерировать претензию
**POST** `/legal/complaint`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "marketplace": "wildberries",
  "article_number": "SKU-12345",
  "violation_type": "unauthorized_penalty",
  "violation_date": "2026-02-10",
  "violation_description": "Необоснованное применение штрафа",
  "penalty_amount": 5000.0
}
```

Response:
```json
{
  "id": 1,
  "doc_type": "complaint",
  "title": "Претензия по артикулу SKU-12345",
  "content": "ДОСУДЕБНАЯ ПРЕТЕНЗИЯ\n...",
  "status": "draft",
  "created_at": "2026-02-15T10:00:00"
}
```

#### Получить все документы
**GET** `/legal/documents`

Headers: `Authorization: Bearer <token>`

#### Получить шаблоны
**GET** `/legal/templates`

Response:
```json
{
  "templates": {
    "complaint_289fz": "Досудебная претензия по ФЗ-289",
    "fas_complaint": "Жалоба в ФАС",
    "offer_change_notification": "Уведомление об изменении оферты"
  }
}
```

#### Удалить документ
**DELETE** `/legal/documents/{doc_id}`

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Product not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

- **Free tier**: 100 requests/day
- **Single Report**: 500 requests/day
- **Subscription**: Unlimited

## Webhooks (опционально)

Настройте webhooks для получения уведомлений о событиях:

**POST** `/webhooks/subscribe`

Request:
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["certificate_expired", "position_drop", "forced_promo"]
}
```

События:
- `certificate_expired` - истечение сертификата
- `certificate_suspended` - приостановка сертификата
- `position_drop` - падение позиций >50
- `forced_promo` - принудительная акция
- `shadow_ban` - обнаружен теневой бан

## SDK Examples

### Python
```python
import requests

API_URL = "http://localhost:8000/api/v1"

# Login
response = requests.post(f"{API_URL}/auth/login", json={
    "username": "user@example.com",
    "password": "password123"
})
token = response.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}

# Get products
products = requests.get(f"{API_URL}/products/", headers=headers).json()

# Run audit
audit = requests.post(f"{API_URL}/audit/full",
    headers=headers,
    json={"product_id": 1, "audit_type": "full"}
).json()

print(f"Score: {audit['scores']['total_score']}")
```

### JavaScript
```javascript
const API_URL = 'http://localhost:8000/api/v1';

// Login
const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123'
  })
});
const { access_token } = await loginResponse.json();

// Get products
const productsResponse = await fetch(`${API_URL}/products/`, {
  headers: {'Authorization': `Bearer ${access_token}`}
});
const products = await productsResponse.json();

console.log('Products:', products);
```

## Support

Документация API: http://localhost:8000/api/docs
Техподдержка: support@ecom-auditor.ru
