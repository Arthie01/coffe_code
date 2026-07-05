import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../screens/DashboardScreen';
import MeseroStack from './MeseroStack';
import SafeScreen from '../screens/SafeScreen';
import TargetasScreen from '../screens/TargetasScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const Drawer = createDrawerNavigator();

// Barra lateral principal: se puede ocultar deslizando o con el ícono ☰.
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
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'INICIO', drawerLabel: '🏠  Inicio' }}
      />
      <Drawer.Screen
        name="MeseroFlow"
        component={MeseroStack}
        options={{ headerShown: false, drawerLabel: '📝  Nuevo Pedido' }}
      />
      <Drawer.Screen
        name="Cocina"
        component={SafeScreen}
        options={{ title: 'COCINA', drawerLabel: '🍳  Cocina' }}
      />
      <Drawer.Screen
        name="Caja"
        component={TargetasScreen}
        options={{ title: 'CAJA', drawerLabel: '💵  Caja' }}
      />
    </Drawer.Navigator>
  );
}
