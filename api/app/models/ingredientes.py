from typing import Optional
from pydantic import BaseModel, Field


class CrearIngrediente(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    unidad_medida: str = Field(min_length=1, max_length=30)
    stock_actual: float = Field(default=0, ge=0)
    stock_minimo: float = Field(default=0, ge=0)


class ActualizarIngrediente(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    unidad_medida: Optional[str] = Field(default=None, min_length=1, max_length=30)
    stock_actual: Optional[float] = Field(default=None, ge=0)
    stock_minimo: Optional[float] = Field(default=None, ge=0)
