import os
import bcrypt
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.data.db import engine, Base
from app.data.rol import Rol
from app.data.estatus import Estatus
from app.data.metodo_pago import MetodoPago
from app.data.categoria_gasto import CategoriaGasto
from app.data.categoria_comida import CategoriaComida
from app.data.mesa import Mesa
from app.data.ingrediente import Ingrediente
from app.data.usuario import Usuario
from app.data.credencial_usuario import CredencialUsuario
from app.data.comida import Comida
from app.data.ingrediente_comida import IngredienteComida
from app.data.pedido import Pedido
from app.data.comida_pedido import ComidaPedido
from app.data.cocinero_pedido import CocineroPedido
from app.data.mesero_pedido import MeseroPedido
from app.data.pago import Pago
from app.data.gasto import Gasto
from app.data.compra_ingrediente import CompraIngrediente
from app.data.turno import Turno
from app.data.asignacion_turno import AsignacionTurno

from app.routers import (
    auth, catalogos, mesas, ingredientes, usuarios, comidas,
    pedidos, pagos, gastos, turnos, asignaciones_turno, reportes
)

os.makedirs("/app/uploads/comidas", exist_ok=True)

Base.metadata.create_all(bind=engine)


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_db():
    from app.data.db import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Rol).count() > 0:
            return

        # ── 1. Roles ─────────────────────────────────────────────
        db.add_all([
            Rol(nombre="Admin"),
            Rol(nombre="Mesero"),
            Rol(nombre="Cocinero"),
            Rol(nombre="Cajero"),
        ])
        db.flush()

        # ── 2. Estatus ───────────────────────────────────────────
        db.add_all([
            Estatus(nombre="Activo"),
            Estatus(nombre="Inactivo"),
            Estatus(nombre="Pendiente"),
            Estatus(nombre="En preparación"),
            Estatus(nombre="Listo"),
            Estatus(nombre="Entregado"),
            Estatus(nombre="Cancelado"),
            Estatus(nombre="Disponible"),
            Estatus(nombre="Ocupada"),
            Estatus(nombre="Reservada"),
            # ── Estatus de turnos ──
            Estatus(nombre="Programado"),   # id 11
            Estatus(nombre="En turno"),     # id 12
            Estatus(nombre="Finalizado"),   # id 13
            Estatus(nombre="Ausente"),      # id 14
        ])
        db.flush()

        # ── 3. Métodos de Pago ───────────────────────────────────
        db.add_all([
            MetodoPago(nombre="Efectivo"),
            MetodoPago(nombre="Tarjeta"),
            MetodoPago(nombre="Transferencia"),
        ])
        db.flush()

        # ── 4. Categorías de Gasto ───────────────────────────────
        db.add_all([
            CategoriaGasto(nombre="Compra de ingredientes"),
            CategoriaGasto(nombre="Mantenimiento"),
            CategoriaGasto(nombre="Servicios"),
            CategoriaGasto(nombre="Nómina"),
            CategoriaGasto(nombre="Otros"),
        ])
        db.flush()

        # ── 5. Categorías de Comida ──────────────────────────────
        db.add_all([
            CategoriaComida(nombre="Bebidas calientes"),
            CategoriaComida(nombre="Bebidas frías"),
            CategoriaComida(nombre="Desayunos"),
            CategoriaComida(nombre="Postres"),
            CategoriaComida(nombre="Snacks"),
        ])
        db.flush()

        # ── 6. Mesas ────────────────────────────────────────────
        db.add_all([
            Mesa(nombre="Mesa 1", capacidad=4, id_estatus=8),
            Mesa(nombre="Mesa 2", capacidad=4, id_estatus=8),
            Mesa(nombre="Mesa 3", capacidad=2, id_estatus=8),
            Mesa(nombre="Mesa 4", capacidad=6, id_estatus=8),
            Mesa(nombre="Mesa 5", capacidad=4, id_estatus=8),
            Mesa(nombre="Barra 1", capacidad=2, id_estatus=8),
            Mesa(nombre="Barra 2", capacidad=2, id_estatus=8),
            Mesa(nombre="Terraza 1", capacidad=4, id_estatus=8),
        ])
        db.flush()

        # ── 7. Ingredientes ─────────────────────────────────────
        db.add_all([
            Ingrediente(nombre="Café molido",         unidad_medida="kg",    stock_actual=5.0,   stock_minimo=1.0),
            Ingrediente(nombre="Leche entera",         unidad_medida="L",     stock_actual=20.0,  stock_minimo=5.0),
            Ingrediente(nombre="Azúcar",               unidad_medida="kg",    stock_actual=8.0,   stock_minimo=2.0),
            Ingrediente(nombre="Chocolate en polvo",   unidad_medida="kg",    stock_actual=3.0,   stock_minimo=0.5),
            Ingrediente(nombre="Crema batida",         unidad_medida="L",     stock_actual=4.0,   stock_minimo=1.0),
            Ingrediente(nombre="Huevos",               unidad_medida="pzas",  stock_actual=60.0,  stock_minimo=12.0),
            Ingrediente(nombre="Pan de caja",          unidad_medida="pzas",  stock_actual=30.0,  stock_minimo=10.0),
            Ingrediente(nombre="Jamón",                unidad_medida="kg",    stock_actual=2.0,   stock_minimo=0.5),
            Ingrediente(nombre="Queso manchego",       unidad_medida="kg",    stock_actual=1.5,   stock_minimo=0.5),
            Ingrediente(nombre="Harina",               unidad_medida="kg",    stock_actual=4.0,   stock_minimo=1.0),
            Ingrediente(nombre="Mantequilla",          unidad_medida="kg",    stock_actual=2.0,   stock_minimo=0.5),
            Ingrediente(nombre="Vainilla",             unidad_medida="L",     stock_actual=0.5,   stock_minimo=0.1),
            Ingrediente(nombre="Fresas",               unidad_medida="kg",    stock_actual=2.0,   stock_minimo=0.5),
            Ingrediente(nombre="Hielo",                unidad_medida="kg",    stock_actual=10.0,  stock_minimo=3.0),
            Ingrediente(nombre="Jarabe de vainilla",   unidad_medida="L",     stock_actual=1.0,   stock_minimo=0.3),
        ])
        db.flush()

        # ── 8. Usuarios ───────────────────────────────────────
        usuarios_data = [
            ("Artemio", "Hurtado", "Hernández", 1, 1, "admin@coffee.mx",   "admin123"),
            ("Jorge",   "López",   None,        4, 1, "jorge@coffee.mx",   "cajero123"),
            ("Alberto", "Muñiz",   None,        3, 1, "alberto@coffee.mx", "cocinero123"),
            ("Tania",   "Mejía",   None,        2, 1, "tania@coffee.mx",   "mesero123"),
        ]

        for nombre, ap, am, rol, est, correo, pwd in usuarios_data:
            u = Usuario(nombre=nombre, apellido_p=ap, apellido_m=am, id_rol=rol, id_estatus=est)
            db.add(u)
            db.flush()
            db.add(CredencialUsuario(
                id_usuario=u.id,
                correo=correo,
                password_hash=_hash(pwd)
            ))
        db.flush()

        # ── 9. Comidas (menú) ───────────────────────────────────
        comidas_data = [
            ("Americano",           None,                                   35.00,  1, 1),
            ("Cappuccino",          "Espresso con leche espumada",          55.00,  1, 1),
            ("Latte vainilla",      "Café latte con jarabe de vainilla",    60.00,  1, 1),
            ("Mocha",               "Espresso con chocolate y leche",       65.00,  1, 1),
            ("Frappé de café",      "Café frío con hielo y crema",          70.00,  2, 1),
            ("Frappé de fresa",     "Fresas con hielo, leche y crema",      72.00,  2, 1),
            ("Limonada natural",    "Agua con limón natural",               30.00,  2, 1),
            ("Huevos al gusto",     "Revueltos, estrellados o rancheros",   65.00,  3, 1),
            ("Sandwich de jamón",   "Pan tostado con jamón y queso",        55.00,  3, 1),
            ("Hot cakes",           "3 piezas con mantequilla y miel",      60.00,  3, 1),
            ("Pay de queso",        "Rebanada de pay con fresa",            50.00,  4, 1),
            ("Brownie",             "Brownie de chocolate con nuez",        45.00,  4, 1),
            ("Croissant",           "Croissant de mantequilla",             40.00,  5, 1),
            ("Galletas (3 pzas)",   "Galletas de mantequilla caseras",      35.00,  5, 1),
        ]

        for nombre, desc, precio, cat, est in comidas_data:
            db.add(Comida(
                nombre=nombre, descripcion=desc, precio=precio,
                id_categoria=cat, id_estatus=est
            ))
        db.flush()

        # ── 10. Recetas (ingredientes por comida) ────────────────
        recetas = [
            # Americano (comida 1)
            (1, 1, 0.020, "kg"),
            # Cappuccino (comida 2)
            (1, 2, 0.020, "kg"),  (2, 2, 0.200, "L"),
            # Latte vainilla (comida 3)
            (1, 3, 0.020, "kg"),  (2, 3, 0.250, "L"),  (15, 3, 0.030, "L"),
            # Mocha (comida 4)
            (1, 4, 0.020, "kg"),  (2, 4, 0.200, "L"),  (4, 4, 0.030, "kg"),
            # Frappé de café (comida 5)
            (1, 5, 0.020, "kg"),  (2, 5, 0.200, "L"),  (14, 5, 0.150, "kg"), (5, 5, 0.050, "L"),
            # Frappé de fresa (comida 6)
            (13, 6, 0.150, "kg"), (2, 6, 0.200, "L"),  (14, 6, 0.150, "kg"), (5, 6, 0.050, "L"),
            # Huevos al gusto (comida 8)
            (6, 8, 3.0, "pzas"),
            # Sandwich de jamón (comida 9)
            (7, 9, 2.0, "pzas"),  (8, 9, 0.080, "kg"), (9, 9, 0.060, "kg"),
            # Hot cakes (comida 10)
            (10, 10, 0.150, "kg"), (6, 10, 2.0, "pzas"), (2, 10, 0.150, "L"), (11, 10, 0.030, "kg"),
            # Pay de queso (comida 11)
            (9, 11, 0.100, "kg"), (13, 11, 0.050, "kg"),
            # Brownie (comida 12)
            (4, 12, 0.050, "kg"), (10, 12, 0.060, "kg"), (11, 12, 0.040, "kg"), (6, 12, 1.0, "pzas"),
        ]

        for id_ing, id_com, cant, unidad in recetas:
            db.add(IngredienteComida(
                id_ingrediente=id_ing, id_comida=id_com,
                cantidad_requerida=cant, unidad=unidad
            ))
        db.flush()

        # ── 11. Pedidos de ejemplo ───────────────────────────────
        from datetime import datetime, time, date

        p1 = Pedido(id_mesa=1, id_estatus=6, precio_total=175.00, fecha_hora=datetime(2026, 6, 28, 9, 15))
        p2 = Pedido(id_mesa=3, id_estatus=5, precio_total=125.00, notas="Sin azúcar el café", fecha_hora=datetime(2026, 6, 28, 10, 30))
        p3 = Pedido(id_mesa=5, id_estatus=4, precio_total=200.00, fecha_hora=datetime(2026, 6, 28, 11, 0))
        p4 = Pedido(id_mesa=2, id_estatus=3, precio_total=95.00,  fecha_hora=datetime(2026, 6, 28, 11, 45))
        db.add_all([p1, p2, p3, p4])
        db.flush()

        # Líneas de pedido
        db.add_all([
            # Pedido 1: Cappuccino x2 + Huevos al gusto
            ComidaPedido(id_comida=2, id_pedido=1, cantidad=2),
            ComidaPedido(id_comida=8, id_pedido=1, cantidad=1),
            # Pedido 2: Americano + Croissant x2
            ComidaPedido(id_comida=1, id_pedido=2, cantidad=1),
            ComidaPedido(id_comida=13, id_pedido=2, cantidad=2, observaciones="Calentar bien"),
            # Pedido 3: Mocha + Sandwich + Brownie
            ComidaPedido(id_comida=4, id_pedido=3, cantidad=1),
            ComidaPedido(id_comida=9, id_pedido=3, cantidad=1),
            ComidaPedido(id_comida=12, id_pedido=3, cantidad=1, observaciones="Extra chocolate"),
            # Pedido 4: Frappé de café + Pay de queso
            ComidaPedido(id_comida=5, id_pedido=4, cantidad=1),
            ComidaPedido(id_comida=11, id_pedido=4, cantidad=1),
        ])
        db.flush()

        # Asignaciones — Tania (mesero, id 4) y Alberto (cocinero, id 3)
        db.add_all([
            MeseroPedido(id_usuario=4, id_pedido=1),
            MeseroPedido(id_usuario=4, id_pedido=2),
            MeseroPedido(id_usuario=4, id_pedido=3),
            MeseroPedido(id_usuario=4, id_pedido=4),
            CocineroPedido(id_usuario=3, id_pedido=1),
            CocineroPedido(id_usuario=3, id_pedido=2),
            CocineroPedido(id_usuario=3, id_pedido=3),
        ])
        db.flush()

        # Pago del pedido 1 (ya entregado) — cobra Jorge (cajero, id 2)
        db.add(Pago(
            id_pedido=1, id_metodo_pago=1, id_usuario=2,
            monto_total=175.00, monto_recibido=200.00, cambio=25.00
        ))

        # ── 12. Turnos (catálogo) ────────────────────────────────
        db.add_all([
            Turno(nombre="Matutino",     hora_inicio=time(7, 0),  hora_fin=time(15, 0)),
            Turno(nombre="Vespertino",   hora_inicio=time(15, 0), hora_fin=time(23, 0)),
            Turno(nombre="Nocturno",     hora_inicio=time(23, 0), hora_fin=time(7, 0)),
            Turno(nombre="Medio tiempo", hora_inicio=time(10, 0), hora_fin=time(14, 0)),
        ])
        db.flush()

        # ── 13. Asignaciones de turno de ejemplo ─────────────────
        # estatus: 11=Programado, 12=En turno, 13=Finalizado
        db.add_all([
            # Tania (mesero) — turno matutino ya finalizado (entrada y salida)
            AsignacionTurno(
                id_usuario=4, id_turno=1, id_estatus=13, fecha=date(2026, 6, 28),
                hora_entrada=datetime(2026, 6, 28, 6, 58),
                hora_salida=datetime(2026, 6, 28, 15, 3)
            ),
            # Alberto (cocinero) — matutino, actualmente en turno (solo entrada)
            AsignacionTurno(
                id_usuario=3, id_turno=1, id_estatus=12, fecha=date(2026, 6, 28),
                hora_entrada=datetime(2026, 6, 28, 7, 1)
            ),
            # Jorge (cajero) — vespertino programado (aún sin checar)
            AsignacionTurno(
                id_usuario=2, id_turno=2, id_estatus=11, fecha=date(2026, 6, 28)
            ),
        ])
        db.flush()

        db.commit()
        print("==> Seed completado: catálogos, usuarios, menú, pedidos y pago insertados.")

    except Exception as e:
        db.rollback()
        print(f"==> Error en seed: {e}")
    finally:
        db.close()


seed_db()

app = FastAPI(
    title="Coffee Code API",
    description="API Central — Sistema de Cafetería Coffee Code",
    version="1.0"
)

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(catalogos.router)
app.include_router(mesas.router)
app.include_router(ingredientes.router)
app.include_router(usuarios.router)
app.include_router(comidas.router)
app.include_router(pedidos.router)
app.include_router(pagos.router)
app.include_router(gastos.router)
app.include_router(turnos.router)
app.include_router(asignaciones_turno.router)
app.include_router(reportes.router)


@app.get("/")
def health_check():
    return {"status": "OK", "service": "Coffee Code FastAPI"}
