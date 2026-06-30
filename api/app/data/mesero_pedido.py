from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func
from app.data.db import Base


class MeseroPedido(Base):
    __tablename__ = "mesero_pedido"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_pedido = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    fecha_asignacion = Column(TIMESTAMP, nullable=False, server_default=func.now())
