from sqlalchemy import Column, Integer, String
from app.data.db import Base


class Estatus(Base):
    __tablename__ = "estatus"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
