from typing import Optional, List
from pydantic import BaseModel, Field


class ItemPedido(BaseModel):
    id_comida: int = Field(gt=0)
    cantidad: int = Field(default=1, gt=0)
    observaciones: Optional[str] = None


class CrearPedido(BaseModel):
    id_mesa: int = Field(gt=0)
    notas: Optional[str] = None
    items: List[ItemPedido] = Field(min_length=1)
    id_mesero: Optional[int] = Field(default=None, gt=0)


class CambiarEstadoPedido(BaseModel):
    id_estatus: int = Field(gt=0)


class AsignarCocinero(BaseModel):
    id_usuario: int = Field(gt=0)


class AsignarMesero(BaseModel):
    id_usuario: int = Field(gt=0)
