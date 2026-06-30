import bcrypt
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.usuario import Usuario
from app.data.credencial_usuario import CredencialUsuario
from app.data.rol import Rol
from app.data.estatus import Estatus
from app.models.usuarios import CrearUsuario, ActualizarUsuario
from app.security.auth import verificar_peticion

router = APIRouter(
    prefix="/v1/usuarios",
    tags=["Usuarios"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todos(
    id_rol: Optional[int] = None,
    id_estatus: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Usuario)
    if id_rol:
        query = query.filter(Usuario.id_rol == id_rol)
    if id_estatus:
        query = query.filter(Usuario.id_estatus == id_estatus)
    usuarios = query.all()

    result = []
    for u in usuarios:
        rol = db.query(Rol).filter(Rol.id == u.id_rol).first()
        est = db.query(Estatus).filter(Estatus.id == u.id_estatus).first()
        cred = db.query(CredencialUsuario).filter(CredencialUsuario.id_usuario == u.id).first()
        result.append({
            "id": u.id,
            "nombre": u.nombre,
            "apellido_p": u.apellido_p,
            "apellido_m": u.apellido_m,
            "id_rol": u.id_rol,
            "rol": rol.nombre if rol else None,
            "id_estatus": u.id_estatus,
            "estatus": est.nombre if est else None,
            "correo": cred.correo if cred else None
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {id} no encontrado")

    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
    est = db.query(Estatus).filter(Estatus.id == usuario.id_estatus).first()
    cred = db.query(CredencialUsuario).filter(CredencialUsuario.id_usuario == usuario.id).first()

    return {
        "status": "200",
        "data": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido_p": usuario.apellido_p,
            "apellido_m": usuario.apellido_m,
            "id_rol": usuario.id_rol,
            "rol": rol.nombre if rol else None,
            "id_estatus": usuario.id_estatus,
            "estatus": est.nombre if est else None,
            "correo": cred.correo if cred else None
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearUsuario, db: Session = Depends(get_db)):
    existe = db.query(CredencialUsuario).filter(
        CredencialUsuario.correo == data.correo
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    nuevo = Usuario(
        nombre=data.nombre,
        apellido_p=data.apellido_p,
        apellido_m=data.apellido_m,
        id_rol=data.id_rol,
        id_estatus=data.id_estatus
    )
    db.add(nuevo)
    db.flush()

    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())
    credencial = CredencialUsuario(
        id_usuario=nuevo.id,
        correo=data.correo,
        password_hash=hashed.decode("utf-8")
    )
    db.add(credencial)
    db.commit()
    db.refresh(nuevo)

    return {
        "status": "201",
        "mensaje": "Usuario creado",
        "data": {
            "id": nuevo.id,
            "nombre": nuevo.nombre,
            "correo": data.correo
        }
    }


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarUsuario, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {id} no encontrado")

    campos = data.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return {"status": "200", "mensaje": "Usuario actualizado", "data": usuario}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_peticion)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {id} no encontrado")

    cred = db.query(CredencialUsuario).filter(CredencialUsuario.id_usuario == id).first()
    if cred:
        db.delete(cred)

    db.delete(usuario)
    db.commit()
    return {"status": "200", "mensaje": "Usuario eliminado", "id": id}
