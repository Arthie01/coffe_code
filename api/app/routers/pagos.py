from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.pago import Pago
from app.data.pedido import Pedido
from app.data.metodo_pago import MetodoPago
from app.data.usuario import Usuario
from app.models.pagos import CrearPago

router = APIRouter(
    prefix="/v1/pagos",
    tags=["Pagos"]
)


@router.get("/", status_code=status.HTTP_200_OK)
async def consultar_todos(db: Session = Depends(get_db)):
    pagos = db.query(Pago).order_by(Pago.fecha_hora.desc()).all()

    result = []
    for p in pagos:
        metodo = db.query(MetodoPago).filter(MetodoPago.id == p.id_metodo_pago).first()
        cajero = db.query(Usuario).filter(Usuario.id == p.id_usuario).first()
        result.append({
            "id": p.id,
            "id_pedido": p.id_pedido,
            "metodo_pago": metodo.nombre if metodo else None,
            "cajero": f"{cajero.nombre} {cajero.apellido_p}" if cajero else None,
            "monto_total": float(p.monto_total),
            "monto_recibido": float(p.monto_recibido),
            "cambio": float(p.cambio),
            "fecha_hora": str(p.fecha_hora)
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    pago = db.query(Pago).filter(Pago.id == id).first()
    if not pago:
        raise HTTPException(status_code=404, detail=f"Pago con id {id} no encontrado")

    metodo = db.query(MetodoPago).filter(MetodoPago.id == pago.id_metodo_pago).first()
    cajero = db.query(Usuario).filter(Usuario.id == pago.id_usuario).first()

    return {
        "status": "200",
        "data": {
            "id": pago.id,
            "id_pedido": pago.id_pedido,
            "id_metodo_pago": pago.id_metodo_pago,
            "metodo_pago": metodo.nombre if metodo else None,
            "id_usuario": pago.id_usuario,
            "cajero": f"{cajero.nombre} {cajero.apellido_p}" if cajero else None,
            "monto_total": float(pago.monto_total),
            "monto_recibido": float(pago.monto_recibido),
            "cambio": float(pago.cambio),
            "fecha_hora": str(pago.fecha_hora)
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(data: CrearPago, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == data.id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    existe_pago = db.query(Pago).filter(Pago.id_pedido == data.id_pedido).first()
    if existe_pago:
        raise HTTPException(status_code=400, detail="Este pedido ya tiene un pago registrado")

    monto_total = float(pedido.precio_total)

    if data.monto_recibido < monto_total:
        raise HTTPException(
            status_code=400,
            detail=f"Monto recibido (${data.monto_recibido:.2f}) es menor al total (${monto_total:.2f})"
        )

    cambio = round(data.monto_recibido - monto_total, 2)

    nuevo = Pago(
        id_pedido=data.id_pedido,
        id_metodo_pago=data.id_metodo_pago,
        id_usuario=data.id_usuario,
        monto_total=monto_total,
        monto_recibido=data.monto_recibido,
        cambio=cambio
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "status": "201",
        "mensaje": "Pago registrado",
        "data": {
            "id": nuevo.id,
            "monto_total": float(nuevo.monto_total),
            "monto_recibido": float(nuevo.monto_recibido),
            "cambio": float(nuevo.cambio)
        }
    }
