"""Génère vinted_deals.py : tout le site (serveur + pages web) dans un seul fichier.

Usage : python build_single_file.py
"""
from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).parent
PACKAGE = ROOT / "vinted_bot"
MODULES = ["vinted", "pricing", "storage", "resale", "scanner", "server"]   # ordre des dépendances
OUTPUT = ROOT / "vinted_deals.py"

HEADER = '''#!/usr/bin/env python3
"""Vinted Deals : site de détection d'erreurs de prix Vinted, en un seul fichier.

Installation :  pip install requests flask waitress
Lancement :     BOT_PASSWORD="ton-mot-de-passe" SECURE_COOKIES=0 python vinted_deals.py
Puis ouvre http://localhost:8000 (voir le README pour l'hébergement en HTTPS).

Fichier généré par build_single_file.py à partir du dossier vinted_bot/ : ne pas modifier à la main.
"""
from __future__ import annotations
'''


def split_module(source: str) -> tuple[list[ast.stmt], str, str]:
    """Sépare les imports de haut niveau, la docstring et le reste du code."""
    tree = ast.parse(source)
    lines = source.splitlines()
    drop: set[int] = set()
    imports: list[ast.stmt] = []
    doc = ""
    for i, node in enumerate(tree.body):
        span = range(node.lineno - 1, node.end_lineno)
        if i == 0 and isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant):
            doc = node.value.value.splitlines()[0]
            drop.update(span)
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            drop.update(span)
            if isinstance(node, ast.ImportFrom) and (node.level or node.module == "__future__"):
                continue
            imports.append(node)
    body = "\n".join(line for j, line in enumerate(lines) if j not in drop).strip("\n")
    return imports, doc, body


def import_lines(nodes: list[ast.stmt]) -> tuple[list[str], list[str]]:
    """Fusionne les imports de tous les modules, bibliothèque standard d'abord."""
    plain: set[str] = set()
    from_names: dict[str, set[str]] = {}
    for node in nodes:
        if isinstance(node, ast.Import):
            plain.update(a.name for a in node.names)
        else:
            from_names.setdefault(node.module, set()).update(a.name for a in node.names)
    lines = [f"import {m}" for m in plain] + [
        f"from {m} import {', '.join(sorted(n, key=str.lower))}" for m, n in from_names.items()]
    third_party = ("requests", "flask", "werkzeug")
    key = lambda line: line.split()[1]
    stdlib = sorted((l for l in lines if not key(l).startswith(third_party)), key=key)
    third = sorted((l for l in lines if key(l).startswith(third_party)), key=key)
    return stdlib, third


def assets_literal() -> str:
    """Les pages du site, en clair dans le fichier."""
    parts = []
    for path in sorted((PACKAGE / "web").iterdir()):
        text = path.read_text(encoding="utf-8")
        if "'''" in text or text.endswith("\\"):
            raise SystemExit(f"{path.name} ne peut pas être intégré tel quel")
        parts.append(f'    "{path.name}": r\'\'\'{text}\'\'\',')
    return "ASSETS: dict[str, str] = {\n" + "\n".join(parts) + "\n}"


def main() -> None:
    imports: list[ast.stmt] = []
    sections: list[str] = []
    for name in MODULES:
        mod_imports, doc, body = split_module((PACKAGE / f"{name}.py").read_text(encoding="utf-8"))
        imports += mod_imports
        sections.append(f"# {'=' * 76}\n# {name}.py : {doc}\n# {'=' * 76}\n\n{body}")

    stdlib, third = import_lines(imports)
    code = "\n\n\n".join(sections)
    if "ASSETS: dict[str, str] = {}" not in code:
        raise SystemExit("ASSETS introuvable dans server.py")
    code = code.replace("ASSETS: dict[str, str] = {}", assets_literal())
    OUTPUT.write_text(
        HEADER + "\n" + "\n".join(stdlib) + "\n\n" + "\n".join(third) + "\n\n\n" + code + "\n",
        encoding="utf-8",
    )
    print(f"{OUTPUT.name} généré ({OUTPUT.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
