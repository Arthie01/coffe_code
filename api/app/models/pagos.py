from typing import Optional
from pydantic import BaseModel, Field


class CrearPago(BaseModel):
    id_pedido: int = Field(gt=0)
    id_metodo_pago: int = Field(gt=0)
    # Opcional: efectivo que entrega el cliente. Si no se envía, se cobra el monto exacto.
    monto_recibido: Optional[float] = Field(default=None, ge=0)
