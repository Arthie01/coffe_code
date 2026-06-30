from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.mesa import Mesa
from app.data.estatus import Estatus
from app.models.mesas import CrearMesa, ActualizarMesa
from app.security.auth import verificar_peticion

router = APIRouter(
    prefix="/v1/mesas",
    tags=["Mesas"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todas(id_estatus: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Mesa)
    if id_estatus:
        query = query.filter(Mesa.id_estatus == id_estatus)
    mesas = query.all()

    result = []
    for m in mesas:
        est = db.query(Estatus).filter(Estatus.id == m.id_estatus).first()
        result.append({
            "id": m.id,
            "nombre": m.nombre,
            "capacidad": m.capacidad,
            "id_estatus": m.id_estatus,
            "estatus": est.nombre if est else None
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_una(id: int, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id == id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail=f"Mesa con id {id} no encontrada")
    est = db.query(Estatus).filter(Estatus.id == mesa.id_estatus).first()
    return {
        "status": "200",
        "data": {
            "id": mesa.id,
            "nombre": mesa.nombre,
            "capacidad": mesa.capacidad,
            "id_estatus": mesa.id_estatus,
            "estatus": est.nombre if est else None
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearMesa, db: Session = Depends(get_db)):
    nueva = Mesa(
        nombre=data.nombre,
        capacidad=data.capacidad,
        id_estatus=data.id_estatus
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"status": "201", "mensaje": "Mesa creada", "data": nueva}


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarMesa, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id == id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail=f"Mesa con id {id} no encontrada")

    campos = data.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(mesa, campo, valor)

    db.commit()
    db.refresh(mesa)
    return {"status": "200", "mensaje": "Mesa actualizada", "data": mesa}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_peticion)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id == id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail=f"Mesa con id {id} no encontrada")
    db.delete(mesa)
    db.commit()
    return {"status": "200", "mensaje": "Mesa eliminada", "id": id}
