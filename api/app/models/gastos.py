from typing import Optional, List
from pydantic import BaseModel, Field


class ItemCompraIngrediente(BaseModel):
    id_ingrediente: int = Field(gt=0)
    cantidad: float = Field(gt=0)
    precio_unitario: float = Field(ge=0)


class CrearGasto(BaseModel):
    id_usuario: int = Field(gt=0)
    id_categoria_gasto: int = Field(gt=0)
    descripcion: Optional[str] = Field(default=None, max_length=255)
    monto: float = Field(gt=0)
    compra_ingredientes: Optional[List[ItemCompraIngrediente]] = None
