"""Base SQLite : recherches, réglages, annonces déjà vues et prix observés sur le marché."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path

from .vinted import Item

SCHEMA = """
CREATE TABLE IF NOT EXISTS prices (
    item_id   INTEGER PRIMARY KEY,
    search    TEXT NOT NULL,
    brand     TEXT NOT NULL,
    status    TEXT NOT NULL,
    price     REAL NOT NULL,
    seen_at   REAL NOT NULL,
    notified  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS prices_lookup ON prices (search, brand, status, seen_at);
CREATE TABLE IF NOT EXISTS searches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    url        TEXT NOT NULL,
    max_price  REAL,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Storage:
    """Partagée entre le scan et le site web : chaque accès passe par un verrou."""

    def __init__(self, path: str | Path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.lock = threading.Lock()
        with self.lock:
            self.db.executescript(SCHEMA)

    def _query(self, sql: str, args=()) -> list[tuple]:
        with self.lock:
            rows = self.db.execute(sql, args).fetchall()
            self.db.commit()
            return rows

    # --- Prix observés -------------------------------------------------------------

    def is_known(self, item_id: int) -> bool:
        return bool(self._query("SELECT 1 FROM prices WHERE item_id = ?", (item_id,)))

    def record(self, search: str, item: Item, notified: bool = False) -> None:
        self._query(
            "INSERT OR IGNORE INTO prices (item_id, search, brand, status, price, seen_at, notified)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item.id, search, item.brand.lower(), item.status.lower(), item.price,
             time.time(), int(notified)),
        )

    def market_prices(self, search: str, max_age_days: float, brand: str | None = None,
                      status: str | None = None, exclude_id: int | None = None) -> list[float]:
        sql = "SELECT price FROM prices WHERE search = ? AND seen_at >= ? AND price > 0"
        args: list = [search, time.time() - max_age_days * 86400]
        if brand is not None:
            sql += " AND brand = ?"
            args.append(brand.lower())
        if status is not None:
            sql += " AND status = ?"
            args.append(status.lower())
        if exclude_id is not None:
            sql += " AND item_id != ?"
            args.append(exclude_id)
        return [row[0] for row in self._query(sql, args)]

    def purge(self, max_age_days: float) -> None:
        self._query("DELETE FROM prices WHERE seen_at < ?", (time.time() - max_age_days * 86400,))

    # --- Recherches ----------------------------------------------------------------

    def list_searches(self) -> list[dict]:
        rows = self._query("SELECT id, name, url, max_price FROM searches ORDER BY created_at")
        return [{"id": r[0], "name": r[1], "url": r[2], "max_price": r[3]} for r in rows]

    def add_search(self, name: str, url: str, max_price: float | None) -> None:
        self._query("INSERT INTO searches (name, url, max_price, created_at) VALUES (?, ?, ?, ?)",
                    (name, url, max_price, time.time()))

    def delete_search(self, search_id: int) -> None:
        self._query("DELETE FROM searches WHERE id = ?", (search_id,))

    # --- Réglages ------------------------------------------------------------------

    def get_settings(self) -> dict:
        return {k: json.loads(v) for k, v in self._query("SELECT key, value FROM settings")}

    def set_settings(self, values: dict) -> None:
        for key, value in values.items():
            self._query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                        (key, json.dumps(value)))
