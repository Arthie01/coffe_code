from typing import Optional
from pydantic import BaseModel, Field


# ── Roles ─────────────────────────────────────
class CrearRol(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)

class ActualizarRol(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)


# ── Estatus ───────────────────────────────────
class CrearEstatus(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)

class ActualizarEstatus(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)


# ── Método de Pago ────────────────────────────
class CrearMetodoPago(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)

class ActualizarMetodoPago(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)


# ── Categoría de Gasto ────────────────────────
class CrearCategoriaGasto(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)

class ActualizarCategoriaGasto(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)


# ── Categoría de Comida ───────────────────────
class CrearCategoriaComida(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)

class ActualizarCategoriaComida(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
