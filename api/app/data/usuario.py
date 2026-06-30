from sqlalchemy import Column, Integer, String, ForeignKey
from app.data.db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido_p = Column(String(100), nullable=False)
    apellido_m = Column(String(100), nullable=True)
    id_rol = Column(Integer, ForeignKey("roles.id"), nullable=False)
    id_estatus = Column(Integer, ForeignKey("estatus.id"), nullable=False)
