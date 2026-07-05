import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.credencial_usuario import CredencialUsuario
from app.data.usuario import Usuario
from app.data.rol import Rol

# Clave secreta para firmar los tokens. En producción debe venir de una variable
# de entorno; el valor por defecto es solo para desarrollo.
SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "coffee-code-super-secreto-cambiar-en-produccion"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# tokenUrl apunta al endpoint que emite el token (login por formulario)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/token")


def crear_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return correo
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )


def requiere_rol(*roles_permitidos: str):
    """Genera una dependencia que exige un token válido Y que el usuario tenga
    alguno de los roles indicados. Devuelve el usuario autenticado.

    Uso: dependencies=[Depends(requiere_rol("Admin", "Cajero"))]
    """
    def verificador(
        correo: Annotated[str, Depends(verificar_token)],
        db: Session = Depends(get_db)
    ) -> Usuario:
        cred = db.query(CredencialUsuario).filter(CredencialUsuario.correo == correo).first()
        usuario = db.query(Usuario).filter(Usuario.id == cred.id_usuario).first() if cred else None
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario del token no encontrado"
            )

        rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
        if not rol or rol.nombre not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: se requiere rol {' o '.join(roles_permitidos)}"
            )
        return usuario

    return verificador
