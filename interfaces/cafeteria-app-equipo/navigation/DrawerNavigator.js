import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import MeseroStack from './MeseroStack';
import EntregasScreen from '../screens/EntregasScreen';
import SafeScreen from '../screens/SafeScreen';
import MenuScreen from '../screens/MenuScreen';
import InventarioScreen from '../screens/InventarioScreen';
import TargetasScreen from '../screens/TargetasScreen';
import GananciasScreen from '../screens/GananciasScreen';
import GastosScreen from '../screens/GastosScreen';
import ComprasScreen from '../screens/ComprasScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const Drawer = createDrawerNavigator();

const icon = (nombre) => ({ color, size }) => <Ionicons name={nombre} size={size} color={color} />;

// Cada interfaz declara qué roles pueden verla. El Drawer solo monta las
// pantallas permitidas para el rol del usuario logueado, así cada quien ve
// únicamente su módulo (Mesero / Cocinero / Cajero). El Admin accede a cada uno.
const PANTALLAS = [
  { name: 'Dashboard', component: DashboardScreen, roles: ['Admin', 'Mesero', 'Cocinero', 'Cajero'],
    options: { title: 'INICIO', drawerLabel: 'Inicio', drawerIcon: icon('home-outline') } },

  // ── Mesero ──
  { name: 'MeseroFlow', component: MeseroStack, roles: ['Admin', 'Mesero'],
    options: { headerShown: false, drawerLabel: 'Nuevo Pedido', drawerIcon: icon('create-outline') } },
  { name: 'Entregas', component: EntregasScreen, roles: ['Admin', 'Mesero'],
    options: { title: 'MIS PEDIDOS', drawerLabel: 'Mis Pedidos', drawerIcon: icon('list-outline') } },

  // ── Cocina ──
  { name: 'Cocina', component: SafeScreen, roles: ['Admin', 'Cocinero'],
    options: { title: 'COCINA', drawerLabel: 'Cocina', drawerIcon: icon('restaurant-outline') } },
  { name: 'Menu', component: MenuScreen, roles: ['Admin', 'Cocinero'],
    options: { title: 'MENÚ', drawerLabel: 'Gestión del Menú', drawerIcon: icon('fast-food-outline') } },
  { name: 'Inventario', component: InventarioScreen, roles: ['Admin', 'Cocinero'],
    options: { title: 'INVENTARIO', drawerLabel: 'Inventario', drawerIcon: icon('file-tray-stacked-outline') } },

  // ── Caja ──
  { name: 'Caja', component: TargetasScreen, roles: ['Admin', 'Cajero'],
    options: { title: 'CAJA', drawerLabel: 'Caja', drawerIcon: icon('cash-outline') } },
  { name: 'Ganancias', component: GananciasScreen, roles: ['Admin', 'Cajero'],
    options: { title: 'GANANCIAS', drawerLabel: 'Ganancias', drawerIcon: icon('stats-chart-outline') } },
  { name: 'Gastos', component: GastosScreen, roles: ['Admin', 'Cajero'],
    options: { title: 'GASTOS', drawerLabel: 'Gastos', drawerIcon: icon('receipt-outline') } },
  { name: 'Compras', component: ComprasScreen, roles: ['Admin', 'Cajero'],
    options: { title: 'COMPRAS', drawerLabel: 'Compras', drawerIcon: icon('cart-outline') } },
];

// Barra lateral principal: se puede ocultar deslizando o con el ícono de menú.
// Solo muestra los módulos que le tocan al rol del usuario.
export default function DrawerNavigator() {
  const { rol } = useAuth();
  const permitidas = PANTALLAS.filter((p) => p.roles.includes(rol));

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.white },
        headerTintColor: colors.white,
        drawerActiveBackgroundColor: colors.white,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.white,
        drawerLabelStyle: { fontFamily: fonts.semibold, fontSize: 14 },
        drawerStyle: { backgroundColor: colors.primary, width: 260 },
      }}
    >
      {permitidas.map((p) => (
        <Drawer.Screen key={p.name} name={p.name} component={p.component} options={p.options} />
      ))}
    </Drawer.Navigator>
  );
}
