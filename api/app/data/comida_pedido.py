from sqlalchemy import Column, Integer, SmallInteger, Text, ForeignKey, CheckConstraint
from app.data.db import Base


class ComidaPedido(Base):
    __tablename__ = "comida_pedido"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_comida = Column(Integer, ForeignKey("comida.id"), nullable=False)
    id_pedido = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    cantidad = Column(SmallInteger, nullable=False, server_default="1")
    observaciones = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_comida_pedido_cantidad"),
    )
