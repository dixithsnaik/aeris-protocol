import os

import mysql.connector
from mysql.connector import pooling

from config import _load_env

_pool = None

_USERS_DDL = """
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(80) NULL,
  email VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

_PROPERTIES_DDL = """
CREATE TABLE properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  area_name VARCHAR(120) NOT NULL,
  config VARCHAR(80) NOT NULL,
  price BIGINT NOT NULL,
  area_sqft INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  yield_pct DECIMAL(4,1) NOT NULL,
  yoy_pct DECIMAL(4,1) NOT NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verify_pending TINYINT(1) NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  owner_id INT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_config (config),
  INDEX idx_price (price),
  INDEX idx_verified (verified),
  INDEX idx_owner (owner_id)
)
"""

_INTERESTS_DDL = """
CREATE TABLE interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_interest (user_id, property_id),
  INDEX idx_user (user_id),
  INDEX idx_property (property_id)
)
"""

_MESSAGES_DDL = """
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  buyer_id INT NOT NULL,
  sender_id INT NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_thread (property_id, buyer_id)
)
"""

_NOTIFICATIONS_DDL = """
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  kind VARCHAR(24) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(400) NOT NULL,
  href VARCHAR(200) NOT NULL,
  property_id INT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_user_unread (user_id, read_at),
  INDEX idx_property (property_id)
)
"""


def _cfg():
    _load_env()
    return {
        "host": os.environ.get("MYSQL_HOST", "127.0.0.1"),
        "port": int(os.environ.get("MYSQL_PORT", "3306")),
        "user": os.environ.get("MYSQL_USER", "root"),
        "password": os.environ.get("MYSQL_PASSWORD", ""),
    }


def _db_name():
    _load_env()
    return os.environ.get("MYSQL_DATABASE", "aeris")


def ensure_schema():
    db = _db_name()
    conn = mysql.connector.connect(**_cfg(), autocommit=True)
    cur = conn.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db}`")
    cur.execute(f"USE `{db}`")
    cur.execute("SHOW TABLES LIKE 'users'")
    if cur.fetchone():
        cur.execute("SHOW COLUMNS FROM users")
        cols = {row[0] for row in cur.fetchall()}
        if "phone" not in cols:
            cur.execute("DROP TABLE users")
            cur.execute(_USERS_DDL)
        else:
            if "name" not in cols:
                cur.execute("ALTER TABLE users ADD name VARCHAR(80) NULL")
            if "email" not in cols:
                cur.execute("ALTER TABLE users ADD email VARCHAR(120) NULL")
    else:
        cur.execute(_USERS_DDL)
    cur.execute("SHOW TABLES LIKE 'properties'")
    if not cur.fetchone():
        cur.execute(_PROPERTIES_DDL)
    else:
        cur.execute("SHOW COLUMNS FROM properties")
        cols = {row[0] for row in cur.fetchall()}
        if "owner_id" not in cols:
            cur.execute("ALTER TABLE properties ADD owner_id INT NULL")
            cur.execute("ALTER TABLE properties ADD INDEX idx_owner (owner_id)")
        if "verify_pending" not in cols:
            cur.execute("ALTER TABLE properties ADD verify_pending TINYINT(1) NOT NULL DEFAULT 0")
    cur.execute("SHOW TABLES LIKE 'interests'")
    if not cur.fetchone():
        cur.execute(_INTERESTS_DDL)
    cur.execute("SHOW TABLES LIKE 'messages'")
    if not cur.fetchone():
        cur.execute(_MESSAGES_DDL)
    cur.execute("SHOW TABLES LIKE 'notifications'")
    if not cur.fetchone():
        cur.execute(_NOTIFICATIONS_DDL)
    cur.close()
    conn.close()


def get_pool():
    global _pool
    if _pool is None:
        ensure_schema()
        _pool = pooling.MySQLConnectionPool(
            pool_name="aeris",
            pool_size=5,
            database=_db_name(),
            **_cfg(),
        )
    return _pool


def _reset_pool():
    global _pool
    _pool = None


def fetch_one(sql, params=None):
    try:
        conn = get_pool().get_connection()
    except Exception:
        _reset_pool()
        raise
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        row = cur.fetchone()
        cur.close()
        return row
    finally:
        conn.close()


def fetch_all(sql, params=None):
    conn = get_pool().get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        cur.close()
        return rows
    finally:
        conn.close()


def execute(sql, params=None):
    try:
        conn = get_pool().get_connection()
    except Exception:
        _reset_pool()
        raise
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        conn.commit()
        last_id = cur.lastrowid
        cur.close()
        return last_id
    finally:
        conn.close()


def executemany(sql, rows):
    try:
        conn = get_pool().get_connection()
    except Exception:
        _reset_pool()
        raise
    try:
        cur = conn.cursor()
        cur.executemany(sql, rows)
        conn.commit()
        cur.close()
    finally:
        conn.close()
