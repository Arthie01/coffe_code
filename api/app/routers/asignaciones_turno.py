from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.asignacion_turno import AsignacionTurno
from app.data.turno import Turno
from app.data.usuario import Usuario
from app.data.estatus import Estatus
from app.models.turnos import CrearAsignacionTurno, ActualizarAsignacionTurno
from app.security.oauth2 import verificar_token

router = APIRouter(
    prefix="/v1/asignaciones-turno",
    tags=["Asignaciones de turno"]
)


def _estatus_id(db: Session, nombre: str) -> Optional[int]:
    est = db.query(Estatus).filter(Estatus.nombre == nombre).first()
    return est.id if est else None


def _horas_trabajadas(entrada, salida) -> Optional[float]:
    if entrada and salida:
        return round((salida - entrada).total_seconds() / 3600, 2)
    return None


def _serializar(db: Session, a: AsignacionTurno) -> dict:
    turno = db.query(Turno).filter(Turno.id == a.id_turno).first()
    usuario = db.query(Usuario).filter(Usuario.id == a.id_usuario).first()
    est = db.query(Estatus).filter(Estatus.id == a.id_estatus).first()
    return {
        "id": a.id,
        "id_usuario": a.id_usuario,
        "empleado": f"{usuario.nombre} {usuario.apellido_p}" if usuario else None,
        "id_turno": a.id_turno,
        "turno": turno.nombre if turno else None,
        "horario": f"{turno.hora_inicio} - {turno.hora_fin}" if turno else None,
        "id_estatus": a.id_estatus,
        "estatus": est.nombre if est else None,
        "fecha": str(a.fecha),
        "hora_entrada": str(a.hora_entrada) if a.hora_entrada else None,
        "hora_salida": str(a.hora_salida) if a.hora_salida else None,
        "horas_trabajadas": _horas_trabajadas(a.hora_entrada, a.hora_salida),
        "notas": a.notas
    }


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todas(
    id_usuario: Optional[int] = None,
    id_turno: Optional[int] = None,
    id_estatus: Optional[int] = None,
    fecha: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AsignacionTurno)
    if id_usuario:
        query = query.filter(AsignacionTurno.id_usuario == id_usuario)
    if id_turno:
        query = query.filter(AsignacionTurno.id_turno == id_turno)
    if id_estatus:
        query = query.filter(AsignacionTurno.id_estatus == id_estatus)
    if fecha:
        query = query.filter(AsignacionTurno.fecha == fecha)

    asignaciones = query.order_by(AsignacionTurno.fecha.desc(), AsignacionTurno.id.desc()).all()
    result = [_serializar(db, a) for a in asignaciones]
    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_una(id: int, db: Session = Depends(get_db)):
    asignacion = db.query(AsignacionTurno).filter(AsignacionTurno.id == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail=f"Asignación con id {id} no encontrada")
    return {"status": "200", "data": _serializar(db, asignacion)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearAsignacionTurno, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == data.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {data.id_usuario} no encontrado")

    turno = db.query(Turno).filter(Turno.id == data.id_turno).first()
    if not turno:
        raise HTTPException(status_code=404, detail=f"Turno con id {data.id_turno} no encontrado")

    fecha = data.fecha or date.today()

    duplicado = db.query(AsignacionTurno).filter(
        AsignacionTurno.id_usuario == data.id_usuario,
        AsignacionTurno.id_turno == data.id_turno,
        AsignacionTurno.fecha == fecha
    ).first()
    if duplicado:
        raise HTTPException(
            status_code=400,
            detail="El empleado ya tiene asignado ese turno en esa fecha"
        )

    id_estatus = data.id_estatus or _estatus_id(db, "Programado")
    if not id_estatus:
        raise HTTPException(status_code=400, detail="No existe un estatus válido para la asignación")

    nueva = AsignacionTurno(
        id_usuario=data.id_usuario,
        id_turno=data.id_turno,
        id_estatus=id_estatus,
        fecha=fecha,
        notas=data.notas
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"status": "201", "mensaje": "Turno asignado", "data": _serializar(db, nueva)}


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarAsignacionTurno, db: Session = Depends(get_db)):
    asignacion = db.query(AsignacionTurno).filter(AsignacionTurno.id == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail=f"Asignación con id {id} no encontrada")

    campos = data.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(asignacion, campo, valor)

    db.commit()
    db.refresh(asignacion)
    return {"status": "200", "mensaje": "Asignación actualizada", "data": _serializar(db, asignacion)}


@router.post("/{id}/entrada", status_code=status.HTTP_200_OK)
async def registrar_entrada(id: int, db: Session = Depends(get_db)):
    asignacion = db.query(AsignacionTurno).filter(AsignacionTurno.id == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail=f"Asignación con id {id} no encontrada")
    if asignacion.hora_entrada:
        raise HTTPException(status_code=400, detail="La entrada ya fue registrada")

    asignacion.hora_entrada = datetime.now()
    id_en_turno = _estatus_id(db, "En turno")
    if id_en_turno:
        asignacion.id_estatus = id_en_turno

    db.commit()
    db.refresh(asignacion)
    return {"status": "200", "mensaje": "Entrada registrada", "data": _serializar(db, asignacion)}


@router.post("/{id}/salida", status_code=status.HTTP_200_OK)
async def registrar_salida(id: int, db: Session = Depends(get_db)):
    asignacion = db.query(AsignacionTurno).filter(AsignacionTurno.id == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail=f"Asignación con id {id} no encontrada")
    if not asignacion.hora_entrada:
        raise HTTPException(status_code=400, detail="No se puede registrar la salida sin una entrada previa")
    if asignacion.hora_salida:
        raise HTTPException(status_code=400, detail="La salida ya fue registrada")

    asignacion.hora_salida = datetime.now()
    id_finalizado = _estatus_id(db, "Finalizado")
    if id_finalizado:
        asignacion.id_estatus = id_finalizado

    db.commit()
    db.refresh(asignacion)
    return {"status": "200", "mensaje": "Salida registrada", "data": _serializar(db, asignacion)}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    asignacion = db.query(AsignacionTurno).filter(AsignacionTurno.id == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail=f"Asignación con id {id} no encontrada")
    db.delete(asignacion)
    db.commit()
    return {"status": "200", "mensaje": "Asignación eliminada", "id": id}
