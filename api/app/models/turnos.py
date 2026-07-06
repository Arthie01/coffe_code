from typing import Optional
from datetime import time, date
from pydantic import BaseModel, Field


# ── Turnos (catálogo) ─────────────────────────
class CrearTurno(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    hora_inicio: time
    hora_fin: time

class ActualizarTurno(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None


# ── Asignación de turno ───────────────────────
class CrearAsignacionTurno(BaseModel):
    id_usuario: int = Field(gt=0)
    id_turno: int = Field(gt=0)
    id_estatus: Optional[int] = Field(default=None, gt=0)   # si no se envía, se usa "Programado"
    fecha: Optional[date] = None                             # si no se envía, se usa la fecha de hoy
    notas: Optional[str] = None

class ActualizarAsignacionTurno(BaseModel):
    id_turno: Optional[int] = Field(default=None, gt=0)
    id_estatus: Optional[int] = Field(default=None, gt=0)
    fecha: Optional[date] = None
    notas: Optional[str] = None
