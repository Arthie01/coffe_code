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
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const Drawer = createDrawerNavigator();

const icon = (nombre) => ({ color, size }) => <Ionicons name={nombre} size={size} color={color} />;

// Barra lateral principal: se puede ocultar deslizando o con el ícono de menú.
// Desde aquí se navega a todos los módulos de la cafetería.
export default function DrawerNavigator() {
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
      <Drawer.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: 'INICIO', drawerLabel: 'Inicio', drawerIcon: icon('home-outline') }} />

      {/* ── Mesero ── */}
      <Drawer.Screen name="MeseroFlow" component={MeseroStack}
        options={{ headerShown: false, drawerLabel: 'Nuevo Pedido', drawerIcon: icon('create-outline') }} />
      <Drawer.Screen name="Entregas" component={EntregasScreen}
        options={{ title: 'ENTREGAS', drawerLabel: 'Entregas', drawerIcon: icon('bag-check-outline') }} />

      {/* ── Cocina ── */}
      <Drawer.Screen name="Cocina" component={SafeScreen}
        options={{ title: 'COCINA', drawerLabel: 'Cocina', drawerIcon: icon('restaurant-outline') }} />
      <Drawer.Screen name="Menu" component={MenuScreen}
        options={{ title: 'MENÚ', drawerLabel: 'Gestión del Menú', drawerIcon: icon('fast-food-outline') }} />
      <Drawer.Screen name="Inventario" component={InventarioScreen}
        options={{ title: 'INVENTARIO', drawerLabel: 'Inventario', drawerIcon: icon('file-tray-stacked-outline') }} />

      {/* ── Caja ── */}
      <Drawer.Screen name="Caja" component={TargetasScreen}
        options={{ title: 'CAJA', drawerLabel: 'Caja', drawerIcon: icon('cash-outline') }} />
      <Drawer.Screen name="Ganancias" component={GananciasScreen}
        options={{ title: 'GANANCIAS', drawerLabel: 'Ganancias', drawerIcon: icon('stats-chart-outline') }} />
      <Drawer.Screen name="Gastos" component={GastosScreen}
        options={{ title: 'GASTOS', drawerLabel: 'Gastos', drawerIcon: icon('receipt-outline') }} />
      <Drawer.Screen name="Compras" component={ComprasScreen}
        options={{ title: 'COMPRAS', drawerLabel: 'Compras', drawerIcon: icon('cart-outline') }} />
    </Drawer.Navigator>
  );
}
