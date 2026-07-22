"""
Coffee Code — Frontend web (Flask)
Panel de administración: Login + Gestión de Usuarios/Roles + Estadísticas.
Consume la API central (FastAPI) usando JWT guardado en la sesión de Flask.
"""
import os
from functools import wraps
from datetime import date, timedelta

import requests
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, Response
)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "coffee-code-frontend-dev-secret")

# URL base de la API. En Docker apunta al servicio 'fastapi'; en local a localhost.
API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")

# Solo estos roles pueden entrar al panel de gestión general.
# El dashboard web es exclusivo del Administrador.
ROLES_PANEL = {"Admin"}


# ══════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════
def api_headers():
    token = session.get("access_token")
    return {"Authorization": f"Bearer {token}"} if token else {}


def api_get(path, **kwargs):
    return requests.get(f"{API_URL}{path}", headers=api_headers(), timeout=15, **kwargs)


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("access_token"):
            flash("Inicia sesión para continuar.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    """Solo Admin. El Cajero se redirige a Estadísticas."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("access_token"):
            flash("Inicia sesión para continuar.", "warning")
            return redirect(url_for("login"))
        if session.get("usuario", {}).get("rol") != "Admin":
            flash("Acceso solo para Administradores.", "error")
            return redirect(url_for("reportes"))
        return f(*args, **kwargs)
    return wrapper


def _destino_inicial():
    """A dónde mandar tras el login según el rol."""
    rol = session.get("usuario", {}).get("rol")
    return "usuarios" if rol == "Admin" else "reportes"


def cargar_roles():
    try:
        r = api_get("/v1/catalogos/roles")
        return r.json().get("data", []) if r.ok else []
    except requests.RequestException:
        return []


def cargar_estatus_usuario():
    """Solo estatus relevantes para usuarios: Activo / Inactivo."""
    try:
        r = api_get("/v1/catalogos/estatus")
        data = r.json().get("data", []) if r.ok else []
        return [e for e in data if e["nombre"] in ("Activo", "Inactivo")]
    except requests.RequestException:
        return []


# ══════════════════════════════════════════════
# Autenticación
# ══════════════════════════════════════════════
@app.route("/")
def index():
    if session.get("access_token"):
        return redirect(url_for(_destino_inicial()))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        correo = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        try:
            r = requests.post(
                f"{API_URL}/v1/auth/login",
                json={"correo": correo, "password": password},
                timeout=15,
            )
        except requests.RequestException:
            flash("No se pudo conectar con la API. Intenta más tarde.", "error")
            return render_template("login.html")

        if not r.ok:
            detalle = r.json().get("detail", "Credenciales incorrectas") if r.content else "Credenciales incorrectas"
            flash(detalle, "error")
            return render_template("login.html")

        body = r.json()
        usuario = body.get("data", {})
        if usuario.get("rol") not in ROLES_PANEL:
            flash("Acceso restringido: solo el Administrador puede entrar al panel.", "error")
            return render_template("login.html")

        session["access_token"] = body.get("access_token")
        session["usuario"] = usuario
        flash(f"Bienvenido, {usuario.get('nombre', '')}.", "success")
        return redirect(url_for(_destino_inicial()))

    if session.get("access_token"):
        return redirect(url_for(_destino_inicial()))
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Sesión cerrada correctamente.", "success")
    return redirect(url_for("login"))


# ══════════════════════════════════════════════
# Módulo: Usuarios y roles
# ══════════════════════════════════════════════
@app.route("/usuarios")
@admin_required
def usuarios():
    r = api_get("/v1/usuarios")
    lista = r.json().get("data", []) if r.ok else []

    total = len(lista)
    activos = sum(1 for u in lista if u.get("estatus") == "Activo")
    inactivos = total - activos

    return render_template(
        "usuarios.html",
        usuarios=lista,
        roles=cargar_roles(),
        kpis={"total": total, "activos": activos, "inactivos": inactivos},
    )


@app.route("/usuarios/nuevo", methods=["GET", "POST"])
@admin_required
def usuario_nuevo():
    roles = cargar_roles()
    estatus = cargar_estatus_usuario()

    if request.method == "POST":
        payload = {
            "nombre": request.form.get("nombre", "").strip(),
            "apellido_p": request.form.get("apellido_p", "").strip(),
            "apellido_m": request.form.get("apellido_m", "").strip() or None,
            "id_rol": int(request.form.get("id_rol")),
            "id_estatus": int(request.form.get("id_estatus")),
            "correo": request.form.get("correo", "").strip(),
            "password": request.form.get("password", ""),
        }
        try:
            r = requests.post(f"{API_URL}/v1/usuarios", json=payload,
                              headers=api_headers(), timeout=15)
        except requests.RequestException:
            flash("No se pudo conectar con la API.", "error")
            return render_template("usuario_form.html", modo="nuevo",
                                   roles=roles, estatus=estatus, usuario=payload)

        if r.ok:
            flash("Usuario creado correctamente.", "success")
            return redirect(url_for("usuarios"))
        flash(r.json().get("detail", "No se pudo crear el usuario."), "error")
        return render_template("usuario_form.html", modo="nuevo",
                               roles=roles, estatus=estatus, usuario=payload)

    return render_template("usuario_form.html", modo="nuevo",
                           roles=roles, estatus=estatus, usuario={})


@app.route("/usuarios/<int:id>/editar", methods=["GET", "POST"])
@admin_required
def usuario_editar(id):
    roles = cargar_roles()
    estatus = cargar_estatus_usuario()

    if request.method == "POST":
        payload = {
            "nombre": request.form.get("nombre", "").strip(),
            "apellido_p": request.form.get("apellido_p", "").strip(),
            "apellido_m": request.form.get("apellido_m", "").strip() or None,
            "id_rol": int(request.form.get("id_rol")),
            "id_estatus": int(request.form.get("id_estatus")),
            "correo": request.form.get("correo", "").strip(),
        }
        nueva_password = request.form.get("password", "").strip()
        if nueva_password:
            payload["password"] = nueva_password
        try:
            r = requests.patch(f"{API_URL}/v1/usuarios/{id}", json=payload,
                               headers=api_headers(), timeout=15)
        except requests.RequestException:
            flash("No se pudo conectar con la API.", "error")
            return redirect(url_for("usuarios"))

        if r.ok:
            flash("Usuario actualizado.", "success")
            return redirect(url_for("usuarios"))
        flash(r.json().get("detail", "No se pudo actualizar."), "error")

    r = api_get(f"/v1/usuarios/{id}")
    if not r.ok:
        flash("Usuario no encontrado.", "error")
        return redirect(url_for("usuarios"))

    return render_template("usuario_form.html", modo="editar",
                           roles=roles, estatus=estatus, usuario=r.json().get("data", {}))


@app.route("/usuarios/<int:id>/eliminar", methods=["POST"])
@admin_required
def usuario_eliminar(id):
    try:
        r = requests.delete(f"{API_URL}/v1/usuarios/{id}", headers=api_headers(), timeout=15)
        if r.ok:
            flash("Usuario eliminado.", "success")
        else:
            flash(r.json().get("detail", "No se pudo eliminar."), "error")
    except requests.RequestException:
        flash("No se pudo conectar con la API.", "error")
    return redirect(url_for("usuarios"))


# ══════════════════════════════════════════════
# Módulo: Estadísticas / Reportes
# ══════════════════════════════════════════════
REPORTES = {
    "ganancias": "/v1/reportes/ganancias",
    "productos-mas": "/v1/reportes/productos-vendidos?orden=mas&limite=5",
    "productos-menos": "/v1/reportes/productos-vendidos?orden=menos&limite=5",
    "pedidos": "/v1/reportes/pedidos",
    "inventario": "/v1/reportes/inventario",
    "general": "/v1/reportes/general",
}


@app.route("/reportes")
@login_required
def reportes():
    desde = request.args.get("desde") or ""
    hasta = request.args.get("hasta") or ""
    rango = ""
    if desde:
        rango += f"&desde={desde}"
    if hasta:
        rango += f"&hasta={hasta}"

    def fetch(path):
        sep = "&" if "?" in path else "?"
        try:
            r = api_get(f"{path}{sep}{rango.lstrip('&')}" if rango else path)
            return r.json().get("data", {}) if r.ok else {}
        except requests.RequestException:
            return {}

    # Rangos rápidos (chips de filtro)
    hoy = date.today()
    presets = [
        {"key": "hoy",  "label": "Hoy",     "desde": hoy.isoformat(),                        "hasta": hoy.isoformat()},
        {"key": "7d",   "label": "7 días",  "desde": (hoy - timedelta(days=6)).isoformat(),  "hasta": hoy.isoformat()},
        {"key": "30d",  "label": "30 días", "desde": (hoy - timedelta(days=29)).isoformat(), "hasta": hoy.isoformat()},
        {"key": "todo", "label": "Todo",    "desde": "",                                     "hasta": ""},
    ]
    preset_activo = next((p["key"] for p in presets if p["desde"] == desde and p["hasta"] == hasta), None)

    return render_template(
        "reportes.html",
        desde=desde,
        hasta=hasta,
        presets=presets,
        preset_activo=preset_activo,
        ganancias=fetch(REPORTES["ganancias"]),
        mas_vendidos=fetch(REPORTES["productos-mas"]),
        menos_vendidos=fetch(REPORTES["productos-menos"]),
        pedidos=fetch(REPORTES["pedidos"]),
        inventario=fetch(REPORTES["inventario"]),
    )


@app.route("/reportes/descargar/<reporte>/<formato>")
@login_required
def descargar_reporte(reporte, formato):
    if reporte not in REPORTES or formato not in ("pdf", "xlsx"):
        flash("Reporte o formato no válido.", "error")
        return redirect(url_for("reportes"))

    path = REPORTES[reporte]
    sep = "&" if "?" in path else "?"
    url = f"{API_URL}{path}{sep}formato={formato}"

    # Propagar rango de fechas y selección de reportes si vienen
    for k in ("desde", "hasta", "reportes"):
        v = request.args.get(k)
        if v:
            url += f"&{k}={v}"

    try:
        r = requests.get(url, headers=api_headers(), timeout=30)
    except requests.RequestException:
        flash("No se pudo generar el archivo.", "error")
        return redirect(url_for("reportes"))

    if not r.ok:
        flash("La API no autorizó o no pudo generar el reporte.", "error")
        return redirect(url_for("reportes"))

    return Response(
        r.content,
        content_type=r.headers.get("Content-Type", "application/octet-stream"),
        headers={"Content-Disposition": r.headers.get(
            "Content-Disposition", f'attachment; filename="{reporte}.{formato}"')},
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
