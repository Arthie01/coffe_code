from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.data.db import get_db
from app.data.pedido import Pedido
from app.data.comida_pedido import ComidaPedido
from app.data.comida import Comida
from app.data.mesa import Mesa
from app.data.estatus import Estatus
from app.data.cocinero_pedido import CocineroPedido
from app.data.mesero_pedido import MeseroPedido
from app.data.usuario import Usuario
from app.data.rol import Rol
from app.models.pedidos import CrearPedido, CambiarEstadoPedido, AsignarCocinero, AsignarMesero
from app.security.oauth2 import requiere_rol

router = APIRouter(
    prefix="/v1/pedidos",
    tags=["Pedidos"]
)

# Roles por operación: lectura amplia, escritura del dueño del módulo
leer = requiere_rol("Admin", "Mesero", "Cocinero", "Cajero")
crear_pedido = requiere_rol("Admin", "Mesero")
gestionar = requiere_rol("Admin", "Mesero", "Cocinero")
# Cambiar estado lo pueden intentar los 4 roles; la transición válida depende del rol.
puede_cambiar_estado = requiere_rol("Admin", "Mesero", "Cocinero", "Cajero")

# Flujo del pedido: Pendiente -> En preparación (Mesero) -> Listo (Cocinero) -> Entregado (Cajero)
TRANSICIONES_ROL = {
    "Mesero":   {"En preparación"},            # solo mandar a cocina
    "Cocinero": {"Listo"},                     # marcar listo -> pasa a caja
    "Cajero":   {"Entregado", "Cancelado"},    # cerrar / cancelar en caja
}
ESTADOS_CERRADOS = {"Entregado", "Cancelado"}


@router.get("/", status_code=status.HTTP_200_OK, dependencies=[Depends(leer)])
async def consultar_todos(
    id_estatus: Optional[int] = None,
    id_mesa: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Pedido).order_by(Pedido.fecha_hora.desc())
    if id_estatus:
        query = query.filter(Pedido.id_estatus == id_estatus)
    if id_mesa:
        query = query.filter(Pedido.id_mesa == id_mesa)
    pedidos = query.all()

    result = []
    for p in pedidos:
        mesa = db.query(Mesa).filter(Mesa.id == p.id_mesa).first()
        est = db.query(Estatus).filter(Estatus.id == p.id_estatus).first()
        items_count = db.query(ComidaPedido).filter(ComidaPedido.id_pedido == p.id).count()

        result.append({
            "id": p.id,
            "id_mesa": p.id_mesa,
            "mesa": mesa.nombre if mesa else None,
            "id_estatus": p.id_estatus,
            "estatus": est.nombre if est else None,
            "precio_total": float(p.precio_total),
            "notas": p.notas,
            "fecha_hora": str(p.fecha_hora),
            "items_count": items_count
        })

    return {"status": "200", "total": len(result), "data": result}


@router.get("/{id}", status_code=status.HTTP_200_OK, dependencies=[Depends(leer)])
async def consultar_uno(id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail=f"Pedido con id {id} no encontrado")

    mesa = db.query(Mesa).filter(Mesa.id == pedido.id_mesa).first()
    est = db.query(Estatus).filter(Estatus.id == pedido.id_estatus).first()

    items_db = db.query(ComidaPedido).filter(ComidaPedido.id_pedido == id).all()
    items = []
    for item in items_db:
        comida = db.query(Comida).filter(Comida.id == item.id_comida).first()
        items.append({
            "id": item.id,
            "id_comida": item.id_comida,
            "nombre": comida.nombre if comida else None,
            "precio": float(comida.precio) if comida else 0,
            "cantidad": item.cantidad,
            "subtotal": round(float(comida.precio) * item.cantidad, 2) if comida else 0,
            "observaciones": item.observaciones
        })

    cocineros_db = db.query(CocineroPedido).filter(CocineroPedido.id_pedido == id).all()
    cocineros = []
    for c in cocineros_db:
        usuario = db.query(Usuario).filter(Usuario.id == c.id_usuario).first()
        cocineros.append({
            "id_usuario": c.id_usuario,
            "nombre": f"{usuario.nombre} {usuario.apellido_p}" if usuario else None,
            "fecha_asignacion": str(c.fecha_asignacion)
        })

    meseros_db = db.query(MeseroPedido).filter(MeseroPedido.id_pedido == id).all()
    meseros = []
    for m in meseros_db:
        usuario = db.query(Usuario).filter(Usuario.id == m.id_usuario).first()
        meseros.append({
            "id_usuario": m.id_usuario,
            "nombre": f"{usuario.nombre} {usuario.apellido_p}" if usuario else None,
            "fecha_asignacion": str(m.fecha_asignacion)
        })

    return {
        "status": "200",
        "data": {
            "id": pedido.id,
            "id_mesa": pedido.id_mesa,
            "mesa": mesa.nombre if mesa else None,
            "id_estatus": pedido.id_estatus,
            "estatus": est.nombre if est else None,
            "precio_total": float(pedido.precio_total),
            "notas": pedido.notas,
            "fecha_hora": str(pedido.fecha_hora),
            "items": items,
            "cocineros": cocineros,
            "meseros": meseros
        }
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear(
    data: CrearPedido,
    usuario: Usuario = Depends(crear_pedido),
    db: Session = Depends(get_db)
):
    mesa = db.query(Mesa).filter(Mesa.id == data.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    # El pedido nace en estatus "Pendiente" (id 3)
    precio_total = 0.0
    comidas_map = {}
    for item in data.items:
        comida = db.query(Comida).filter(Comida.id == item.id_comida).first()
        if not comida:
            raise HTTPException(status_code=404, detail=f"Comida con id {item.id_comida} no encontrada")
        comidas_map[item.id_comida] = comida
        precio_total += float(comida.precio) * item.cantidad

    nuevo = Pedido(
        id_mesa=data.id_mesa,
        id_estatus=3,
        precio_total=round(precio_total, 2),
        notas=data.notas
    )
    db.add(nuevo)
    db.flush()

    for item in data.items:
        db.add(ComidaPedido(
            id_comida=item.id_comida,
            id_pedido=nuevo.id,
            cantidad=item.cantidad,
            observaciones=item.observaciones
        ))

    # Si lo levanta un Mesero, se auto-asigna él mismo; si es Admin, usa id_mesero del body
    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
    id_mesero = usuario.id if (rol and rol.nombre == "Mesero") else data.id_mesero
    if id_mesero:
        db.add(MeseroPedido(
            id_usuario=id_mesero,
            id_pedido=nuevo.id
        ))

    db.commit()
    db.refresh(nuevo)
    return {
        "status": "201",
        "mensaje": "Pedido creado",
        "data": {
            "id": nuevo.id,
            "precio_total": float(nuevo.precio_total),
            "fecha_hora": str(nuevo.fecha_hora)
        }
    }


@router.patch("/{id}/estado", status_code=status.HTTP_200_OK)
async def cambiar_estado(
    id: int,
    data: CambiarEstadoPedido,
    usuario: Usuario = Depends(puede_cambiar_estado),
    db: Session = Depends(get_db)
):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail=f"Pedido con id {id} no encontrado")

    destino = db.query(Estatus).filter(Estatus.id == data.id_estatus).first()
    if not destino:
        raise HTTPException(status_code=404, detail=f"Estatus con id {data.id_estatus} no encontrado")

    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
    rol_nombre = rol.nombre if rol else ""

    # El Admin puede cualquier cambio; los demás siguen el flujo del pedido
    if rol_nombre != "Admin":
        actual = db.query(Estatus).filter(Estatus.id == pedido.id_estatus).first()
        if actual and actual.nombre in ESTADOS_CERRADOS:
            raise HTTPException(
                status_code=403,
                detail="El pedido ya está cerrado y no se puede modificar"
            )
        permitidos = TRANSICIONES_ROL.get(rol_nombre, set())
        if destino.nombre not in permitidos:
            raise HTTPException(
                status_code=403,
                detail=f"El rol {rol_nombre} no puede cambiar el pedido a '{destino.nombre}'"
            )

    pedido.id_estatus = data.id_estatus
    db.commit()
    db.refresh(pedido)
    return {"status": "200", "mensaje": "Estado del pedido actualizado", "data": pedido}


@router.post("/{id}/cocinero", status_code=status.HTTP_201_CREATED, dependencies=[Depends(gestionar)])
async def asignar_cocinero(id: int, data: AsignarCocinero, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail=f"Pedido con id {id} no encontrado")

    usuario = db.query(Usuario).filter(Usuario.id == data.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {data.id_usuario} no encontrado")

    asignacion = CocineroPedido(id_usuario=data.id_usuario, id_pedido=id)
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return {"status": "201", "mensaje": "Cocinero asignado al pedido", "data": asignacion}


@router.post("/{id}/mesero", status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(requiere_rol("Admin", "Mesero"))])
async def asignar_mesero(id: int, data: AsignarMesero, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail=f"Pedido con id {id} no encontrado")

    usuario = db.query(Usuario).filter(Usuario.id == data.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con id {data.id_usuario} no encontrado")

    # El usuario asignado debe tener rol de Mesero
    rol = db.query(Rol).filter(Rol.id == usuario.id_rol).first()
    if not rol or rol.nombre != "Mesero":
        raise HTTPException(status_code=400, detail="Solo los meseros se pueden asignar a un pedido")

    asignacion = MeseroPedido(id_usuario=data.id_usuario, id_pedido=id)
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return {"status": "201", "mensaje": "Mesero asignado al pedido", "data": asignacion}
