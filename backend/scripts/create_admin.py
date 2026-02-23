#!/usr/bin/env python3
"""
Create or update the admin user.
Usage:
    python scripts/create_admin.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

ADMIN_EMAIL = "glebanya.com@gmail.com"
ADMIN_PASSWORD = "s%h+bkRhK2FceMS"
ADMIN_NAME = "Администратор"


def create_or_update_admin():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if admin:
            admin.hashed_password = get_password_hash(ADMIN_PASSWORD)
            admin.full_name = ADMIN_NAME
            admin.is_active = True
            admin.is_verified = True       # admin flag
            admin.subscription_active = True
            db.commit()
            print(f"✓ Admin updated: {ADMIN_EMAIL}")
        else:
            admin = User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                full_name=ADMIN_NAME,
                is_active=True,
                is_verified=True,          # admin flag
                subscription_active=True,
                balance=0.0,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"✓ Admin created: {ADMIN_EMAIL} (id={admin.id})")

    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("E-Com Auditor — Create Admin User")
    print("=" * 50)
    create_or_update_admin()
    print("\nDone. Login at /login with:")
    print(f"  Email:    {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
