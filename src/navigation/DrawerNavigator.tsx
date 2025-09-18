import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Image } from "react-native";

// importa solo las vistas que estarán en el drawer
import LotesScreen from "../views/LotesScreen";
import TransferenciasScreen from "../views/TransferenciasScreen";
import AsignacionesScreen from "../views/AsignacionesScreen";
import SilosScreen from "../views/SilosScreen";
import { CustomDrawerContent } from "./CustomDrawer"; // ajusta la ruta correcta


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="LotesScreen"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: "slide",
        drawerStyle: {
          backgroundColor: "#f5f5f5",
          width: 250,
        },
        headerStyle: { backgroundColor: "#00897B" },
        headerTintColor: "#fff",
      }}
    >
      <Drawer.Screen
        name="LotesScreen"
        component={LotesScreen}
        options={{
          drawerLabel: "Lotes",
          drawerIcon: () => (
            <Image
              source={require("../../assets/Iconos/lotes.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Drawer.Screen
        name="TransferenciasScreen"
        component={TransferenciasScreen}
        options={{
          drawerLabel: "Transferencias",
          drawerIcon: () => (
            <Image
              source={require("../../assets/Iconos/transfer.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Drawer.Screen
        name="AsignacionesScreen"
        component={AsignacionesScreen}
        options={{
          drawerLabel: "Asignaciones",
          drawerIcon: () => (
            <Image
              source={require("../../assets/Iconos/asignar.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Drawer.Screen
        name="SilosScreen"
        component={SilosScreen}
        options={{
          drawerLabel: "Silos",
          drawerIcon: () => (
            <Image
              source={require("../../assets/Iconos/silos.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
