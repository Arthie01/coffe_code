import bcrypt
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.usuario import Usuario
from app.data.credencial_usuario import CredencialUsuario
from app.data.rol import Rol
from app.models.usuarios import LoginRequest
from app.security.oauth2 import crear_token

router = APIRouter(
    prefix="/v1/auth",
    tags=["Autenticación"]
)


def _autenticar(db: Session, correo: str, password: str):
    """Valida credenciales y devuelve (usuario, credencial, rol) o lanza 401/403."""
    credencial = db.query(CredencialUsuario).filter(
        CredencialUsuario.correo == correo
    ).first()

    if not credencial:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not bcrypt.checkpw(password.encode("utf-8"), credencial.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    usuario = db.query(Usuario).filter(Usuario.id == credencial.id_usuario).first()
    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()

    if usuario.id_estatus != 1:
        raise HTTPException(status_code=403, detail="Cuenta inactiva o suspendida")

    return usuario, credencial, rol


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión con correo y contraseña y devuelve el token JWT + datos del usuario."""
    usuario, credencial, rol = _autenticar(db, data.correo, data.password)
    access_token = crear_token(data={"sub": credencial.correo, "id": usuario.id})

    return {
        "status": "200",
        "mensaje": "Login exitoso",
        "access_token": access_token,
        "token_type": "bearer",
        "data": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido_p": usuario.apellido_p,
            "apellido_m": usuario.apellido_m,
            "correo": credencial.correo,
            "rol": rol.nombre if rol else None,
            "id_rol": usuario.id_rol,
            "id_estatus": usuario.id_estatus
        }
    }
