import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../views/LoginScreen";
import MenuScreen from "../views/MenuScreen";
import ProduccionScreen from "../views/ProduccionScreen";
import AlimentoScreen from "../views/AlimentoScreen";
import ExistenciaScreen from "../views/ExistenciaScreen";
import EnvaseScreen from "../views/EnvaseScreen";
import ResumenSeccion from "../views/ResumenSeccion";
import SeleccionSeccion from "../views/SeleccionSeccion";
import DrawerNavigator from "./DrawerNavigator"; // menú lateral con 4 pantallas
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Produccion" component={ProduccionScreen} />
        <Stack.Screen name="Alimento" component={AlimentoScreen} />
        <Stack.Screen name="Existencia" component={ExistenciaScreen} />
        <Stack.Screen name="Envase" component={EnvaseScreen} />
        <Stack.Screen name="ResumenSeccion" component={ResumenSeccion} />
        <Stack.Screen name="SeleccionSeccion" component={SeleccionSeccion} />
        <Stack.Screen name="MainApp" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
