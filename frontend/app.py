"""
Coffee Code — Frontend web (Flask)
Panel de administración: Login + Gestión de Usuarios/Roles + Estadísticas.
Consume la API central (FastAPI) usando JWT guardado en la sesión de Flask.
"""
import os
from functools import wraps

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
ROLES_PANEL = {"Admin", "Cajero"}


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
    return redirect(url_for("usuarios") if session.get("access_token") else url_for("login"))


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
            flash("Acceso restringido: solo Admin o Cajero pueden entrar al panel.", "error")
            return render_template("login.html")

        session["access_token"] = body.get("access_token")
        session["usuario"] = usuario
        flash(f"Bienvenido, {usuario.get('nombre', '')}.", "success")
        return redirect(url_for("usuarios"))

    if session.get("access_token"):
        return redirect(url_for("usuarios"))
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
@login_required
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
@login_required
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
@login_required
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
        }
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
@login_required
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

    return render_template(
        "reportes.html",
        desde=desde,
        hasta=hasta,
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

    # Propagar rango de fechas si viene
    for k in ("desde", "hasta"):
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
