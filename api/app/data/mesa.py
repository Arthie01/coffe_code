from sqlalchemy import Column, Integer, String, SmallInteger, ForeignKey, CheckConstraint
from app.data.db import Base


class Mesa(Base):
    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False)
    capacidad = Column(SmallInteger, nullable=False, server_default="4")
    id_estatus = Column(Integer, ForeignKey("estatus.id"), nullable=False)

    __table_args__ = (
        CheckConstraint("capacidad > 0", name="ck_mesas_capacidad"),
    )
