from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, CheckConstraint
from app.data.db import Base


class Comida(Base):
    __tablename__ = "comida"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categoria_comidas.id"), nullable=False)
    id_estatus = Column(Integer, ForeignKey("estatus.id"), nullable=False)
    img = Column(String(300), nullable=True)

    __table_args__ = (
        CheckConstraint("precio >= 0", name="ck_comida_precio"),
    )
