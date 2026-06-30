from sqlalchemy import Column, Integer, String, Numeric, CheckConstraint
from app.data.db import Base


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    unidad_medida = Column(String(30), nullable=False)
    stock_actual = Column(Numeric(10, 3), nullable=False, server_default="0")
    stock_minimo = Column(Numeric(10, 3), nullable=False, server_default="0")

    __table_args__ = (
        CheckConstraint("stock_actual >= 0", name="ck_ingredientes_stock_actual"),
        CheckConstraint("stock_minimo >= 0", name="ck_ingredientes_stock_minimo"),
    )
