#!/usr/bin/env python3
"""
Database initialization script
Creates all tables and optionally seeds test data
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine
from app.models import User, Product, AuditLog, LegalDoc
from app.core.security import get_password_hash, encrypt_api_key


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def seed_test_data():
    """Seed database with test data"""
    from app.core.database import SessionLocal

    print("\nSeeding test data...")
    db = SessionLocal()

    try:
        # Create test user
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("test123"),  # Short password for testing
            full_name="Тестовый Пользователь",
            telegram_id="123456789",
            balance=1000.0,
            subscription_active=True,
            is_verified=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✓ Created test user: {test_user.email}")

        # Create test products
        test_products = [
            Product(
                user_id=test_user.id,
                sku_id="SKU-12345",
                marketplace="wildberries",
                name="Кроссовки Nike Air",
                current_price=5990.0,
                rating=4.8,
                certificate_number="РОСС RU.АГ99.Н12345",
                certificate_status="valid",
                delivery_time_hours=18,
                warehouse_location="Екатеринбург"
            ),
            Product(
                user_id=test_user.id,
                sku_id="SKU-67890",
                marketplace="ozon",
                name="Футболка Adidas",
                current_price=2490.0,
                rating=4.5,
                certificate_number="РОСС RU.АГ99.Н67890",
                certificate_status="valid",
                delivery_time_hours=24,
                warehouse_location="Москва"
            ),
            Product(
                user_id=test_user.id,
                sku_id="SKU-54321",
                marketplace="wildberries",
                name="Рюкзак Puma",
                current_price=3990.0,
                rating=4.2,
                certificate_number="РОСС RU.АГ99.Н54321",
                certificate_status="suspended",
                delivery_time_hours=72,
                warehouse_location="Новосибирск",
                shadow_ban_detected=1,  # Int for boolean
                certificate_expired=1   # Int for boolean
            )
        ]

        for product in test_products:
            db.add(product)

        db.commit()
        print(f"✓ Created {len(test_products)} test products")

        # Create sample audit log
        sample_audit = AuditLog(
            user_id=test_user.id,
            product_id=test_products[0].id,
            audit_type="full",
            total_score=87.5,
            legal_score=40.0,
            delivery_score=30.0,
            seo_score=12.5,
            price_score=5.0,
            risks_detected=[
                {
                    "type": "low_price_alert",
                    "severity": "low",
                    "description": "Цена ниже среднерыночной",
                    "recommendation": "Проверьте рентабельность"
                }
            ],
            recommendations=["✓ Отличный результат", "Продолжайте поддерживать качество"],
            certificate_check_passed=True,
            marking_check_passed=True,
            seo_check_passed=True,
            delivery_check_passed=True,
            margin_percentage=35.5,
            estimated_profit=1250.0,
            vat_amount=1098.0
        )
        db.add(sample_audit)
        db.commit()
        print("✓ Created sample audit log")

        print("\n✓ Test data seeded successfully")

    except Exception as e:
        print(f"✗ Error seeding test data: {e}")
        db.rollback()
    finally:
        db.close()


def drop_all_tables():
    """Drop all tables (use with caution!)"""
    confirm = input("WARNING: This will delete all data. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped")
    else:
        print("Operation cancelled")


def main():
    """Main function"""
    print("=" * 50)
    print("E-Com Auditor 2026 - Database Initialization")
    print("=" * 50)

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "create":
            create_tables()
        elif command == "seed":
            create_tables()
            seed_test_data()
        elif command == "drop":
            drop_all_tables()
        elif command == "reset":
            drop_all_tables()
            create_tables()
            seed_test_data()
        else:
            print(f"Unknown command: {command}")
            print_usage()
    else:
        print_usage()


def print_usage():
    """Print usage instructions"""
    print("\nUsage:")
    print("  python scripts/init_db.py create    - Create tables")
    print("  python scripts/init_db.py seed      - Create tables and seed test data")
    print("  python scripts/init_db.py drop      - Drop all tables")
    print("  python scripts/init_db.py reset     - Drop, create, and seed")


if __name__ == "__main__":
    main()
