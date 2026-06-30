from typing import Optional, List
from pydantic import BaseModel, Field


class ItemPedido(BaseModel):
    id_comida: int
    cantidad: int = Field(default=1, gt=0)
    observaciones: Optional[str] = None


class CrearPedido(BaseModel):
    id_mesa: int
    notas: Optional[str] = None
    items: List[ItemPedido]
    id_mesero: Optional[int] = None


class CambiarEstadoPedido(BaseModel):
    id_estatus: int


class AsignarCocinero(BaseModel):
    id_usuario: int


class AsignarMesero(BaseModel):
    id_usuario: int
