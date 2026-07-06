from pydantic import BaseModel, Field


class CrearPago(BaseModel):
    id_pedido: int = Field(gt=0)
    id_metodo_pago: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    monto_recibido: float = Field(ge=0)
