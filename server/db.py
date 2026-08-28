import os
import sqlite3
import threading
from pathlib import Path

import mysql.connector
from mysql.connector import pooling
from mysql.connector.errors import IntegrityError as MysqlIntegrityError

from config import _load_env

# Catch both engines from models: `except IntegrityError`
IntegrityError = (sqlite3.IntegrityError, MysqlIntegrityError)

_pool = None
_sqlite = None
# ponytail: one writer lock for the sqlite file; AERIS_DB=mysql if you need concurrent writers
_sqlite_lock = threading.Lock()

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
  chain_token VARCHAR(64) NULL,
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
  offer_inr BIGINT NULL,
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

_SQLITE_TABLES = (
    """
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      area_name TEXT NOT NULL,
      config TEXT NOT NULL,
      price INTEGER NOT NULL,
      area_sqft INTEGER NOT NULL,
      status TEXT NOT NULL,
      yield_pct REAL NOT NULL,
      yoy_pct REAL NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      verify_pending INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      owner_id INTEGER,
      image_url TEXT NOT NULL,
      chain_token TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      offer_inr INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, property_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT NOT NULL,
      property_id INTEGER,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
)

_SQLITE_INDEXES = (
    "CREATE INDEX IF NOT EXISTS idx_config ON properties (config)",
    "CREATE INDEX IF NOT EXISTS idx_price ON properties (price)",
    "CREATE INDEX IF NOT EXISTS idx_verified ON properties (verified)",
    "CREATE INDEX IF NOT EXISTS idx_owner ON properties (owner_id)",
    "CREATE INDEX IF NOT EXISTS idx_user ON interests (user_id)",
    "CREATE INDEX IF NOT EXISTS idx_property ON interests (property_id)",
    "CREATE INDEX IF NOT EXISTS idx_thread ON messages (property_id, buyer_id)",
    "CREATE INDEX IF NOT EXISTS idx_user_created ON notifications (user_id, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_user_unread ON notifications (user_id, read_at)",
    "CREATE INDEX IF NOT EXISTS idx_notif_property ON notifications (property_id)",
)


def use_sqlite():
    _load_env()
    engine = os.environ.get("AERIS_DB", "").strip().lower()
    if engine in {"mysql"}:
        return False
    if engine in {"sqlite", "file", "fs"}:
        return True
    # Vercel: no MySQL box required; file lives in /tmp and is re-seeded on cold start
    return os.environ.get("VERCEL") == "1"


def _cfg():
    _load_env()
    cfg = {
        "host": os.environ.get("MYSQL_HOST", "127.0.0.1"),
        "port": int(os.environ.get("MYSQL_PORT", "3306")),
        "user": os.environ.get("MYSQL_USER", "root"),
        "password": os.environ.get("MYSQL_PASSWORD", ""),
    }
    if os.environ.get("MYSQL_SSL", "").strip().lower() in {"1", "true", "yes"}:
        cfg["ssl_disabled"] = False
    return cfg


def _db_name():
    _load_env()
    return os.environ.get("MYSQL_DATABASE", "aeris")


def _sqlite_path():
    _load_env()
    raw = os.environ.get("SQLITE_PATH", "").strip()
    if not raw:
        raw = "/tmp/aeris.sqlite" if os.environ.get("VERCEL") == "1" else "data/aeris.sqlite"
    if raw == ":memory:":
        return raw
    path = Path(raw)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent / path
    return path


def _adapt(sql):
    stripped = sql.strip()
    if stripped.upper().startswith("TRUNCATE"):
        table = stripped.split()[-1]
        return f"DELETE FROM {table}"
    return stripped.replace("%s", "?")


def _row(row):
    return dict(row) if row is not None else None


def _sqlite_cols(conn, table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}


def _ensure_sqlite(conn):
    for ddl in _SQLITE_TABLES:
        conn.execute(ddl)
    cols = _sqlite_cols(conn, "users")
    if "name" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN name TEXT")
    if "email" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
    cols = _sqlite_cols(conn, "properties")
    if "owner_id" not in cols:
        conn.execute("ALTER TABLE properties ADD COLUMN owner_id INTEGER")
    if "verify_pending" not in cols:
        conn.execute("ALTER TABLE properties ADD COLUMN verify_pending INTEGER NOT NULL DEFAULT 0")
    if "chain_token" not in cols:
        conn.execute("ALTER TABLE properties ADD COLUMN chain_token TEXT")
    cols = _sqlite_cols(conn, "interests")
    if "offer_inr" not in cols:
        conn.execute("ALTER TABLE interests ADD COLUMN offer_inr INTEGER")
    for ddl in _SQLITE_INDEXES:
        conn.execute(ddl)
    conn.commit()


def _sqlite_conn():
    global _sqlite
    if _sqlite is None:
        path = _sqlite_path()
        if path != ":memory:":
            path.parent.mkdir(parents=True, exist_ok=True)
            path = str(path)
        _sqlite = sqlite3.connect(path, check_same_thread=False, timeout=30)
        _sqlite.row_factory = sqlite3.Row
        _sqlite.execute("PRAGMA journal_mode=WAL")
        _sqlite.execute("PRAGMA foreign_keys=ON")
        _ensure_sqlite(_sqlite)
    return _sqlite


def ensure_schema():
    if use_sqlite():
        _sqlite_conn()
        return
    db = _db_name()
    conn = mysql.connector.connect(**_cfg(), autocommit=True)
    cur = conn.cursor()
    try:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db}`")
    except Exception:
        pass
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
        if "chain_token" not in cols:
            cur.execute("ALTER TABLE properties ADD chain_token VARCHAR(64) NULL")
    cur.execute("SHOW TABLES LIKE 'interests'")
    if not cur.fetchone():
        cur.execute(_INTERESTS_DDL)
    else:
        cur.execute("SHOW COLUMNS FROM interests")
        cols = {row[0] for row in cur.fetchall()}
        if "offer_inr" not in cols:
            cur.execute("ALTER TABLE interests ADD offer_inr BIGINT NULL")
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
    if use_sqlite():
        return None
    if _pool is None:
        ensure_schema()
        _pool = pooling.MySQLConnectionPool(
            pool_name="aeris",
            pool_size=max(1, int(os.environ.get("MYSQL_POOL_SIZE", "5"))),
            database=_db_name(),
            **_cfg(),
        )
    return _pool


def _reset_pool():
    global _pool, _sqlite
    _pool = None
    if _sqlite is not None:
        _sqlite.close()
        _sqlite = None


def fetch_one(sql, params=None):
    if use_sqlite():
        with _sqlite_lock:
            cur = _sqlite_conn().execute(_adapt(sql), params or ())
            return _row(cur.fetchone())
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
    if use_sqlite():
        with _sqlite_lock:
            cur = _sqlite_conn().execute(_adapt(sql), params or ())
            return [_row(item) for item in cur.fetchall()]
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
    if use_sqlite():
        with _sqlite_lock:
            conn = _sqlite_conn()
            cur = conn.execute(_adapt(sql), params or ())
            conn.commit()
            return cur.lastrowid
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
    if use_sqlite():
        with _sqlite_lock:
            conn = _sqlite_conn()
            conn.executemany(_adapt(sql), rows)
            conn.commit()
        return
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
