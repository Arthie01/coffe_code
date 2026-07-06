from typing import Optional, List
from pydantic import BaseModel, Field


class IngredienteComidaSchema(BaseModel):
    id_ingrediente: int = Field(gt=0)
    cantidad_requerida: float = Field(gt=0)
    unidad: str = Field(min_length=1, max_length=30)


class CrearComida(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    descripcion: Optional[str] = None
    precio: float = Field(ge=0)
    id_categoria: int = Field(gt=0)
    id_estatus: int = Field(gt=0)
    ingredientes: Optional[List[IngredienteComidaSchema]] = None


class ActualizarComida(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=150)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(default=None, ge=0)
    id_categoria: Optional[int] = Field(default=None, gt=0)
    id_estatus: Optional[int] = Field(default=None, gt=0)
    ingredientes: Optional[List[IngredienteComidaSchema]] = None
