import os
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.comida import Comida
from app.data.ingrediente_comida import IngredienteComida
from app.data.ingrediente import Ingrediente
from app.data.categoria_comida import CategoriaComida
from app.data.estatus import Estatus
from app.models.comidas import CrearComida, ActualizarComida
from app.security.auth import verificar_peticion

router = APIRouter(
    prefix="/v1/comidas",
    tags=["Comidas"]
)

UPLOAD_DIR = "/app/uploads/comidas"


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todas(
    id_categoria: Optional[int] = None,
    id_estatus: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Comida)
    if id_categoria:
        query = query.filter(Comida.id_categoria == id_categoria)
    if id_estatus:
        query = query.filter(Comida.id_estatus == id_estatus)
    comidas = query.all()

    result = []
    for c in comidas:
        cat = db.query(CategoriaComida).filter(CategoriaComida.id == c.id_categoria).first()
        est = db.query(Estatus).filter(Estatus.id == c.id_estatus).first()
        result.append({
            "id": c.id,
            "nombre": c.nombre,
            "descripcion": c.descripcion,
            "precio": float(c.precio),
            "id_categoria": c.id_categoria,
            "categoria": cat.nombre if cat else None,
            "id_estatus": c.id_estatus,
            "estatus": est.nombre if est else None,
            "img": c.img
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_una(id: int, db: Session = Depends(get_db)):
    comida = db.query(Comida).filter(Comida.id == id).first()
    if not comida:
        raise HTTPException(status_code=404, detail=f"Comida con id {id} no encontrada")

    cat = db.query(CategoriaComida).filter(CategoriaComida.id == comida.id_categoria).first()
    est = db.query(Estatus).filter(Estatus.id == comida.id_estatus).first()

    ingredientes = db.query(IngredienteComida).filter(
        IngredienteComida.id_comida == id
    ).all()

    ingredientes_list = []
    for ic in ingredientes:
        ing = db.query(Ingrediente).filter(Ingrediente.id == ic.id_ingrediente).first()
        ingredientes_list.append({
            "id_ingrediente": ic.id_ingrediente,
            "nombre": ing.nombre if ing else None,
            "cantidad_requerida": float(ic.cantidad_requerida),
            "unidad": ic.unidad
        })

    return {
        "status": "200",
        "data": {
            "id": comida.id,
            "nombre": comida.nombre,
            "descripcion": comida.descripcion,
            "precio": float(comida.precio),
            "id_categoria": comida.id_categoria,
            "categoria": cat.nombre if cat else None,
            "id_estatus": comida.id_estatus,
            "estatus": est.nombre if est else None,
            "img": comida.img,
            "ingredientes": ingredientes_list
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearComida, db: Session = Depends(get_db)):
    nueva = Comida(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        id_categoria=data.id_categoria,
        id_estatus=data.id_estatus
    )
    db.add(nueva)
    db.flush()

    if data.ingredientes:
        for ing in data.ingredientes:
            db.add(IngredienteComida(
                id_ingrediente=ing.id_ingrediente,
                id_comida=nueva.id,
                cantidad_requerida=ing.cantidad_requerida,
                unidad=ing.unidad
            ))

    db.commit()
    db.refresh(nueva)
    return {"status": "201", "mensaje": "Comida creada", "data": nueva}


@router.post("/{id}/imagen", status_code=status.HTTP_200_OK)
async def subir_imagen(id: int, imagen: UploadFile = File(...), db: Session = Depends(get_db)):
    comida = db.query(Comida).filter(Comida.id == id).first()
    if not comida:
        raise HTTPException(status_code=404, detail=f"Comida con id {id} no encontrada")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{imagen.filename}"
    ruta = os.path.join(UPLOAD_DIR, filename)
    with open(ruta, "wb") as f:
        f.write(await imagen.read())

    comida.img = f"http://localhost:8000/uploads/comidas/{filename}"
    db.commit()
    db.refresh(comida)
    return {"status": "200", "mensaje": "Imagen subida", "img": comida.img}


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarComida, db: Session = Depends(get_db)):
    comida = db.query(Comida).filter(Comida.id == id).first()
    if not comida:
        raise HTTPException(status_code=404, detail=f"Comida con id {id} no encontrada")

    campos = data.model_dump(exclude_unset=True, exclude={"ingredientes"})
    for campo, valor in campos.items():
        setattr(comida, campo, valor)

    if data.ingredientes is not None:
        db.query(IngredienteComida).filter(IngredienteComida.id_comida == id).delete()
        for ing in data.ingredientes:
            db.add(IngredienteComida(
                id_ingrediente=ing.id_ingrediente,
                id_comida=id,
                cantidad_requerida=ing.cantidad_requerida,
                unidad=ing.unidad
            ))

    db.commit()
    db.refresh(comida)
    return {"status": "200", "mensaje": "Comida actualizada", "data": comida}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_peticion)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    comida = db.query(Comida).filter(Comida.id == id).first()
    if not comida:
        raise HTTPException(status_code=404, detail=f"Comida con id {id} no encontrada")

    db.query(IngredienteComida).filter(IngredienteComida.id_comida == id).delete()
    db.delete(comida)
    db.commit()
    return {"status": "200", "mensaje": "Comida eliminada", "id": id}
