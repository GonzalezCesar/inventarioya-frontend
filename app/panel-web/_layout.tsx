import { FontAwesome5 } from "@expo/vector-icons";
import { Slot, useRouter, usePathname } from "expo-router";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";

export default function LayoutPanelWeb() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Para saber en qué página estamos y resaltar el botón
  const { colores } = useTheme();
  
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // 🛡️ FILTRO DE SEGURIDAD (EL PORTERO)
  // Si no es el dueño (basado en tus emails de superadmin), lo sacamos
  // 🛡️ FILTRO DE SEGURIDAD (EL PORTERO)
  // Ahora permite el paso a cualquiera que tenga el rango adecuado, sin importar su correo
  const esSuperAdmin = 
    user?.rol?.toLowerCase() === "superadmin" || 
    user?.rol?.toLowerCase() === "administrador" ||
    user?.email === "admin@inventarioya.com"; // Dejamos este por seguridad en caso de emergencia

  if (!esSuperAdmin) {
    return (
      <View style={estilos.centrado}>
        <FontAwesome5 name="lock" size={50} color={colores.error} />
        <Text style={estilos.textoError}>Acceso Restringido</Text>
        <TouchableOpacity style={estilos.botonVolver} onPress={() => router.replace("/(tabs)")}>
          <Text style={{color: '#000', fontWeight: 'bold'}}>Volver a la App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const MenuLink = ({ titulo, icono, ruta }: { titulo: string; icono: string; ruta: string }) => {
    const activo = pathname === ruta;
    return (
      <TouchableOpacity 
        style={[estilos.navLink, activo && estilos.navLinkActivo]} 
        onPress={() => router.push(ruta)}
      >
        <FontAwesome5 
          name={icono} 
          size={18} 
          color={activo ? colores.primario : "#8a8a8a"} 
          style={{ width: 25 }}
        />
        <Text style={[estilos.navText, activo && { color: colores.primario }]}>{titulo}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      
      {/* SIDEBAR (BARRA LATERAL IZQUIERDA) */}
      <View style={estilos.sidebar}>
        <View style={estilos.logoContainer}>
            <Text style={estilos.logoText}>InventarioYa</Text>
            <View style={estilos.badgeSaaS}><Text style={estilos.badgeText}>SaaS</Text></View>
        </View>

        <ScrollView style={{ flex: 1, marginTop: 20 }}>
          <MenuLink titulo="Dashboard" icono="chart-line" ruta="/panel-web" />
          <MenuLink titulo="Clientes" icono="users" ruta="/panel-web/clientes" />
          <MenuLink titulo="Base de Datos" icono="database" ruta="/panel-web/database" />
        </ScrollView>

        <View style={estilos.footerSidebar}>
            <TouchableOpacity style={estilos.btnCerrarSesion} onPress={signOut}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ff4444" />
                <Text style={{color: '#ff4444', fontWeight: 'bold', marginLeft: 10}}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO DERECHO (AQUÍ SE CARGAN LAS PÁGINAS) */}
      <View style={estilos.contenidoDerecho}>
        <Slot /> 
      </View>

    </View>
  );
}

const crearEstilos = (c: any) => StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    flexDirection: "row", // Sidebar a la izquierda, contenido a la derecha
    backgroundColor: "#0d110d",
  },
  sidebar: {
    width: 280,
    backgroundColor: "#121212",
    borderRightWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    padding: 20,
    // En web esto se comporta como un fixed
    ...Platform.select({ web: { height: '100vh', position: 'sticky', top: 0 } })
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
    paddingLeft: 10
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    color: c.primario,
    letterSpacing: -1
  },
  badgeSaaS: {
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: c.primario
  },
  badgeText: { color: c.primario, fontSize: 10, fontWeight: 'bold' },
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  navLinkActivo: {
    backgroundColor: "rgba(198, 255, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  navText: {
    color: "#8a8a8a",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  contenidoDerecho: {
    flex: 1,
    height: '100vh',
  },
  footerSidebar: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  btnCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15
  },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d110d' },
  textoError: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  botonVolver: { backgroundColor: c.primario, padding: 15, borderRadius: 10, marginTop: 30 }
});