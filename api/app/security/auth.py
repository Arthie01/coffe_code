from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi import HTTPException, Depends, status
import secrets

Security = HTTPBasic()


def verificar_peticion(credenciales: HTTPBasicCredentials = Depends(Security)):
    usuario_auth = secrets.compare_digest(credenciales.username, "coffee")
    contra_auth = secrets.compare_digest(credenciales.password, "123456")

    if not (usuario_auth and contra_auth):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales no autorizadas"
        )

    return credenciales.username
