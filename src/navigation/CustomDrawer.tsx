// src/navigation/CustomDrawer.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types"; // importa tus tipos de navegación

export function CustomDrawerContent(props: any) {
  // Tipamos correctamente para que 'replace' exista
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí", onPress: () => navigation.replace("Login") },
    ]);
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* Lista de items del Drawer */}
      <DrawerItemList {...props} />

      {/* Línea separadora */}
      <View style={styles.separator} />

      {/* Botón personalizado de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Image
          source={require("../../assets/Iconos/exit.png")}
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
    separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginHorizontal: 16,
    marginVertical: 10,
  },logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FF5252",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
    elevation: 6,
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
