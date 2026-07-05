from typing import Optional
from datetime import time, date
from pydantic import BaseModel


# ── Turnos (catálogo) ─────────────────────────
class CrearTurno(BaseModel):
    nombre: str
    hora_inicio: time
    hora_fin: time

class ActualizarTurno(BaseModel):
    nombre: Optional[str] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None


# ── Asignación de turno ───────────────────────
class CrearAsignacionTurno(BaseModel):
    id_usuario: int
    id_turno: int
    id_estatus: Optional[int] = None   # si no se envía, se usa "Programado"
    fecha: Optional[date] = None        # si no se envía, se usa la fecha de hoy
    notas: Optional[str] = None

class ActualizarAsignacionTurno(BaseModel):
    id_turno: Optional[int] = None
    id_estatus: Optional[int] = None
    fecha: Optional[date] = None
    notas: Optional[str] = None
