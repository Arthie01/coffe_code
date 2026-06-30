from sqlalchemy import Column, Integer, Text, Numeric, ForeignKey, CheckConstraint, TIMESTAMP, func
from app.data.db import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_mesa = Column(Integer, ForeignKey("mesas.id"), nullable=False)
    id_estatus = Column(Integer, ForeignKey("estatus.id"), nullable=False)
    precio_total = Column(Numeric(10, 2), nullable=False, server_default="0")
    notas = Column(Text, nullable=True)
    fecha_hora = Column(TIMESTAMP, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("precio_total >= 0", name="ck_pedidos_precio_total"),
    )
