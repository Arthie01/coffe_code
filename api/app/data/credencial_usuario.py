from sqlalchemy import Column, Integer, String, ForeignKey
from app.data.db import Base


class CredencialUsuario(Base):
    __tablename__ = "credenciales_usuario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False, unique=True)
    correo = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
