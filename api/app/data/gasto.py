from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, CheckConstraint, TIMESTAMP, func
from app.data.db import Base


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_categoria_gasto = Column(Integer, ForeignKey("categoria_gasto.id"), nullable=False)
    descripcion = Column(String(255), nullable=True)
    monto = Column(Numeric(10, 2), nullable=False)
    fecha_hora = Column(TIMESTAMP, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("monto > 0", name="ck_gastos_monto"),
    )
