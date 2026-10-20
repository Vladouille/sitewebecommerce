"""Site web du bot : connexion par mot de passe, recherches, affaires et annonces de revente."""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import secrets
import sqlite3
import threading
import time
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, Response, abort, jsonify, redirect, request, session
from werkzeug.middleware.proxy_fix import ProxyFix

from .resale import AIConfig, write_listing
from .scanner import Scanner
from .storage import Storage
from .vinted import search_url_to_params

log = logging.getLogger("vinted_bot")
WEB_DIR = Path(__file__).parent / "web"
# Pages du site intégrées au code (version en un seul fichier) ; sinon lues dans WEB_DIR.
ASSETS: dict[str, str] = {}
MIMETYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript"}

MAX_SEARCHES = 15          # au-delà, le scan devient trop lent et trop insistant pour Vinted
MAX_LOGIN_FAILURES = 5
LOCK_SECONDS = 15 * 60

CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' https://*.vinted.net data:; connect-src 'self'; "
       "frame-ancestors 'none'; base-uri 'none'; form-action 'self'")


def hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)


def load_secret_key(data_dir: Path) -> str:
    """Clé de signature des sessions : variable SECRET_KEY, sinon fichier privé généré une fois."""
    if os.getenv("SECRET_KEY"):
        return os.environ["SECRET_KEY"]
    path = data_dir / "secret_key"
    if not path.exists():
        data_dir.mkdir(parents=True, exist_ok=True)
        path.write_text(secrets.token_hex(32))
        path.chmod(0o600)
    return path.read_text().strip()


class LoginGuard:
    """Bloque une adresse IP 15 minutes après 5 mots de passe faux."""

    def __init__(self):
        self.failures: dict[str, tuple[int, float]] = {}
        self.lock = threading.Lock()

    def locked(self, ip: str) -> bool:
        with self.lock:
            count, until = self.failures.get(ip, (0, 0.0))
            return count >= MAX_LOGIN_FAILURES and time.time() < until

    def fail(self, ip: str) -> None:
        with self.lock:
            count, until = self.failures.get(ip, (0, 0.0))
            if time.time() >= until:
                count = 0
            self.failures[ip] = (count + 1, time.time() + LOCK_SECONDS)

    def success(self, ip: str) -> None:
        with self.lock:
            self.failures.pop(ip, None)


def validate_search(data: dict, domain: str) -> tuple[str, str, float | None]:
    name = str(data.get("name", "")).strip()
    url = str(data.get("url", "")).strip()
    if not 1 <= len(name) <= 60:
        raise ValueError("Donne un nom de 1 à 60 caractères.")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in (domain, domain.removeprefix("www.")) \
            or not parsed.path.startswith("/catalog"):
        raise ValueError(f"Colle l'adresse d'une page de résultats {domain} (https://{domain}/catalog?...).")
    if not search_url_to_params(url):
        raise ValueError("Cette adresse ne contient aucun filtre : fais d'abord une recherche sur Vinted.")
    max_price = data.get("max_price")
    if max_price in (None, ""):
        return name, url, None
    max_price = float(max_price)
    if not 1 <= max_price <= 100_000:
        raise ValueError("Le prix maximum doit être entre 1 et 100 000 €.")
    return name, url, max_price


def validate_settings(data: dict) -> dict:
    deal, error = float(data["deal_discount"]), float(data["error_discount"])
    keywords = [str(k).strip()[:40] for k in data.get("exclude_keywords", []) if str(k).strip()]
    if not 0.1 <= deal <= 0.9 or not deal < error <= 0.95:
        raise ValueError("Seuils invalides : bonne affaire entre 10 et 90 %, erreur de prix au-dessus.")
    if len(keywords) > 60:
        raise ValueError("60 mots exclus au maximum.")
    return {"deal_discount": deal, "error_discount": error, "exclude_keywords": keywords}


def create_app(scanner: Scanner, password: str, secret_key: str, secure_cookies: bool = True,
               trust_proxy: bool = False) -> Flask:
    if len(password) < 10:
        raise SystemExit("BOT_PASSWORD doit faire au moins 10 caractères.")
    salt = secrets.token_bytes(16)
    password_hash = hash_password(password, salt)
    # Change dès que le mot de passe change : les anciennes sessions deviennent invalides.
    session_tag = hashlib.sha256(password_hash).hexdigest()[:16]
    guard = LoginGuard()
    assets = ASSETS or {p.name: p.read_text(encoding="utf-8") for p in WEB_DIR.iterdir() if p.is_file()}

    def page(name: str) -> Response:
        return Response(assets[name], mimetype=MIMETYPES[Path(name).suffix])

    app = Flask(__name__, static_folder=None)
    app.config.update(
        SECRET_KEY=secret_key,
        SESSION_COOKIE_NAME="vinted_bot",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Strict",
        SESSION_COOKIE_SECURE=secure_cookies,
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
        MAX_CONTENT_LENGTH=16 * 1024,
    )
    if trust_proxy:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    def logged_in() -> bool:
        return session.get("auth") == session_tag

    @app.before_request
    def protect():
        if request.method not in ("GET", "HEAD"):
            # Refuse les requêtes envoyées par un autre site (CSRF).
            origin = request.headers.get("Origin")
            same_site = request.headers.get("Sec-Fetch-Site") == "same-origin"
            if not same_site and (not origin or urlparse(origin).netloc != request.host):
                abort(403)
        if request.endpoint in ("login_page", "login", "healthz", "static_file"):
            return None
        if not logged_in():
            if request.path.startswith("/api/"):
                return jsonify(error="Connexion requise"), 401
            return redirect("/login")
        return None

    @app.after_request
    def headers(resp):
        resp.headers["Content-Security-Policy"] = CSP
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        resp.headers["Cache-Control"] = "no-store"
        if secure_cookies:
            resp.headers["Strict-Transport-Security"] = "max-age=31536000"
        return resp

    @app.get("/healthz")
    def healthz():
        return "ok"

    @app.get("/login")
    def login_page():
        if logged_in():
            return redirect("/")
        return page("login.html")

    @app.post("/login")
    def login():
        ip = request.remote_addr or "?"
        if guard.locked(ip):
            return redirect("/login?erreur=bloque")
        given = request.form.get("password", "")[:200]
        if not hmac.compare_digest(hash_password(given, salt), password_hash):
            guard.fail(ip)
            log.warning("Mot de passe incorrect depuis %s", ip)
            time.sleep(1)
            return redirect("/login?erreur=1")
        guard.success(ip)
        session.clear()                       # nouvelle session : évite la fixation de session
        session.permanent = True
        session["auth"] = session_tag
        return redirect("/")

    @app.post("/logout")
    def logout():
        session.clear()
        return redirect("/login")

    @app.get("/")
    def index():
        return page("index.html")

    @app.get("/<any('app.js', 'style.css'):name>")
    def static_file(name):
        return page(name)

    @app.get("/api/state")
    def state():
        return jsonify(scanner.state())

    @app.get("/api/searches")
    def list_searches():
        return jsonify(searches=scanner.store.list_searches(), max=MAX_SEARCHES)

    @app.post("/api/searches")
    def add_search():
        if len(scanner.store.list_searches()) >= MAX_SEARCHES:
            return jsonify(error=f"{MAX_SEARCHES} recherches au maximum."), 400
        try:
            name, url, max_price = validate_search(request.get_json(force=True) or {}, scanner.domain)
            scanner.store.add_search(name, url, max_price)
        except (ValueError, TypeError) as exc:
            return jsonify(error=str(exc)), 400
        except sqlite3.IntegrityError:
            return jsonify(error="Une recherche porte déjà ce nom."), 400
        return jsonify(searches=scanner.store.list_searches()), 201

    @app.delete("/api/searches/<int:search_id>")
    def delete_search(search_id):
        scanner.store.delete_search(search_id)
        return jsonify(searches=scanner.store.list_searches())

    @app.get("/api/settings")
    def get_settings():
        return jsonify(scanner.settings())

    @app.put("/api/settings")
    def put_settings():
        try:
            values = validate_settings(request.get_json(force=True) or {})
        except (ValueError, TypeError, KeyError):
            return jsonify(error="Réglages invalides : bonne affaire entre 10 et 90 %, "
                                 "erreur de prix au-dessus (95 % max)."), 400
        scanner.store.set_settings(values)
        return jsonify(scanner.settings())

    @app.post("/api/resale")
    def resale():
        try:
            deal_id = int((request.get_json(force=True) or {})["id"])
        except (ValueError, KeyError, TypeError):
            return jsonify(error="Requête invalide"), 400
        deal = scanner.get_deal(deal_id)
        if not deal:
            return jsonify(error="Annonce inconnue"), 404
        return jsonify(write_listing(deal[0], deal[1], scanner.ai))

    return app


def env_flag(name: str, default: bool) -> bool:
    return os.getenv(name, "1" if default else "0").lower() in ("1", "true", "yes", "oui")


def main() -> None:
    from waitress import serve

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    password = os.getenv("BOT_PASSWORD", "")
    if not password:
        raise SystemExit("Définis le mot de passe du site : variable BOT_PASSWORD (10 caractères minimum).")
    data_dir = Path(os.getenv("DATA_DIR", "data"))
    store = Storage(data_dir / "vinted.db")
    scanner = Scanner(
        store,
        domain=os.getenv("VINTED_DOMAIN", "www.vinted.fr"),
        poll_seconds=float(os.getenv("POLL_SECONDS", "60")),
        ai=AIConfig(provider=os.getenv("AI_PROVIDER", "auto"),
                    model=os.getenv("AI_MODEL", "gemma3:4b"),
                    host=os.getenv("OLLAMA_HOST", "http://localhost:11434")),
    )
    app = create_app(scanner, password, load_secret_key(data_dir),
                     secure_cookies=env_flag("SECURE_COOKIES", True),
                     trust_proxy=env_flag("TRUST_PROXY", False))
    threading.Thread(target=scanner.run_forever, daemon=True).start()
    host, port = os.getenv("HOST", "127.0.0.1"), int(os.getenv("PORT", "8000"))
    log.info("Site du bot Vinted sur http://%s:%s", host, port)
    serve(app, host=host, port=port, threads=8, ident="")


if __name__ == "__main__":
    main()
