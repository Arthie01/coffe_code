import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Pantalla inicial de la app: Login.
// Usa TextInput para capturar credenciales y Alert para validar.
// Al validar correctamente, entra al Drawer principal (Main).
export default function TextInputAlerts({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!correo || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña para continuar.');
      return;
    }
    if (!correo.includes('@')) {
      Alert.alert('Correo inválido', 'Escribe un correo electrónico válido.');
      return;
    }
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Ionicons name="cafe" size={50} color={colors.primary} style={styles.logo} />
          <Text style={styles.title}>BIENVENIDO</Text>
          <Text style={styles.subtitle}>Inicia sesión para tomar pedidos</Text>

          <TextInput
            style={styles.input}
            placeholder="mesero@cafe.com"
            placeholderTextColor={colors.textSecondary}
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.primaryDark }]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('Recuperar contraseña', 'Contacta al administrador.')}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, justifyContent: 'center', padding: 30 },
  logo: { alignSelf: 'center', marginBottom: 10 },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 30, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
    color: colors.text,
  },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: colors.white, fontFamily: fonts.bold, letterSpacing: 1 },
  link: { textAlign: 'center', color: colors.primary, marginTop: 16, fontSize: 12 },
});
