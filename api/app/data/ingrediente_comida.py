from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, UniqueConstraint, CheckConstraint
from app.data.db import Base


class IngredienteComida(Base):
    __tablename__ = "ingredientes_comida"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_ingrediente = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    id_comida = Column(Integer, ForeignKey("comida.id"), nullable=False)
    cantidad_requerida = Column(Numeric(10, 3), nullable=False)
    unidad = Column(String(30), nullable=False)

    __table_args__ = (
        UniqueConstraint("id_ingrediente", "id_comida", name="uq_ingrediente_comida"),
        CheckConstraint("cantidad_requerida > 0", name="ck_ing_comida_cantidad"),
    )
