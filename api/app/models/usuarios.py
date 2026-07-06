from typing import Optional
from pydantic import BaseModel, Field
from app.models.validadores import CorreoCoffee, NombrePersona


class CrearUsuario(BaseModel):
    nombre: NombrePersona
    apellido_p: NombrePersona
    apellido_m: Optional[NombrePersona] = None
    id_rol: int = Field(gt=0)
    id_estatus: int = Field(gt=0)
    correo: CorreoCoffee
    password: str = Field(min_length=8, max_length=72)


class ActualizarUsuario(BaseModel):
    nombre: Optional[NombrePersona] = None
    apellido_p: Optional[NombrePersona] = None
    apellido_m: Optional[NombrePersona] = None
    id_rol: Optional[int] = Field(default=None, gt=0)
    id_estatus: Optional[int] = Field(default=None, gt=0)
    correo: Optional[CorreoCoffee] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)


class LoginRequest(BaseModel):
    correo: str = Field(min_length=1)
    password: str = Field(min_length=1)
