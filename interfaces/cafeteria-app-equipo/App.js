import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';

import TextInputAlerts from './screens/TextInputAlerts';
import DrawerNavigator from './navigation/DrawerNavigator';

const Stack = createNativeStackNavigator();

// Mantiene visible el splash nativo hasta que la fuente termine de cargar,
// así se evita el "flash" con la tipografía por defecto del sistema.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <OrderProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={TextInputAlerts} />
            <Stack.Screen name="Main" component={DrawerNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </OrderProvider>
    </AuthProvider>
  );
}
