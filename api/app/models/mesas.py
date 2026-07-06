from typing import Optional
from pydantic import BaseModel, Field


class CrearMesa(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    capacidad: int = Field(default=4, gt=0)
    id_estatus: int = Field(gt=0)


class ActualizarMesa(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)
    capacidad: Optional[int] = Field(default=None, gt=0)
    id_estatus: Optional[int] = Field(default=None, gt=0)
