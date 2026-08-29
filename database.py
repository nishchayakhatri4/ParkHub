"""Small dependency-free client for the Supabase PostgREST API."""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


class DatabaseError(RuntimeError):
    pass


def _load_dotenv():
    """Load a local .env without overriding values already in the environment."""
    env_file = Path(__file__).with_name(".env")
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip("\"'"))


_load_dotenv()


def _setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise DatabaseError(
            f"{name} is not set. Copy .env.example, then export its values."
        )
    return value.rstrip("/") if name == "SUPABASE_URL" else value


def request(path: str, *, method: str = "GET", body=None, service=False):
    url = f"{_setting('SUPABASE_URL')}/rest/v1/{path}"
    key_name = "SUPABASE_SERVICE_ROLE_KEY" if service else "SUPABASE_ANON_KEY"
    key = _setting(key_name)
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if method in {"POST", "PATCH"} and not path.startswith("rpc/"):
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    try:
        with urllib.request.urlopen(
            urllib.request.Request(url, data=data, headers=headers, method=method),
            timeout=20,
        ) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except json.JSONDecodeError:
            pass
        raise DatabaseError(f"Supabase request failed ({error.code}): {detail}") from error
    except urllib.error.URLError as error:
        raise DatabaseError(f"Unable to connect to Supabase: {error.reason}") from error


def rpc(name: str, **arguments):
    return request(f"rpc/{name}", method="POST", body=arguments)


def login(role: str, email: str, password: str) -> dict | None:
    rows = rpc("login_account", p_role=role, p_email=email, p_password=password)
    return rows[0] if rows else None


def list_garages() -> list[dict]:
    return rpc("list_garages") or []


def owner_garages(session_token: str) -> list[dict]:
    return rpc("list_owner_garages", p_session_token=session_token) or []


def add_garage(session_token: str, garage: dict) -> str:
    return rpc("add_garage", p_session_token=session_token, **garage)


def remove_garage(session_token: str, parking_id: str) -> bool:
    return bool(rpc(
        "remove_garage", p_session_token=session_token, p_parking_id=parking_id
    ))
