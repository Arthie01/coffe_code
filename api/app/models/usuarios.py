from typing import Optional
from pydantic import BaseModel, EmailStr


class CrearUsuario(BaseModel):
    nombre: str
    apellido_p: str
    apellido_m: Optional[str] = None
    id_rol: int
    id_estatus: int
    correo: str
    password: str


class ActualizarUsuario(BaseModel):
    nombre: Optional[str] = None
    apellido_p: Optional[str] = None
    apellido_m: Optional[str] = None
    id_rol: Optional[int] = None
    id_estatus: Optional[int] = None


class LoginRequest(BaseModel):
    correo: str
    password: str
