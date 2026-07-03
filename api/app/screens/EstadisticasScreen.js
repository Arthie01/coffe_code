// EstadisticasScreen.js
//
// PASO 1: Importamos lo básico de React Native + React.
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { COLORS } from './colors';

// PASO 2: Datos "quemados" (mock) que simulan lo que vendría de tu API
// (PostgreSQL + backend). Cuando conectes el backend real, solo
// reemplazas esto por el resultado de un fetch/axios.
const KPIS_HOY = {
  ventas: 4250,
  gastos: 850,
  ganancia: 3400,
  pedidosActivos: 12,
};

const RESUMEN_SEMANA = {
  ventas: 28640,
  ventasVariacion: '+12%',
  gastos: 5980,
  gastosVariacion: '+3%',
  ganancia: 22660,
  gananciaVariacion: '+14%',
};

const FLUJO_VENTAS = [
  { hora: '08:00', monto: 280 },
  { hora: '09:00', monto: 420 },
  { hora: '10:00', monto: 890 },
  { hora: '12:00', monto: 1240 },
  { hora: '14:00', monto: 980 },
  { hora: '16:00', monto: 440 },
];

const PRODUCTOS_MAS_VENDIDOS = [
  { nombre: 'Capuccino', porcentaje: 40, color: COLORS.acento },
  { nombre: 'Americano', porcentaje: 24, color: '#3FB68A' },
  { nombre: 'Croissant', porcentaje: 15, color: COLORS.amarillo },
  { nombre: 'Latte', porcentaje: 11, color: '#E88C8C' },
  { nombre: 'Otros', porcentaje: 10, color: COLORS.gris },
];

const PEDIDOS = [
  { ticket: '#1024', mesa: 'Mesa 4', mesero: 'López Morales J.', total: 150.0, metodo: 'Tarjeta', estatus: 'Pagado' },
  { ticket: '#1023', mesa: 'Mesa 2', mesero: 'Hurtado Hdz. A.', total: 240.0, metodo: 'Efectivo', estatus: 'Pagado' },
  { ticket: '#1025', mesa: 'Para llevar', mesero: 'Ledesma L. E.', total: 95.0, metodo: 'Transferencia', estatus: 'En proceso' },
];

const FILTROS_PERIODO = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado'];
const FILTROS_REPORTE = ['Todos los reportes', 'Ventas', 'Gastos', 'Ganancias', 'Inventario'];

// PASO 3: Componente reutilizable de tarjeta KPI (arriba de todo).
// Recibirlo como componente evita repetir el mismo bloque de estilos 4 veces.
function TarjetaKPI({ titulo, valor, color }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitulo}>{titulo}</Text>
      <Text style={[styles.kpiValor, { color: color || COLORS.texto }]}>{valor}</Text>
    </View>
  );
}

// PASO 4: Dropdown simple. En tu ejemplo real (RF-E02, RF-E07) esto
// abriría un modal o un Picker; aquí dejamos la versión mínima
// funcional con estado local para que veas el patrón.
function DropdownSimple({ opciones, valorActual, onSeleccionar }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
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

// PASO 5: Gráfica de barras simple hecha con Views (sin librerías extra).
// Cada barra es un <View> cuya altura depende del monto vs el máximo.
function GraficaBarras({ datos }) {
  const maximo = Math.max(...datos.map((d) => d.monto));

  return (
    <View style={styles.graficaBarrasContainer}>
      {datos.map((d) => (
        <View key={d.hora} style={styles.barraColumna}>
          <Text style={styles.barraMonto}>${d.monto}</Text>
          <View
            style={[
              styles.barra,
              { height: Math.max(10, (d.monto / maximo) * 90) },
            ]}
          />
          <Text style={styles.barraHora}>{d.hora}</Text>
        </View>
      ))}
    </View>
  );
}

// PASO 6: "Dona" de productos más vendidos. Una dona real necesita
// react-native-svg (o victory-native). Para no forzarte a instalar
// nada, la representamos como barra apilada horizontal + leyenda,
// que comunica lo mismo (proporciones) sin dependencias nuevas.
function GraficaProductos({ datos }) {
  return (
    <View>
      <View style={styles.barraApilada}>
        {datos.map((d) => (
          <View
            key={d.nombre}
            style={{ flex: d.porcentaje, backgroundColor: d.color }}
          />
        ))}
      </View>
      <View style={{ marginTop: 12 }}>
        {datos.map((d) => (
          <View key={d.nombre} style={styles.leyendaFila}>
            <View style={[styles.leyendaPunto, { backgroundColor: d.color }]} />
            <Text style={styles.leyendaTexto}>{d.nombre}</Text>
            <Text style={styles.leyendaPorcentaje}>{d.porcentaje}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// PASO 7: Badge de estatus (Pagado / En proceso) reutilizable.
function Badge({ texto }) {
  const esPagado = texto === 'Pagado';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: esPagado ? COLORS.acento : COLORS.amarillo },
      ]}
    >
      <Text style={styles.badgeTexto}>{texto}</Text>
    </View>
  );
}

// PASO 8: Fila de la tabla de pedidos (RF-E07: historial de pedidos).
function FilaPedido({ item }) {
  return (
    <View style={styles.filaTabla}>
      <Text style={[styles.celda, { flex: 1 }]}>{item.ticket}</Text>
      <Text style={[styles.celda, { flex: 1.2 }]}>{item.mesa}</Text>
      <Text style={[styles.celda, { flex: 1.8 }]}>{item.mesero}</Text>
      <Text style={[styles.celda, { flex: 1 }]}>${item.total.toFixed(2)}</Text>
      <Text style={[styles.celda, { flex: 1.3 }]}>{item.metodo}</Text>
      <View style={{ flex: 1.2 }}>
        <Badge texto={item.estatus} />
      </View>
    </View>
  );
}

// PASO 9: Componente principal de la pantalla. Aquí se junta todo.
export default function EstadisticasScreen() {
  const [periodo, setPeriodo] = useState('Hoy');
  const [tipoReporte, setTipoReporte] = useState('Todos los reportes');

  // RF-E08 / RF-E09: exportar. Aquí solo dejamos el "gancho" (handler);
  // la lógica real de generar PDF/XLSX va en el backend o con una
  // librería como expo-print (PDF) o xlsx (Excel).
  const exportarPDF = () => {
    console.log('Exportar PDF ->', { periodo, tipoReporte });
    // TODO: llamar a tu endpoint /reportes/pdf o usar expo-print
  };

  const exportarXLSX = () => {
    console.log('Exportar XLSX ->', { periodo, tipoReporte });
    // TODO: llamar a tu endpoint /reportes/xlsx
  };

  // useMemo evita recalcular en cada render si los pedidos no cambian.
  const totalPedidos = useMemo(() => PEDIDOS.length, []);

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={{ padding: 16 }}>
      {/* --- KPIs superiores (RF-E01) --- */}
      <View style={styles.kpiFila}>
        <TarjetaKPI titulo="VENTAS HOY" valor={`$${KPIS_HOY.ventas.toLocaleString()}`} color={COLORS.acento} />
        <TarjetaKPI titulo="GASTOS HOY" valor={`$${KPIS_HOY.gastos.toLocaleString()}`} color={COLORS.rojo} />
        <TarjetaKPI titulo="GANANCIA NETA" valor={`$${KPIS_HOY.ganancia.toLocaleString()}`} color={COLORS.acento} />
        <TarjetaKPI titulo="PEDIDOS ACTIVOS" valor={KPIS_HOY.pedidosActivos} />
      </View>

      {/* --- Filtros (RF-E02, RF-E07) --- */}
      <DropdownSimple opciones={FILTROS_PERIODO} valorActual={periodo} onSeleccionar={setPeriodo} />
      <DropdownSimple opciones={FILTROS_REPORTE} valorActual={tipoReporte} onSeleccionar={setTipoReporte} />

      {/* --- Botones de exportación (RF-E08, RF-E09) --- */}
      <View style={styles.botonesExportar}>
        <TouchableOpacity style={styles.botonPDF} onPress={exportarPDF}>
          <Text style={styles.botonPDFTexto}>⬇ Exportar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonXLSX} onPress={exportarXLSX}>
          <Text style={styles.botonXLSXTexto}>📊 Exportar XLSX</Text>
        </TouchableOpacity>
      </View>

      {/* --- Gráficas (RF-E10) --- */}
      <View style={styles.tarjetaGrande}>
        <Text style={styles.tituloTarjeta}>FLUJO DE VENTAS DEL DÍA</Text>
        <GraficaBarras datos={FLUJO_VENTAS} />
      </View>

      <View style={styles.tarjetaGrande}>
        <Text style={styles.tituloTarjeta}>PRODUCTOS MÁS VENDIDOS</Text>
        <GraficaProductos datos={PRODUCTOS_MAS_VENDIDOS} />
      </View>

      {/* --- Resumen semanal --- */}
      <View style={styles.kpiFila}>
        <TarjetaKPI titulo="VENTAS SEMANA" valor={`$${RESUMEN_SEMANA.ventas.toLocaleString()}`} color={COLORS.acento} />
        <TarjetaKPI titulo="GASTOS SEMANA" valor={`$${RESUMEN_SEMANA.gastos.toLocaleString()}`} color={COLORS.rojo} />
        <TarjetaKPI titulo="GANANCIA NETA SEMANA" valor={`$${RESUMEN_SEMANA.ganancia.toLocaleString()}`} color={COLORS.acento} />
      </View>

      {/* --- Tabla de pedidos (RF-E07) --- */}
      <View style={styles.tablaContainer}>
        <View style={styles.filaTablaHeader}>
          <Text style={[styles.celdaHeader, { flex: 1 }]}>TICKET</Text>
          <Text style={[styles.celdaHeader, { flex: 1.2 }]}>MESA</Text>
          <Text style={[styles.celdaHeader, { flex: 1.8 }]}>MESERO</Text>
          <Text style={[styles.celdaHeader, { flex: 1 }]}>TOTAL</Text>
          <Text style={[styles.celdaHeader, { flex: 1.3 }]}>MÉTODO</Text>
          <Text style={[styles.celdaHeader, { flex: 1.2 }]}>ESTATUS</Text>
        </View>
        <FlatList
          data={PEDIDOS}
          keyExtractor={(item) => item.ticket}
          renderItem={({ item }) => <FilaPedido item={item} />}
          scrollEnabled={false}
        />
      </View>

      <Text style={styles.footer}>{totalPedidos} pedidos en este periodo</Text>
    </ScrollView>
  );
}

// PASO 10: Todos los estilos al final, agrupados por sección.
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.fondo,
  },

  // KPIs
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
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  kpiTitulo: {
    fontSize: 11,
    color: COLORS.gris,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValor: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Dropdowns
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
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dropdownItemTexto: { color: COLORS.texto },

  // Exportar
  botonesExportar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  botonPDF: {
    borderWidth: 1,
    borderColor: COLORS.borde,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    opacity: 0.6, // deshabilitado visualmente, como en tu imagen
  },
  botonPDFTexto: { color: COLORS.texto, fontWeight: '600' },
  botonXLSX: {
    backgroundColor: COLORS.acento,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  botonXLSXTexto: { color: '#FFFFFF', fontWeight: '700' },

  // Tarjetas grandes (gráficas)
  tarjetaGrande: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  tituloTarjeta: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gris,
    marginBottom: 12,
  },

  // Gráfica de barras
  graficaBarrasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barraColumna: { alignItems: 'center', flex: 1 },
  barraMonto: { fontSize: 10, color: COLORS.gris, marginBottom: 4 },
  barra: { width: 18, backgroundColor: COLORS.acento, borderRadius: 4 },
  barraHora: { fontSize: 10, color: COLORS.gris, marginTop: 6 },

  // "Dona" de productos
  barraApilada: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  leyendaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  leyendaPunto: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  leyendaTexto: { flex: 1, color: COLORS.texto },
  leyendaPorcentaje: { color: COLORS.gris, fontWeight: '600' },

  // Tabla
  tablaContainer: {
    backgroundColor: COLORS.fondoTarjeta,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
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

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  footer: { textAlign: 'center', color: COLORS.gris, marginBottom: 20 },
});