-- ============================================================
--  DDL — Coffee Code - Sistema de Cafetería
--  Motor: PostgreSQL 15+
--  Ejecutar en orden (respeta dependencias entre tablas)
-- ============================================================

-- 1. Catálogos base
CREATE TABLE IF NOT EXISTS roles (
    id      SERIAL      PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS estatus (
    id      SERIAL      PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS metodo_pago (
    id      SERIAL      PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categoria_gasto (
    id      SERIAL       PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categoria_comidas (
    id      SERIAL       PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Mesas
CREATE TABLE IF NOT EXISTS mesas (
    id          SERIAL      PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL,
    capacidad   SMALLINT    NOT NULL DEFAULT 4 CHECK (capacidad > 0),
    id_estatus  INT         NOT NULL REFERENCES estatus(id)
);

-- 3. Ingredientes (inventario)
CREATE TABLE IF NOT EXISTS ingredientes (
    id            SERIAL       PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(30)  NOT NULL,
    stock_actual  NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo  NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0)
);

-- 4. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    apellido_p  VARCHAR(100) NOT NULL,
    apellido_m  VARCHAR(100),
    id_rol      INT          NOT NULL REFERENCES roles(id),
    id_estatus  INT          NOT NULL REFERENCES estatus(id)
);

-- 5. Credenciales
CREATE TABLE IF NOT EXISTS credenciales_usuario (
    id            SERIAL       PRIMARY KEY,
    id_usuario    INT          NOT NULL UNIQUE REFERENCES usuarios(id),
    correo        VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 6. Comida (menú)
CREATE TABLE IF NOT EXISTS comida (
    id            SERIAL       PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT,
    precio        NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    id_categoria  INT          NOT NULL REFERENCES categoria_comidas(id),
    id_estatus    INT          NOT NULL REFERENCES estatus(id),
    img           VARCHAR(300)
);

-- 7. Ingredientes por comida (receta)
CREATE TABLE IF NOT EXISTS ingredientes_comida (
    id                  SERIAL        PRIMARY KEY,
    id_ingrediente      INT           NOT NULL REFERENCES ingredientes(id),
    id_comida           INT           NOT NULL REFERENCES comida(id),
    cantidad_requerida  NUMERIC(10,3) NOT NULL CHECK (cantidad_requerida > 0),
    unidad              VARCHAR(30)   NOT NULL,
    UNIQUE (id_ingrediente, id_comida)
);

-- 8. Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id            SERIAL        PRIMARY KEY,
    id_mesa       INT           NOT NULL REFERENCES mesas(id),
    id_estatus    INT           NOT NULL REFERENCES estatus(id),
    precio_total  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio_total >= 0),
    notas         TEXT,
    fecha_hora    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 9. Comida por pedido (líneas)
CREATE TABLE IF NOT EXISTS comida_pedido (
    id              SERIAL   PRIMARY KEY,
    id_comida       INT      NOT NULL REFERENCES comida(id),
    id_pedido       INT      NOT NULL REFERENCES pedidos(id),
    cantidad        SMALLINT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    observaciones   TEXT
);

-- 10. Asignación cocinero
CREATE TABLE IF NOT EXISTS cocinero_pedido (
    id               SERIAL    PRIMARY KEY,
    id_usuario       INT       NOT NULL REFERENCES usuarios(id),
    id_pedido        INT       NOT NULL REFERENCES pedidos(id),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Asignación mesero
CREATE TABLE IF NOT EXISTS mesero_pedido (
    id               SERIAL    PRIMARY KEY,
    id_usuario       INT       NOT NULL REFERENCES usuarios(id),
    id_pedido        INT       NOT NULL REFERENCES pedidos(id),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id              SERIAL        PRIMARY KEY,
    id_pedido       INT           NOT NULL UNIQUE REFERENCES pedidos(id),
    id_metodo_pago  INT           NOT NULL REFERENCES metodo_pago(id),
    id_usuario      INT           NOT NULL REFERENCES usuarios(id),
    monto_total     NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0),
    monto_recibido  NUMERIC(10,2) NOT NULL CHECK (monto_recibido >= 0),
    cambio          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cambio >= 0),
    fecha_hora      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 13. Gastos operativos
CREATE TABLE IF NOT EXISTS gastos (
    id                  SERIAL        PRIMARY KEY,
    id_usuario          INT           NOT NULL REFERENCES usuarios(id),
    id_categoria_gasto  INT           NOT NULL REFERENCES categoria_gasto(id),
    descripcion         VARCHAR(255),
    monto               NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    fecha_hora          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 14. Detalle compra de ingredientes
CREATE TABLE IF NOT EXISTS compra_ingredientes (
    id               SERIAL        PRIMARY KEY,
    id_gasto         INT           NOT NULL REFERENCES gastos(id),
    id_ingrediente   INT           NOT NULL REFERENCES ingredientes(id),
    cantidad         NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0)
);

-- 15. Turnos (catálogo de tipos de turno)
CREATE TABLE IF NOT EXISTS turnos (
    id           SERIAL      PRIMARY KEY,
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    hora_inicio  TIME        NOT NULL,
    hora_fin     TIME        NOT NULL
);

-- 16. Asignaciones de turno (programación + control de asistencia)
CREATE TABLE IF NOT EXISTS asignaciones_turno (
    id            SERIAL    PRIMARY KEY,
    id_usuario    INT       NOT NULL REFERENCES usuarios(id),
    id_turno      INT       NOT NULL REFERENCES turnos(id),
    id_estatus    INT       NOT NULL REFERENCES estatus(id),
    fecha         DATE      NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada  TIMESTAMP,
    hora_salida   TIMESTAMP,
    notas         TEXT,
    UNIQUE (id_usuario, id_turno, fecha)
);
