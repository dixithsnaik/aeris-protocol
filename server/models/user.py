from mysql.connector.errors import IntegrityError

from db import execute, fetch_one


def fetch_user_by_phone(phone):
    return fetch_one("SELECT id, phone, name, email FROM users WHERE phone = %s", (phone,))


def fetch_user_by_id(user_id):
    return fetch_one("SELECT id, phone, name, email FROM users WHERE id = %s", (user_id,))


def insert_user(phone):
    try:
        return execute("INSERT INTO users (phone) VALUES (%s)", (phone,)), None
    except IntegrityError:
        existing = fetch_user_by_phone(phone)
        return (existing["id"] if existing else None), None


def get_or_create_user(phone):
    row = fetch_user_by_phone(phone)
    if row:
        return row["id"]
    user_id, _ = insert_user(phone)
    return user_id


def update_user(user_id, name, email):
    execute("UPDATE users SET name = %s, email = %s WHERE id = %s", (name, email, user_id))
