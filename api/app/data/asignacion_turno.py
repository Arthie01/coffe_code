from sqlalchemy import Column, Integer, Date, TIMESTAMP, Text, ForeignKey, UniqueConstraint, func
from app.data.db import Base


class AsignacionTurno(Base):
    __tablename__ = "asignaciones_turno"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_turno = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    id_estatus = Column(Integer, ForeignKey("estatus.id"), nullable=False)
    fecha = Column(Date, nullable=False, server_default=func.current_date())
    hora_entrada = Column(TIMESTAMP, nullable=True)
    hora_salida = Column(TIMESTAMP, nullable=True)
    notas = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("id_usuario", "id_turno", "fecha", name="uq_asignacion_turno"),
    )
