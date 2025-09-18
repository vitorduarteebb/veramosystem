# veramo_backend/core/health.py
from datetime import datetime
from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection

STARTED_AT = datetime.utcnow()

def live(request):
    # Só prova que o app está de pé
    return JsonResponse({"status": "ok", "since": STARTED_AT.isoformat() + "Z"})

def ready(request):
    # Verifica dependências críticas (DB + Redis/Cache)
    db_ok, cache_ok = False, False
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1;")
        db_ok = True
    except Exception:
        db_ok = False

    try:
        cache.set("healthcheck", "ok", 5)
        cache_ok = cache.get("healthcheck") == "ok"
    except Exception:
        cache_ok = False

    ok = db_ok and cache_ok
    return JsonResponse(
        {"status": "ok" if ok else "fail", "db": db_ok, "cache": cache_ok},
        status=200 if ok else 503,
    )

def detailed(request):
    # Info simples sem vazar PII
    return JsonResponse({
        "app": "Veramo3",
        "started_at": STARTED_AT.isoformat() + "Z",
        "timezone": "America/Sao_Paulo",
        "services": {
            "database": _check_db(),
            "cache": _check_cache(),
        },
    })

def _check_db():
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1;")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}

def _check_cache():
    try:
        cache.set("healthcheck", "ok", 5)
        return {"ok": cache.get("healthcheck") == "ok"}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}
