from sqlalchemy import Column, Integer, String
from app.data.db import Base


class MetodoPago(Base):
    __tablename__ = "metodo_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
