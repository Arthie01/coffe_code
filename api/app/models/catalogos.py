from typing import Optional
from pydantic import BaseModel


# ── Roles ─────────────────────────────────────
class CrearRol(BaseModel):
    nombre: str

class ActualizarRol(BaseModel):
    nombre: Optional[str] = None


# ── Estatus ───────────────────────────────────
class CrearEstatus(BaseModel):
    nombre: str

class ActualizarEstatus(BaseModel):
    nombre: Optional[str] = None


# ── Método de Pago ────────────────────────────
class CrearMetodoPago(BaseModel):
    nombre: str

class ActualizarMetodoPago(BaseModel):
    nombre: Optional[str] = None


# ── Categoría de Gasto ────────────────────────
class CrearCategoriaGasto(BaseModel):
    nombre: str

class ActualizarCategoriaGasto(BaseModel):
    nombre: Optional[str] = None


# ── Categoría de Comida ───────────────────────
class CrearCategoriaComida(BaseModel):
    nombre: str

class ActualizarCategoriaComida(BaseModel):
    nombre: Optional[str] = None
