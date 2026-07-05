from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.gasto import Gasto
from app.data.compra_ingrediente import CompraIngrediente
from app.data.ingrediente import Ingrediente
from app.data.categoria_gasto import CategoriaGasto
from app.data.usuario import Usuario
from app.models.gastos import CrearGasto
from app.security.oauth2 import verificar_token

router = APIRouter(
    prefix="/v1/gastos",
    tags=["Gastos"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todos(
    id_categoria_gasto: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Gasto).order_by(Gasto.fecha_hora.desc())
    if id_categoria_gasto:
        query = query.filter(Gasto.id_categoria_gasto == id_categoria_gasto)
    gastos = query.all()

    result = []
    for g in gastos:
        cat = db.query(CategoriaGasto).filter(CategoriaGasto.id == g.id_categoria_gasto).first()
        usuario = db.query(Usuario).filter(Usuario.id == g.id_usuario).first()
        result.append({
            "id": g.id,
            "id_usuario": g.id_usuario,
            "usuario": f"{usuario.nombre} {usuario.apellido_p}" if usuario else None,
            "id_categoria_gasto": g.id_categoria_gasto,
            "categoria": cat.nombre if cat else None,
            "descripcion": g.descripcion,
            "monto": float(g.monto),
            "fecha_hora": str(g.fecha_hora)
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    gasto = db.query(Gasto).filter(Gasto.id == id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail=f"Gasto con id {id} no encontrado")

    cat = db.query(CategoriaGasto).filter(CategoriaGasto.id == gasto.id_categoria_gasto).first()
    usuario = db.query(Usuario).filter(Usuario.id == gasto.id_usuario).first()

    compras_db = db.query(CompraIngrediente).filter(CompraIngrediente.id_gasto == id).all()
    compras = []
    for c in compras_db:
        ing = db.query(Ingrediente).filter(Ingrediente.id == c.id_ingrediente).first()
        compras.append({
            "id": c.id,
            "id_ingrediente": c.id_ingrediente,
            "ingrediente": ing.nombre if ing else None,
            "cantidad": float(c.cantidad),
            "precio_unitario": float(c.precio_unitario),
            "subtotal": round(float(c.cantidad) * float(c.precio_unitario), 2)
        })

    return {
        "status": "200",
        "data": {
            "id": gasto.id,
            "usuario": f"{usuario.nombre} {usuario.apellido_p}" if usuario else None,
            "categoria": cat.nombre if cat else None,
            "descripcion": gasto.descripcion,
            "monto": float(gasto.monto),
            "fecha_hora": str(gasto.fecha_hora),
            "compra_ingredientes": compras
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearGasto, db: Session = Depends(get_db)):
    nuevo = Gasto(
        id_usuario=data.id_usuario,
        id_categoria_gasto=data.id_categoria_gasto,
        descripcion=data.descripcion,
        monto=data.monto
    )
    db.add(nuevo)
    db.flush()

    if data.compra_ingredientes:
        for item in data.compra_ingredientes:
            ingrediente = db.query(Ingrediente).filter(Ingrediente.id == item.id_ingrediente).first()
            if not ingrediente:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ingrediente con id {item.id_ingrediente} no encontrado"
                )

            db.add(CompraIngrediente(
                id_gasto=nuevo.id,
                id_ingrediente=item.id_ingrediente,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            ))

            ingrediente.stock_actual = float(ingrediente.stock_actual) + item.cantidad

    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Gasto registrado", "data": nuevo}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    gasto = db.query(Gasto).filter(Gasto.id == id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail=f"Gasto con id {id} no encontrado")

    db.query(CompraIngrediente).filter(CompraIngrediente.id_gasto == id).delete()
    db.delete(gasto)
    db.commit()
    return {"status": "200", "mensaje": "Gasto eliminado", "id": id}
