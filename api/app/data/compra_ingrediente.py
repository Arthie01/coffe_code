from sqlalchemy import Column, Integer, Numeric, ForeignKey, CheckConstraint
from app.data.db import Base


class CompraIngrediente(Base):
    __tablename__ = "compra_ingredientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_gasto = Column(Integer, ForeignKey("gastos.id"), nullable=False)
    id_ingrediente = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    cantidad = Column(Numeric(10, 3), nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_compra_ing_cantidad"),
        CheckConstraint("precio_unitario >= 0", name="ck_compra_ing_precio"),
    )
