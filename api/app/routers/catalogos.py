from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.rol import Rol
from app.data.estatus import Estatus
from app.data.metodo_pago import MetodoPago
from app.data.categoria_gasto import CategoriaGasto
from app.data.categoria_comida import CategoriaComida
from app.models.catalogos import (
    CrearRol, ActualizarRol,
    CrearEstatus, ActualizarEstatus,
    CrearMetodoPago, ActualizarMetodoPago,
    CrearCategoriaGasto, ActualizarCategoriaGasto,
    CrearCategoriaComida, ActualizarCategoriaComida,
)
from app.security.oauth2 import verificar_token

router = APIRouter(
    prefix="/v1/catalogos",
    tags=["Catálogos"]
)


# ══════════════════════════════════════════════
# ROLES
# ══════════════════════════════════════════════

@router.get("/roles", status_code=status.HTTP_200_OK)
async def consultar_roles(db: Session = Depends(get_db)):
    roles = db.query(Rol).all()
    return {"status": "200", "total": len(roles), "data": roles}


@router.post("/roles", status_code=status.HTTP_201_CREATED)
async def crear_rol(data: CrearRol, db: Session = Depends(get_db)):
    existe = db.query(Rol).filter(Rol.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El rol ya existe")
    nuevo = Rol(nombre=data.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Rol creado", "data": nuevo}


@router.put("/roles/{id}", status_code=status.HTTP_200_OK)
async def actualizar_rol(id: int, data: ActualizarRol, db: Session = Depends(get_db)):
    rol = db.query(Rol).filter(Rol.id == id).first()
    if not rol:
        raise HTTPException(status_code=404, detail=f"Rol con id {id} no encontrado")
    if data.nombre is not None:
        rol.nombre = data.nombre
    db.commit()
    db.refresh(rol)
    return {"status": "200", "mensaje": "Rol actualizado", "data": rol}


@router.delete("/roles/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar_rol(id: int, db: Session = Depends(get_db)):
    rol = db.query(Rol).filter(Rol.id == id).first()
    if not rol:
        raise HTTPException(status_code=404, detail=f"Rol con id {id} no encontrado")
    db.delete(rol)
    db.commit()
    return {"status": "200", "mensaje": "Rol eliminado", "id": id}


# ══════════════════════════════════════════════
# ESTATUS
# ══════════════════════════════════════════════

@router.get("/estatus", status_code=status.HTTP_200_OK)
async def consultar_estatus(db: Session = Depends(get_db)):
    estatus = db.query(Estatus).all()
    return {"status": "200", "total": len(estatus), "data": estatus}


@router.post("/estatus", status_code=status.HTTP_201_CREATED)
async def crear_estatus(data: CrearEstatus, db: Session = Depends(get_db)):
    existe = db.query(Estatus).filter(Estatus.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El estatus ya existe")
    nuevo = Estatus(nombre=data.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Estatus creado", "data": nuevo}


@router.put("/estatus/{id}", status_code=status.HTTP_200_OK)
async def actualizar_estatus(id: int, data: ActualizarEstatus, db: Session = Depends(get_db)):
    est = db.query(Estatus).filter(Estatus.id == id).first()
    if not est:
        raise HTTPException(status_code=404, detail=f"Estatus con id {id} no encontrado")
    if data.nombre is not None:
        est.nombre = data.nombre
    db.commit()
    db.refresh(est)
    return {"status": "200", "mensaje": "Estatus actualizado", "data": est}


@router.delete("/estatus/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar_estatus(id: int, db: Session = Depends(get_db)):
    est = db.query(Estatus).filter(Estatus.id == id).first()
    if not est:
        raise HTTPException(status_code=404, detail=f"Estatus con id {id} no encontrado")
    db.delete(est)
    db.commit()
    return {"status": "200", "mensaje": "Estatus eliminado", "id": id}


# ══════════════════════════════════════════════
# MÉTODOS DE PAGO
# ══════════════════════════════════════════════

@router.get("/metodos-pago", status_code=status.HTTP_200_OK)
async def consultar_metodos_pago(db: Session = Depends(get_db)):
    metodos = db.query(MetodoPago).all()
    return {"status": "200", "total": len(metodos), "data": metodos}


@router.post("/metodos-pago", status_code=status.HTTP_201_CREATED)
async def crear_metodo_pago(data: CrearMetodoPago, db: Session = Depends(get_db)):
    existe = db.query(MetodoPago).filter(MetodoPago.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="El método de pago ya existe")
    nuevo = MetodoPago(nombre=data.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Método de pago creado", "data": nuevo}


@router.put("/metodos-pago/{id}", status_code=status.HTTP_200_OK)
async def actualizar_metodo_pago(id: int, data: ActualizarMetodoPago, db: Session = Depends(get_db)):
    metodo = db.query(MetodoPago).filter(MetodoPago.id == id).first()
    if not metodo:
        raise HTTPException(status_code=404, detail=f"Método de pago con id {id} no encontrado")
    if data.nombre is not None:
        metodo.nombre = data.nombre
    db.commit()
    db.refresh(metodo)
    return {"status": "200", "mensaje": "Método de pago actualizado", "data": metodo}


@router.delete("/metodos-pago/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar_metodo_pago(id: int, db: Session = Depends(get_db)):
    metodo = db.query(MetodoPago).filter(MetodoPago.id == id).first()
    if not metodo:
        raise HTTPException(status_code=404, detail=f"Método de pago con id {id} no encontrado")
    db.delete(metodo)
    db.commit()
    return {"status": "200", "mensaje": "Método de pago eliminado", "id": id}


# ══════════════════════════════════════════════
# CATEGORÍAS DE GASTO
# ══════════════════════════════════════════════

@router.get("/categorias-gasto", status_code=status.HTTP_200_OK)
async def consultar_categorias_gasto(db: Session = Depends(get_db)):
    categorias = db.query(CategoriaGasto).all()
    return {"status": "200", "total": len(categorias), "data": categorias}


@router.post("/categorias-gasto", status_code=status.HTTP_201_CREATED)
async def crear_categoria_gasto(data: CrearCategoriaGasto, db: Session = Depends(get_db)):
    existe = db.query(CategoriaGasto).filter(CategoriaGasto.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="La categoría de gasto ya existe")
    nuevo = CategoriaGasto(nombre=data.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Categoría de gasto creada", "data": nuevo}


@router.put("/categorias-gasto/{id}", status_code=status.HTTP_200_OK)
async def actualizar_categoria_gasto(id: int, data: ActualizarCategoriaGasto, db: Session = Depends(get_db)):
    cat = db.query(CategoriaGasto).filter(CategoriaGasto.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Categoría de gasto con id {id} no encontrada")
    if data.nombre is not None:
        cat.nombre = data.nombre
    db.commit()
    db.refresh(cat)
    return {"status": "200", "mensaje": "Categoría de gasto actualizada", "data": cat}


@router.delete("/categorias-gasto/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar_categoria_gasto(id: int, db: Session = Depends(get_db)):
    cat = db.query(CategoriaGasto).filter(CategoriaGasto.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Categoría de gasto con id {id} no encontrada")
    db.delete(cat)
    db.commit()
    return {"status": "200", "mensaje": "Categoría de gasto eliminada", "id": id}


# ══════════════════════════════════════════════
# CATEGORÍAS DE COMIDA
# ══════════════════════════════════════════════

@router.get("/categorias-comida", status_code=status.HTTP_200_OK)
async def consultar_categorias_comida(db: Session = Depends(get_db)):
    categorias = db.query(CategoriaComida).all()
    return {"status": "200", "total": len(categorias), "data": categorias}


@router.post("/categorias-comida", status_code=status.HTTP_201_CREATED)
async def crear_categoria_comida(data: CrearCategoriaComida, db: Session = Depends(get_db)):
    existe = db.query(CategoriaComida).filter(CategoriaComida.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="La categoría de comida ya existe")
    nuevo = CategoriaComida(nombre=data.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Categoría de comida creada", "data": nuevo}


@router.put("/categorias-comida/{id}", status_code=status.HTTP_200_OK)
async def actualizar_categoria_comida(id: int, data: ActualizarCategoriaComida, db: Session = Depends(get_db)):
    cat = db.query(CategoriaComida).filter(CategoriaComida.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Categoría de comida con id {id} no encontrada")
    if data.nombre is not None:
        cat.nombre = data.nombre
    db.commit()
    db.refresh(cat)
    return {"status": "200", "mensaje": "Categoría de comida actualizada", "data": cat}


@router.delete("/categorias-comida/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_token)])
async def eliminar_categoria_comida(id: int, db: Session = Depends(get_db)):
    cat = db.query(CategoriaComida).filter(CategoriaComida.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Categoría de comida con id {id} no encontrada")
    db.delete(cat)
    db.commit()
    return {"status": "200", "mensaje": "Categoría de comida eliminada", "id": id}
