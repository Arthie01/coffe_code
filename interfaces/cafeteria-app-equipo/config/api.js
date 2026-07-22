// Configuración central de la conexión con la API Coffee Code.
//
// IMPORTANTE: usa la IP LAN de la máquina donde corre la API (Docker → puerto 8000),
// NO "localhost", porque el celular físico o el emulador no alcanzan el localhost de tu PC.
//
// Para saber tu IP:  Linux/Mac → `hostname -I`   |   Windows → `ipconfig`
// Cámbiala por la IP de tu red cuando desarrolles en otra máquina.
export const API_URL = 'http://192.168.1.215:8000';
