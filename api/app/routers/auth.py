import bcrypt
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.usuario import Usuario
from app.data.credencial_usuario import CredencialUsuario
from app.data.rol import Rol
from app.models.usuarios import CrearUsuario, LoginRequest

router = APIRouter(
    prefix="/v1/auth",
    tags=["Autenticación"]
)


@router.post("/registro", status_code=status.HTTP_201_CREATED)
async def registro(data: CrearUsuario, db: Session = Depends(get_db)):
    existe = db.query(CredencialUsuario).filter(
        CredencialUsuario.correo == data.correo
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    nuevo_usuario = Usuario(
        nombre=data.nombre,
        apellido_p=data.apellido_p,
        apellido_m=data.apellido_m,
        id_rol=data.id_rol,
        id_estatus=data.id_estatus
    )
    db.add(nuevo_usuario)
    db.flush()

    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())
    credencial = CredencialUsuario(
        id_usuario=nuevo_usuario.id,
        correo=data.correo,
        password_hash=hashed.decode("utf-8")
    )
    db.add(credencial)
    db.commit()
    db.refresh(nuevo_usuario)

    return {
        "status": "201",
        "mensaje": "Usuario registrado correctamente",
        "data": {
            "id": nuevo_usuario.id,
            "nombre": nuevo_usuario.nombre,
            "apellido_p": nuevo_usuario.apellido_p,
            "correo": data.correo
        }
    }


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    credencial = db.query(CredencialUsuario).filter(
        CredencialUsuario.correo == data.correo
    ).first()

    if not credencial:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not bcrypt.checkpw(data.password.encode("utf-8"), credencial.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    usuario = db.query(Usuario).filter(Usuario.id == credencial.id_usuario).first()
    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()

    if usuario.id_estatus != 1:
        raise HTTPException(status_code=403, detail="Cuenta inactiva o suspendida")

    return {
        "status": "200",
        "mensaje": "Login exitoso",
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
