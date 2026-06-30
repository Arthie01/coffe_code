from sqlalchemy import Column, Integer, String
from app.data.db import Base


class CategoriaGasto(Base):
    __tablename__ = "categoria_gasto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
