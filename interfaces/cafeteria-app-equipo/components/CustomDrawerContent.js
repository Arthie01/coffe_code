import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

// Encabezado con la marca de la cafetería + datos del usuario logueado
// (nombre y rol) + lista de módulos permitidos + botón de cerrar sesión.
export default function CustomDrawerContent(props) {
  const { usuario, cerrarSesion } = useAuth();

  const salir = () => {
    cerrarSesion();
    const parent = props.navigation.getParent();
    if (parent) {
      parent.replace('Login');
    } else {
      props.navigation.replace('Login');
    }
  };

  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido_p || ''}`.trim() : 'Invitado';

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }} style={{ backgroundColor: colors.primary }}>
        <View style={styles.header}>
          <Ionicons name="cafe" size={38} color={colors.white} />
          <Text style={styles.title}>CAFÉ APP</Text>
          <Text style={styles.userName}>{nombre}</Text>
          {usuario?.rol && (
            <View style={styles.rolBadge}>
              <Text style={styles.rolText}>{usuario.rol.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.items}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <Pressable style={styles.logout} onPress={salir}>
        <Ionicons name="log-out-outline" size={18} color={colors.white} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { padding: 24, paddingTop: 40, marginBottom: 8 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginTop: 6, letterSpacing: 1 },
  userName: { color: colors.white, fontFamily: fonts.semibold, fontSize: 13, marginTop: 10 },
  rolBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  rolText: { color: colors.white, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  items: { paddingTop: 8 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  logoutText: { color: colors.white, fontFamily: fonts.bold, textAlign: 'center' },
});
