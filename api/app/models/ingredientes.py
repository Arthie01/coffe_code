from typing import Optional
from pydantic import BaseModel, Field


class CrearIngrediente(BaseModel):
    nombre: str
    unidad_medida: str
    stock_actual: float = Field(default=0, ge=0)
    stock_minimo: float = Field(default=0, ge=0)


class ActualizarIngrediente(BaseModel):
    nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock_actual: Optional[float] = Field(default=None, ge=0)
    stock_minimo: Optional[float] = Field(default=None, ge=0)
