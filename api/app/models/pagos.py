from pydantic import BaseModel, Field


class CrearPago(BaseModel):
    id_pedido: int
    id_metodo_pago: int
    id_usuario: int
    monto_recibido: float = Field(ge=0)
