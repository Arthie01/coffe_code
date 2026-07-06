from typing import Optional, Literal
from datetime import date
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.pago import Pago
from app.data.gasto import Gasto
from app.data.pedido import Pedido
from app.data.comida_pedido import ComidaPedido
from app.data.comida import Comida
from app.data.ingrediente import Ingrediente
from app.data.estatus import Estatus
from app.exportador import a_excel, a_pdf, a_excel_multi, a_pdf_multi
from app.security.oauth2 import verificar_token, requiere_rol

router = APIRouter(
    prefix="/v1/reportes",
    tags=["Reportes / Estadísticas"]
)

Formato = Literal["json", "pdf", "xlsx"]

MEDIA = {
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
}


def _filtrar_fechas(query, columna, desde: Optional[date], hasta: Optional[date]):
    if desde:
        query = query.filter(func.date(columna) >= desde)
    if hasta:
        query = query.filter(func.date(columna) <= hasta)
    return query


def _periodo_texto(desde: Optional[date], hasta: Optional[date]) -> str:
    if desde and hasta:
        return f"{desde} a {hasta}"
    if desde:
        return f"desde {desde}"
    if hasta:
        return f"hasta {hasta}"
    return "histórico completo"


# ══════════════════════════════════════════════
# Constructores de cada reporte
# Cada uno devuelve: {nombre, titulo, columnas, filas, data}
# ══════════════════════════════════════════════
def _rep_ganancias(db, desde, hasta):
    ingresos = _filtrar_fechas(
        db.query(func.coalesce(func.sum(Pago.monto_total), 0)), Pago.fecha_hora, desde, hasta
    ).scalar()
    egresos = _filtrar_fechas(
        db.query(func.coalesce(func.sum(Gasto.monto), 0)), Gasto.fecha_hora, desde, hasta
    ).scalar()
    num_pagos = _filtrar_fechas(db.query(func.count(Pago.id)), Pago.fecha_hora, desde, hasta).scalar()
    num_gastos = _filtrar_fechas(db.query(func.count(Gasto.id)), Gasto.fecha_hora, desde, hasta).scalar()

    ingresos = round(float(ingresos), 2)
    egresos = round(float(egresos), 2)
    ganancia = round(ingresos - egresos, 2)

    return {
        "nombre": "Ganancias",
        "titulo": f"Reporte de ganancias ({_periodo_texto(desde, hasta)})",
        "columnas": ["Concepto", "Monto"],
        "filas": [
            ["Ingresos (pagos)", ingresos],
            ["Egresos (gastos)", egresos],
            ["Ganancia neta", ganancia],
            ["N.º de pagos", num_pagos],
            ["N.º de gastos", num_gastos],
        ],
        "data": {
            "periodo": _periodo_texto(desde, hasta),
            "ingresos": ingresos, "egresos": egresos, "ganancia_neta": ganancia,
            "num_pagos": num_pagos, "num_gastos": num_gastos,
        },
    }


def _rep_productos(db, desde, hasta, orden, limite):
    unidades = func.sum(ComidaPedido.cantidad)
    q = (
        db.query(
            Comida.id, Comida.nombre,
            unidades.label("unidades"),
            func.sum(ComidaPedido.cantidad * Comida.precio).label("ingreso"),
        )
        .join(ComidaPedido, ComidaPedido.id_comida == Comida.id)
        .join(Pedido, Pedido.id == ComidaPedido.id_pedido)
    )
    cancelado_id = db.query(Estatus.id).filter(Estatus.nombre == "Cancelado").scalar()
    if cancelado_id:
        q = q.filter(Pedido.id_estatus != cancelado_id)
    q = _filtrar_fechas(q, Pedido.fecha_hora, desde, hasta)
    q = q.group_by(Comida.id, Comida.nombre)
    q = q.order_by(unidades.asc() if orden == "menos" else unidades.desc())
    q = q.limit(limite)

    resultados = q.all()
    data = [
        {"id_comida": r.id, "producto": r.nombre,
         "unidades_vendidas": int(r.unidades), "ingreso_generado": round(float(r.ingreso), 2)}
        for r in resultados
    ]
    etiqueta = "más vendidos" if orden == "mas" else "menos vendidos"
    return {
        "nombre": "Mas vendidos" if orden == "mas" else "Menos vendidos",
        "titulo": f"Productos {etiqueta} ({_periodo_texto(desde, hasta)})",
        "columnas": ["Producto", "Unidades vendidas", "Ingreso generado"],
        "filas": [[d["producto"], d["unidades_vendidas"], d["ingreso_generado"]] for d in data],
        "data": {"periodo": _periodo_texto(desde, hasta), "orden": orden, "productos": data},
    }


def _rep_pedidos(db, desde, hasta):
    q = (
        db.query(
            Estatus.nombre,
            func.count(Pedido.id).label("cantidad"),
            func.coalesce(func.sum(Pedido.precio_total), 0).label("total"),
        )
        .join(Estatus, Estatus.id == Pedido.id_estatus)
    )
    q = _filtrar_fechas(q, Pedido.fecha_hora, desde, hasta)
    q = q.group_by(Estatus.nombre).order_by(func.count(Pedido.id).desc())

    resultados = q.all()
    data = [
        {"estatus": r.nombre, "cantidad": int(r.cantidad), "total": round(float(r.total), 2)}
        for r in resultados
    ]
    total_pedidos = sum(d["cantidad"] for d in data)
    total_monto = round(sum(d["total"] for d in data), 2)

    filas = [[d["estatus"], d["cantidad"], d["total"]] for d in data]
    filas.append(["TOTAL", total_pedidos, total_monto])
    return {
        "nombre": "Pedidos",
        "titulo": f"Reporte de pedidos ({_periodo_texto(desde, hasta)})",
        "columnas": ["Estatus", "Cantidad de pedidos", "Total"],
        "filas": filas,
        "data": {
            "periodo": _periodo_texto(desde, hasta),
            "total_pedidos": total_pedidos, "total_monto": total_monto, "desglose": data,
        },
    }


def _rep_inventario(db, solo_bajo_minimo):
    ingredientes = db.query(Ingrediente).order_by(Ingrediente.nombre).all()
    data = []
    for ing in ingredientes:
        bajo = float(ing.stock_actual) <= float(ing.stock_minimo)
        if solo_bajo_minimo and not bajo:
            continue
        data.append({
            "id": ing.id, "ingrediente": ing.nombre, "unidad_medida": ing.unidad_medida,
            "stock_actual": float(ing.stock_actual), "stock_minimo": float(ing.stock_minimo),
            "bajo_minimo": bajo,
        })
    return {
        "nombre": "Inventario",
        "titulo": "Reporte de inventario" + (" (bajo mínimo)" if solo_bajo_minimo else ""),
        "columnas": ["Ingrediente", "Unidad", "Stock actual", "Stock mínimo", "¿Bajo mínimo?"],
        "filas": [
            [d["ingrediente"], d["unidad_medida"], d["stock_actual"], d["stock_minimo"],
             "Sí" if d["bajo_minimo"] else "No"]
            for d in data
        ],
        "data": {
            "total_ingredientes": len(data),
            "bajo_minimo": sum(1 for d in data if d["bajo_minimo"]),
            "inventario": data,
        },
    }


def _responder(formato: str, archivo: str, rep: dict):
    """Devuelve JSON o un archivo descargable (XLSX/PDF) para un solo reporte."""
    if formato == "xlsx":
        contenido = a_excel(rep["titulo"], rep["columnas"], rep["filas"])
        return Response(content=contenido, media_type=MEDIA["xlsx"],
                        headers={"Content-Disposition": f'attachment; filename="{archivo}.xlsx"'})
    if formato == "pdf":
        contenido = a_pdf(rep["titulo"], rep["columnas"], rep["filas"])
        return Response(content=contenido, media_type=MEDIA["pdf"],
                        headers={"Content-Disposition": f'attachment; filename="{archivo}.pdf"'})
    return {"status": "200", "data": rep["data"]}


# ══════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════
@router.get("/ganancias", status_code=status.HTTP_200_OK,
            dependencies=[Depends(requiere_rol("Admin", "Cajero"))])
async def reporte_ganancias(desde: Optional[date] = None, hasta: Optional[date] = None,
                            formato: Formato = "json", db: Session = Depends(get_db)):
    return _responder(formato, "ganancias", _rep_ganancias(db, desde, hasta))


@router.get("/productos-vendidos", status_code=status.HTTP_200_OK,
            dependencies=[Depends(requiere_rol("Admin", "Cajero"))])
async def reporte_productos_vendidos(desde: Optional[date] = None, hasta: Optional[date] = None,
                                     orden: Literal["mas", "menos"] = "mas", limite: int = 10,
                                     formato: Formato = "json", db: Session = Depends(get_db)):
    rep = _rep_productos(db, desde, hasta, orden, limite)
    return _responder(formato, f"productos_{orden}_vendidos", rep)


@router.get("/pedidos", status_code=status.HTTP_200_OK,
            dependencies=[Depends(verificar_token)])
async def reporte_pedidos(desde: Optional[date] = None, hasta: Optional[date] = None,
                          formato: Formato = "json", db: Session = Depends(get_db)):
    return _responder(formato, "pedidos", _rep_pedidos(db, desde, hasta))


@router.get("/inventario", status_code=status.HTTP_200_OK,
            dependencies=[Depends(verificar_token)])
async def reporte_inventario(solo_bajo_minimo: bool = False,
                             formato: Formato = "json", db: Session = Depends(get_db)):
    return _responder(formato, "inventario", _rep_inventario(db, solo_bajo_minimo))


@router.get("/general", status_code=status.HTTP_200_OK,
            dependencies=[Depends(requiere_rol("Admin", "Cajero"))])
async def reporte_general(desde: Optional[date] = None, hasta: Optional[date] = None,
                          formato: Formato = "json", db: Session = Depends(get_db)):
    """Reporte consolidado: todos los reportes en un solo archivo."""
    reps = [
        _rep_ganancias(db, desde, hasta),
        _rep_productos(db, desde, hasta, "mas", 10),
        _rep_productos(db, desde, hasta, "menos", 10),
        _rep_pedidos(db, desde, hasta),
        _rep_inventario(db, False),
    ]

    if formato == "xlsx":
        contenido = a_excel_multi(reps)
        return Response(content=contenido, media_type=MEDIA["xlsx"],
                        headers={"Content-Disposition": 'attachment; filename="reporte_general.xlsx"'})
    if formato == "pdf":
        secciones = [{"titulo": r["titulo"], "columnas": r["columnas"], "filas": r["filas"]} for r in reps]
        contenido = a_pdf_multi(f"Reporte general — Coffee Code ({_periodo_texto(desde, hasta)})", secciones)
        return Response(content=contenido, media_type=MEDIA["pdf"],
                        headers={"Content-Disposition": 'attachment; filename="reporte_general.pdf"'})

    return {"status": "200", "data": {r["nombre"]: r["data"] for r in reps}}
