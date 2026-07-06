"""Validadores reutilizables para los esquemas Pydantic de la API."""
import re
from typing import Annotated
from pydantic import AfterValidator, Field

DOMINIO_CORREO = "@coffee.mx"

# Correo con formato válido y dominio institucional obligatorio.
_RE_CORREO = re.compile(r"^[a-z0-9._%+\-]+@coffee\.mx$")
# Nombres de persona: letras (con acentos y ñ), espacios, guion y apóstrofo.
_RE_NOMBRE_PERSONA = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'’\- ]{2,}$")


def _correo_coffee(v: str) -> str:
    v = v.strip().lower()
    if not _RE_CORREO.match(v):
        raise ValueError(f"El correo debe tener un formato válido y terminar en {DOMINIO_CORREO}")
    return v


def _nombre_persona(v: str) -> str:
    v = v.strip()
    if not _RE_NOMBRE_PERSONA.match(v):
        raise ValueError("Solo se permiten letras, espacios, guion o apóstrofo (mínimo 2 caracteres)")
    return v


# ── Tipos reutilizables ───────────────────────
# Correo institucional (@coffee.mx), máx. 150 (VARCHAR de la BD).
CorreoCoffee = Annotated[str, Field(max_length=150), AfterValidator(_correo_coffee)]
# Nombre de persona solo-letras, máx. 100 (VARCHAR de la BD).
NombrePersona = Annotated[str, Field(max_length=100), AfterValidator(_nombre_persona)]
