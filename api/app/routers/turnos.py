from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.turno import Turno
from app.models.turnos import CrearTurno, ActualizarTurno
from app.security.oauth2 import verificar_token

router = APIRouter(
    prefix="/v1/turnos",
    tags=["Turnos"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todos(db: Session = Depends(get_db)):
    turnos = db.query(Turno).order_by(Turno.hora_inicio).all()

    result = []
    for t in turnos:
        result.append({
            "id": t.id,
            "nombre": t.nombre,
            "hora_inicio": str(t.hora_inicio),
            "hora_fin": str(t.hora_fin)
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == id).first()
    if not turno:
        raise HTTPException(status_code=404, detail=f"Turno con id {id} no encontrado")
    return {
        "status": "200",
        "data": {
            "id": turno.id,
            "nombre": turno.nombre,
            "hora_inicio": str(turno.hora_inicio),
            "hora_fin": str(turno.hora_fin)
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearTurno, db: Session = Depends(get_db)):
    existe = db.query(Turno).filter(Turno.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El turno ya existe")

    nuevo = Turno(
        nombre=data.nombre,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Turno creado", "data": nuevo}


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarTurno, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == id).first()
    if not turno:
        raise HTTPException(status_code=404, detail=f"Turno con id {id} no encontrado")

    campos = data.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(turno, campo, valor)

    db.commit()
    db.refresh(turno)
    return {"status": "200", "mensaje": "Turno actualizado", "data": turno}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == id).first()
    if not turno:
        raise HTTPException(status_code=404, detail=f"Turno con id {id} no encontrado")
    db.delete(turno)
    db.commit()
    return {"status": "200", "mensaje": "Turno eliminado", "id": id}
