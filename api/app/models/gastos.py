from typing import Optional, List
from pydantic import BaseModel, Field


class ItemCompraIngrediente(BaseModel):
    id_ingrediente: int
    cantidad: float = Field(gt=0)
    precio_unitario: float = Field(ge=0)


class CrearGasto(BaseModel):
    id_usuario: int
    id_categoria_gasto: int
    descripcion: Optional[str] = None
    monto: float = Field(gt=0)
    compra_ingredientes: Optional[List[ItemCompraIngrediente]] = None
