"""Historique SQLite : annonces déjà vues et prix observés sur le marché."""
from __future__ import annotations

import sqlite3
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
"""


class Storage:
    def __init__(self, path: str | Path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.executescript(SCHEMA)

    def is_known(self, item_id: int) -> bool:
        return self.db.execute(
            "SELECT 1 FROM prices WHERE item_id = ?", (item_id,)
        ).fetchone() is not None

    def record(self, search: str, item: Item, notified: bool = False) -> None:
        self.db.execute(
            "INSERT OR IGNORE INTO prices (item_id, search, brand, status, price, seen_at, notified)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item.id, search, item.brand.lower(), item.status.lower(), item.price,
             time.time(), int(notified)),
        )
        self.db.commit()

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
        return [row[0] for row in self.db.execute(sql, args)]

    def purge(self, max_age_days: float) -> None:
        self.db.execute("DELETE FROM prices WHERE seen_at < ?",
                        (time.time() - max_age_days * 86400,))
        self.db.commit()
