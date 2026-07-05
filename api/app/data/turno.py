from sqlalchemy import Column, Integer, String, Time
from app.data.db import Base


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
