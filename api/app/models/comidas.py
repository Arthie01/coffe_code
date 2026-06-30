from typing import Optional, List
from pydantic import BaseModel, Field


class IngredienteComidaSchema(BaseModel):
    id_ingrediente: int
    cantidad_requerida: float = Field(gt=0)
    unidad: str


class CrearComida(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(ge=0)
    id_categoria: int
    id_estatus: int
    ingredientes: Optional[List[IngredienteComidaSchema]] = None


class ActualizarComida(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(default=None, ge=0)
    id_categoria: Optional[int] = None
    id_estatus: Optional[int] = None
    ingredientes: Optional[List[IngredienteComidaSchema]] = None
