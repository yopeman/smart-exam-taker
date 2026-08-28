import os

os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["EMAIL_HOST"] = "localhost"
os.environ["EMAIL_PORT"] = "1"  # invalid -> send fails fast, but we mock anyway
os.environ["EMAIL_USER"] = ""
os.environ["EMAIL_PASS"] = ""

from fastapi.testclient import TestClient

from app.main import app
from app.services import email as email_module

sent = []


def fake_send_email(to_email, subject, body):
    sent.append((to_email, subject, body))


email_module.send_email = fake_send_email

client = TestClient(app)
base = "/api/v1/auth"


def reset_db():
    import app.core.database as dbmod
    dbmod.Base.metadata.drop_all(bind=dbmod.engine)
    dbmod.Base.metadata.create_all(bind=dbmod.engine)


def register(email="test@example.com", password="password123"):
    return client.post(
        f"{base}/register",
        json={"name": "Test User", "email": email, "password": password},
    )


def main():
    reset_db()
    print("== register ==")
    r = register()
    print(r.status_code, r.json())
    assert r.status_code == 201
    token_in_mail = sent[-1][2].split("token=")[1].split("&")[0]
    user_id = r.json()["id"]
    assert r.json()["is_verified"] is False

    print("== duplicate register ==")
    r2 = register()
    print(r2.status_code, r2.json())
    assert r2.status_code == 409

    print("== login before verify ==")
    r = client.post(f"{base}/login", json={"email": "test@example.com", "password": "password123"})
    print(r.status_code, r.json())
    assert r.status_code == 403

    print("== verify email (backend checks token) ==")
    r = client.get(f"{base}/verify-email", params={"token": token_in_mail})
    print(r.status_code, r.headers.get("location"))
    assert r.status_code == 307
    assert "status=success" in r.headers["location"]

    print("== login after verify ==")
    r = client.post(f"{base}/login", json={"email": "test@example.com", "password": "password123"})
    print(r.status_code, r.json())
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("== me ==")
    r = client.get(f"{base}/me", headers=headers)
    print(r.status_code, r.json())
    assert r.status_code == 200
    assert r.json()["id"] == user_id

    print("== me with bad token ==")
    r = client.get(f"{base}/me", headers={"Authorization": "Bearer invalid"})
    print(r.status_code)
    assert r.status_code == 401

    print("== update profile (name only) ==")
    r = client.patch(f"{base}/profile", json={"name": "New Name"}, headers=headers)
    print(r.status_code, r.json())
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"

    print("== update profile (password only) ==")
    r = client.patch(f"{base}/profile", json={"password": "newpass123"}, headers=headers)
    print(r.status_code)
    assert r.status_code == 200

    print("== login with new password ==")
    r = client.post(f"{base}/login", json={"email": "test@example.com", "password": "newpass123"})
    print(r.status_code, r.json()["user"]["name"])
    assert r.status_code == 200

    print("== forgot password ==")
    r = client.post(f"{base}/forgot-password", json={"email": "test@example.com"})
    print(r.status_code, r.json())
    assert r.status_code == 200
    reset_token = sent[-1][2].split("token=")[1].split("&")[0]

    print("== reset password ==")
    r = client.post(f"{base}/reset-password", json={"token": reset_token, "new_password": "resetval123"})
    print(r.status_code, r.json())
    assert r.status_code == 200

    print("== login with reset password ==")
    r = client.post(f"{base}/login", json={"email": "test@example.com", "password": "resetval123"})
    print(r.status_code)
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("== delete account (soft delete) ==")
    r = client.delete(f"{base}/account", headers=headers)
    print(r.status_code, r.json())
    assert r.status_code == 200

    print("== login after delete ==")
    r = client.post(f"{base}/login", json={"email": "test@example.com", "password": "resetval123"})
    print(r.status_code, r.json())
    assert r.status_code == 401

    print("== deleted_at set in db ==")
    from app.core.database import SessionLocal
    from app.models import User
    db = SessionLocal()
    u = db.get(User, user_id)
    print("deleted_at:", u.deleted_at, "is_deleted:", u.is_deleted)
    assert u.deleted_at is not None
    db.close()

    print("\nALL TESTS PASSED")


if __name__ == "__main__":
    main()
