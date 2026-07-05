import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PresseableScreen from '../screens/PresseableScreen';
import FlatListScreen from '../screens/FlatListScreen';
import ModalBottomSheetScreen from '../screens/ModalBottomSheetScreen';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const Stack = createNativeStackNavigator();

// Flujo completo del Mesero: Seleccionar mesa -> Menú -> Confirmar pedido.
// Vive como UNA sola pantalla dentro del Drawer ("Nuevo Pedido").
export default function MeseroStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.primary },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="SeleccionarMesa" component={PresseableScreen} options={{ title: 'SELECCIONAR MESA' }} />
      <Stack.Screen name="MenuPlatillos" component={FlatListScreen} options={{ title: 'MENÚ' }} />
      <Stack.Screen name="Confirmar" component={ModalBottomSheetScreen} options={{ title: 'CONFIRMAR PEDIDO' }} />
    </Stack.Navigator>
  );
}
