# Café App — Proyecto Móvil (Programación Móvil, 2do Parcial)

App móvil de pedidos para una cafetería, hecha con **React Native + Expo**.
Incluye Login, barra lateral (Drawer) navegable, flujo completo de pedidos
(Mesero → Cocina → Caja) con datos compartidos en tiempo real, sistema de
descuentos, y tipografía/colores según la propuesta visual del reporte.

---

## 🚀 Cómo correrlo (para el equipo)

### Requisitos previos
- **Node.js** instalado (v18 o superior) — https://nodejs.org
- La app **Expo Go** instalada en el celular (Play Store / App Store)
- Estar conectado a la **misma red WiFi** en la compu y el celular

### Pasos

1. Clona el repo y entra a la carpeta del proyecto:
   ```bash
   git clone <url-del-repo>
   cd cafeteria-app
   ```

2. Instala todas las dependencias (están todas en `package.json`, un solo comando):
   ```bash
   npm install
   ```

3. Corre el proyecto:
   ```bash
   npx expo start -c
   ```
   El `-c` limpia caché — recomendado sobre todo la primera vez que cada
   quien lo clona.

4. Escanea el código QR que aparece en la terminal/navegador con la app
   **Expo Go** (Android: desde la app; iPhone: desde la cámara nativa).

5. (Opcional) Para verlo también en el navegador de la compu al mismo
   tiempo, con el servidor ya corriendo presiona **`w`** en la terminal.

### Si a alguien del equipo le sale error de Babel/Reanimated

Si ven un error tipo `Cannot find module 'babel-preset-expo'` o algo de
`worklets`/`reanimated`, es casi siempre porque `node_modules` quedó
incompleta. Solución:
```bash
rmdir /s /q node_modules      # PowerShell: Remove-Item -Recurse -Force node_modules
del package-lock.json         # PowerShell: Remove-Item package-lock.json
npm install
npx expo start -c
```

---

## 📦 Todo lo que se instaló (y para qué)

Ya viene declarado en `package.json`, pero por si alguien necesita
reinstalar algo suelto, esto es lo que se usó y por qué:

| Paquete | Para qué |
|---|---|
| `expo` | Framework base del proyecto |
| `expo-status-bar` | Controlar la barra de estado del teléfono |
| `expo-font` | Cargar la tipografía Space Grotesk |
| `expo-splash-screen` | Mantener el splash visible mientras carga la fuente |
| `@expo-google-fonts/space-grotesk` | La fuente Space Grotesk lista para usar |
| `react` / `react-native` | Base del proyecto |
| `@react-navigation/native` | Motor de navegación |
| `@react-navigation/native-stack` | Navegación tipo "pila" (Login → pantallas) |
| `@react-navigation/drawer` | La barra lateral (Drawer) deslizable |
| `react-native-screens` | Requisito de rendimiento de React Navigation |
| `react-native-safe-area-context` | Requisito de React Navigation (SafeAreaView) |
| `react-native-gesture-handler` | Gestos (deslizar para abrir el Drawer) |
| `react-native-reanimated` | Animaciones del Drawer |
| `react-native-worklets` | Requisito de Reanimated 4 (antes iba integrado, ahora es paquete aparte) |

---

## 🗂️ Estructura del proyecto

```
cafeteria-app/
├── App.js                        ← Punto de entrada: carga fuentes y arma la navegación
├── app.json                      ← Configuración de Expo
├── babel.config.js               ← Necesario para que el Drawer anime bien
├── package.json
├── context/
│   └── OrderContext.js           ← "Cerebro" de la app: carrito, pedidos y descuentos compartidos
├── navigation/
│   ├── DrawerNavigator.js        ← Barra lateral con las 4 secciones
│   └── MeseroStack.js            ← Flujo interno de "Nuevo Pedido"
├── components/
│   └── CustomDrawerContent.js    ← Diseño de la barra lateral (verde, con logout)
├── theme/
│   ├── colors.js                 ← Paleta de colores del reporte (#00704A, #E3E7D3...)
│   └── fonts.js                  ← Nombres de la fuente Space Grotesk
└── screens/
    ├── TextInputAlerts.js        ← Login (primera pantalla) — TextInput + Alert
    ├── DashboardScreen.js        ← Inicio: resumen del día + accesos rápidos
    ├── PresseableScreen.js       ← Seleccionar mesa — Pressable
    ├── FlatListScreen.js         ← Menú de platillos — SectionList
    ├── ModalBottomSheetScreen.js ← Confirmar pedido — Modal + Bottom Sheet
    ├── SafeScreen.js             ← Cocina — SafeAreaView/ScrollView + Switch
    └── TargetasScreen.js         ← Caja — ActivityIndicator + KeyboardAvoidingView + descuentos
```

---

## 🧭 Flujo de la app

```
Login (primera pantalla, valida campos)
   └─▶ Barra lateral (Drawer, se abre con ☰ o deslizando)
          ├─ 🏠 Inicio        → resumen del día + accesos rápidos
          ├─ 📝 Nuevo Pedido  → Mesa → Menú → Confirmar (envía a cocina)
          ├─ 🍳 Cocina        → pedidos entrantes + disponibilidad del menú
          └─ 💵 Caja          → cobro de pedidos listos + descuentos + ingresos
```

Todo el estado (carrito, pedidos, sus estados y descuentos) vive en
`context/OrderContext.js`, así que si Mesero envía un pedido, aparece al
instante en Cocina; cuando Cocina lo marca "Listo", aparece al instante
en Caja.

## 🏷️ Sistema de descuentos (Caja)

Cada ticket "Listo" tiene su propio campo de código de descuento. Códigos
válidos para pruebas:

| Código | Descuento |
|---|---|
| `CAFE10` | 10% |
| `BIENVENIDO` | 15% |
| `ESTUDIANTE` | 20% |

Se pueden editar/agregar en `context/OrderContext.js`, en el objeto
`CODIGOS_DESCUENTO`.

---

## ⚠️ Notas importantes (para no confundirse en equipo)

- **Los pedidos viven en memoria** (`useState` dentro de `OrderContext`):
  se comparten en tiempo real entre Mesero, Cocina y Caja mientras la app
  está abierta en un mismo dispositivo/pestaña, pero **se pierden al
  cerrar la app** y **no se sincronizan entre dos celulares distintos**
  todavía (eso requiere el backend real). Está pensado así para esta
  entrega — cuando conecten el API de FastAPI, se reemplazan las
  funciones `addToCart`, `submitOrder`, `actualizarEstado`,
  `aplicarDescuento` de `OrderContext.js` por llamadas `fetch`/`axios`.
- El **Login** valida solo que los campos no estén vacíos y que el correo
  tenga "@" — no hay backend de autenticación real todavía.
- **Colores** centralizados en `theme/colors.js` (verde `#00704A`, fondo
  `#E3E7D3`) — no se deben hardcodear colores nuevos en los estilos,
  siempre importar de ahí.
- **Tipografía**: Space Grotesk se usa en negrita/mayúsculas para títulos
  grandes (`fonts.bold` desde `theme/fonts.js`), y `fonts.regular` /
  `.medium` / `.semibold` para el resto si se necesita.
