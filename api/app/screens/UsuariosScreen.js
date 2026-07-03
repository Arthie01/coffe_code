// UsuariosScreen.js
//
// PASO 1: imports
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { COLORS } from './colors';

// PASO 2: datos mock (esto luego vendrá de tu tabla "usuarios" en PostgreSQL,
// vía un endpoint GET /usuarios)
const USUARIOS_INICIALES = [
  { id: 1, nombre: 'Ledesma Ledesma E.', correo: 'ledesma@cafeteria.mx', rol: 'Cocina', activo: true, iniciales: 'LL' },
  { id: 2, nombre: 'Martínez Silvestre C.', correo: 'coral@cafeteria.mx', rol: 'Mesero', activo: true, iniciales: 'MS' },
  { id: 3, nombre: 'Hurtado Hdz. Artemio', correo: 'artemio@cafeteria.mx', rol: 'Cocina', activo: true, iniciales: 'AH' },
  { id: 4, nombre: 'López Morales Jorge A.', correo: 'jorge@cafeteria.mx', rol: 'Mesero', activo: true, iniciales: 'LM' },
  { id: 5, nombre: 'Muñiz López Alberto A.', correo: 'alberto@cafeteria.mx', rol: 'Caja', activo: true, iniciales: 'ML' },
  { id: 6, nombre: 'Ramírez Ortiz Sofía', correo: 'sofia@cafeteria.mx', rol: 'Administrador', activo: true, iniciales: 'RO' },
];

// Mapeo de color por rol (RF-U01, RF-U02: el rol se asigna al crear/editar)
const COLOR_ROL = {
  Cocina: COLORS.rolCocina,
  Mesero: COLORS.rolMesero,
  Caja: COLORS.rolCaja,
  Administrador: COLORS.rolAdmin,
};

const COLOR_AVATAR = ['#5B4FE5', '#8A6D1B', '#1F7A5C', '#2C6E8A', '#C23B6B', '#5B7A2C'];

const ROLES = ['Todos los roles', 'Cocina', 'Mesero', 'Caja', 'Administrador'];
const ESTATUS = ['Todos', 'Activo', 'Inactivo'];

// PASO 3: tarjeta KPI reutilizable (igual patrón que en Estadísticas)
function TarjetaKPI({ titulo, valor, color }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitulo}>{titulo}</Text>
      <Text style={[styles.kpiValor, { color: color || COLORS.texto }]}>{valor}</Text>
    </View>
  );
}

// PASO 4: dropdown simple (mismo patrón que en Estadísticas, para consistencia)
function DropdownSimple({ opciones, valorActual, onSeleccionar }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity style={styles.dropdownHeader} onPress={() => setAbierto(!abierto)}>
        <Text style={styles.dropdownTexto}>{valorActual}</Text>
        <Text style={styles.dropdownFlecha}>{abierto ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {abierto && (
        <View style={styles.dropdownLista}>
          {opciones.map((op) => (
            <TouchableOpacity
              key={op}
              style={styles.dropdownItem}
              onPress={() => {
                onSeleccionar(op);
                setAbierto(false);
              }}
            >
              <Text style={styles.dropdownItemTexto}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// PASO 5: badges de rol y de estatus
function BadgeRol({ rol }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLOR_ROL[rol] || COLORS.gris }]}>
      <Text style={styles.badgeTexto}>{rol}</Text>
    </View>
  );
}

function BadgeEstatus({ activo }) {
  return (
    <View style={[styles.badge, { backgroundColor: activo ? COLORS.acento : COLORS.rojo }]}>
      <Text style={styles.badgeTexto}>{activo ? 'Activo' : 'Inactivo'}</Text>
    </View>
  );
}

// PASO 6: fila de la tabla, con acciones de editar y desactivar (RF-U02, RF-U03)
function FilaUsuario({ item, index, onEditar, onToggleActivo }) {
  return (
    <View style={styles.filaTabla}>
      <Text style={[styles.celda, { flex: 0.4 }]}>{index + 1}</Text>

      <View style={[styles.celdaNombre, { flex: 2.2 }]}>
        <View style={[styles.avatar, { backgroundColor: COLOR_AVATAR[index % COLOR_AVATAR.length] }]}>
          <Text style={styles.avatarTexto}>{item.iniciales}</Text>
        </View>
        <Text style={styles.celda}>{item.nombre}</Text>
      </View>

      <Text style={[styles.celda, { flex: 2 }]}>{item.correo}</Text>

      <View style={{ flex: 1.1 }}>
        <BadgeRol rol={item.rol} />
      </View>

      <View style={{ flex: 1 }}>
        <BadgeEstatus activo={item.activo} />
      </View>

      <View style={[styles.accionesCelda, { flex: 1 }]}>
        <TouchableOpacity style={styles.accionBoton} onPress={() => onEditar(item)}>
          <Text>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accionBoton} onPress={() => onToggleActivo(item.id)}>
          <Text>{item.activo ? '🚫' : '✅'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// PASO 7: componente principal
export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState(USUARIOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos los roles');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');

  // RF-U03: desactivar sin eliminar (solo cambia el flag "activo")
  const toggleActivo = (id) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
  };

  // RF-U02: editar (aquí solo el gancho; abriría un modal/formulario)
  const editarUsuario = (usuario) => {
    console.log('Editar usuario ->', usuario);
    // TODO: abrir modal de edición con los datos precargados
  };

  // RF-U01: crear (aquí solo el gancho; abriría un modal/formulario)
  const nuevoUsuario = () => {
    console.log('Abrir formulario de nuevo usuario');
    // TODO: abrir modal de creación
  };

  // PASO 8: filtrado combinado (búsqueda + rol + estatus). useMemo evita
  // recalcular en cada render si nada de esto cambió.
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda =
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.correo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === 'Todos los roles' || u.rol === filtroRol;
      const coincideEstatus =
        filtroEstatus === 'Todos' ||
        (filtroEstatus === 'Activo' && u.activo) ||
        (filtroEstatus === 'Inactivo' && !u.activo);
      return coincideBusqueda && coincideRol && coincideEstatus;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstatus]);

  // PASO 9: KPIs derivados de la lista (RF-U04: listar con nombre, rol, estado)
  const totalUsuarios = usuarios.length;
  const activos = usuarios.filter((u) => u.activo).length;
  const inactivos = totalUsuarios - activos;
  const rolesDefinidos = new Set(usuarios.map((u) => u.rol)).size;

  return (
    <View style={styles.contenedor}>
      {/* --- KPIs --- */}
      <View style={styles.kpiFila}>
        <TarjetaKPI titulo="Total usuarios" valor={totalUsuarios} />
        <TarjetaKPI titulo="Activos" valor={activos} color={COLORS.acento} />
        <TarjetaKPI titulo="Inactivos" valor={inactivos} color={COLORS.rojo} />
        <TarjetaKPI titulo="Roles definidos" valor={rolesDefinidos} color={COLORS.rolAdmin} />
      </View>

      {/* --- Botón nuevo usuario + búsqueda (RF-U01) --- */}
      <View style={styles.filaSuperior}>
        <TouchableOpacity style={styles.botonNuevo} onPress={nuevoUsuario}>
          <Text style={styles.botonNuevoTexto}>+ Nuevo usuario</Text>
        </TouchableOpacity>

        <View style={styles.buscador}>
          <Text style={{ marginRight: 6 }}>🔎</Text>
          <TextInput
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={COLORS.gris}
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.buscadorInput}
          />
        </View>
      </View>

      {/* --- Filtros --- */}
      <DropdownSimple opciones={ROLES} valorActual={filtroRol} onSeleccionar={setFiltroRol} />
      <DropdownSimple opciones={ESTATUS} valorActual={filtroEstatus} onSeleccionar={setFiltroEstatus} />

      {/* --- Tabla (RF-U04) --- */}
      <View style={styles.tablaContainer}>
        <View style={styles.filaTablaHeader}>
          <Text style={[styles.celdaHeader, { flex: 0.4 }]}>#</Text>
          <Text style={[styles.celdaHeader, { flex: 2.2 }]}>Nombre</Text>
          <Text style={[styles.celdaHeader, { flex: 2 }]}>Correo</Text>
          <Text style={[styles.celdaHeader, { flex: 1.1 }]}>Rol</Text>
          <Text style={[styles.celdaHeader, { flex: 1 }]}>Estatus</Text>
          <Text style={[styles.celdaHeader, { flex: 1 }]}>Acciones</Text>
        </View>

        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <FilaUsuario
              item={item}
              index={index}
              onEditar={editarUsuario}
              onToggleActivo={toggleActivo}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.sinResultados}>No hay usuarios que coincidan con el filtro.</Text>
          }
        />
      </View>
    </View>
  );
}

// PASO 10: estilos
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondo,
    padding: 16,
  },

  kpiFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 10,
    padding: 12,
    width: '23.5%',
    minWidth: 140,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  kpiTitulo: { fontSize: 11, color: COLORS.gris, fontWeight: '600', marginBottom: 4 },
  kpiValor: { fontSize: 20, fontWeight: '700' },

  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  botonNuevo: {
    borderWidth: 1,
    borderColor: COLORS.acento,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  botonNuevoTexto: { color: COLORS.acento, fontWeight: '700' },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negroBarra,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  buscadorInput: { flex: 1, color: '#FFFFFF', paddingVertical: 12 },

  dropdownHeader: {
    backgroundColor: COLORS.negroBarra,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTexto: { color: '#FFFFFF', fontWeight: '600' },
  dropdownFlecha: { color: '#FFFFFF' },
  dropdownLista: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  dropdownItemTexto: { color: COLORS.texto },

  tablaContainer: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 10,
    overflow: 'hidden',
    flex: 1,
    marginTop: 8,
  },
  filaTablaHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.negroBarra,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  celdaHeader: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  filaTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  celda: { color: COLORS.texto, fontSize: 12 },
  celdaNombre: { flexDirection: 'row', alignItems: 'center' },

  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 8 },
  badgeTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  accionesCelda: { flexDirection: 'row', gap: 8 },
  accionBoton: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  sinResultados: { textAlign: 'center', color: COLORS.gris, padding: 20 },
});