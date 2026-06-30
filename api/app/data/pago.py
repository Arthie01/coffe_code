from sqlalchemy import Column, Integer, Numeric, ForeignKey, CheckConstraint, TIMESTAMP, func
from app.data.db import Base


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id"), nullable=False, unique=True)
    id_metodo_pago = Column(Integer, ForeignKey("metodo_pago.id"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    monto_total = Column(Numeric(10, 2), nullable=False)
    monto_recibido = Column(Numeric(10, 2), nullable=False)
    cambio = Column(Numeric(10, 2), nullable=False, server_default="0")
    fecha_hora = Column(TIMESTAMP, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("monto_total >= 0", name="ck_pagos_monto_total"),
        CheckConstraint("monto_recibido >= 0", name="ck_pagos_monto_recibido"),
        CheckConstraint("cambio >= 0", name="ck_pagos_cambio"),
    )
