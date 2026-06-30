from typing import Optional
from pydantic import BaseModel, Field


class CrearMesa(BaseModel):
    nombre: str
    capacidad: int = Field(default=4, gt=0)
    id_estatus: int


class ActualizarMesa(BaseModel):
    nombre: Optional[str] = None
    capacidad: Optional[int] = Field(default=None, gt=0)
    id_estatus: Optional[int] = None
