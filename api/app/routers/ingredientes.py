from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.ingrediente import Ingrediente
from app.models.ingredientes import CrearIngrediente, ActualizarIngrediente
from app.security.auth import verificar_peticion

router = APIRouter(
    prefix="/v1/ingredientes",
    tags=["Ingredientes"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todos(db: Session = Depends(get_db)):
    ingredientes = db.query(Ingrediente).all()
    return {"status": "200", "total": len(ingredientes), "data": ingredientes}


@router.get("/alertas", status_code=status.HTTP_200_OK)
async def consultar_alertas(db: Session = Depends(get_db)):
    ingredientes = db.query(Ingrediente).all()
    alertas = [i for i in ingredientes if float(i.stock_actual) <= float(i.stock_minimo)]
    return {"status": "200", "total": len(alertas), "data": alertas}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail=f"Ingrediente con id {id} no encontrado")
    return {"status": "200", "data": ingrediente}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearIngrediente, db: Session = Depends(get_db)):
    nuevo = Ingrediente(
        nombre=data.nombre,
        unidad_medida=data.unidad_medida,
        stock_actual=data.stock_actual,
        stock_minimo=data.stock_minimo
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "201", "mensaje": "Ingrediente creado", "data": nuevo}


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def actualizar(id: int, data: ActualizarIngrediente, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail=f"Ingrediente con id {id} no encontrado")

    campos = data.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(ingrediente, campo, valor)

    db.commit()
    db.refresh(ingrediente)
    return {"status": "200", "mensaje": "Ingrediente actualizado", "data": ingrediente}


@router.delete("/{id}", status_code=status.HTTP_200_OK,
               dependencies=[Depends(verificar_peticion)])
async def eliminar(id: int, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail=f"Ingrediente con id {id} no encontrado")
    db.delete(ingrediente)
    db.commit()
    return {"status": "200", "mensaje": "Ingrediente eliminado", "id": id}
