import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../views/LoginScreen';
import MenuScreen from '../views/MenuScreen';
import ProduccionScreen from '../views/ProduccionScreen';
import AlimentoScreen from '../views/AlimentoScreen';
import ExistenciaScreen from '../views/ExistenciaScreen';
import EnvaseScreen from '../views/EnvaseScreen';
import ResumenSeccion from '../views/ResumenSeccion';
import SeleccionSeccion from '../views/SeleccionSeccion';
import SilosScreen from '../views/SilosScreen'
import AsignacionesScreen from '../views/AsignacionesScreen'
import TransferenciasScreen from '../views/TransferenciasScreen'
import LotesScreen from '../views/LotesScreen'
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SeleccionSeccion" component={SeleccionSeccion} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Produccion" component={ProduccionScreen} />
        <Stack.Screen name="Alimento" component={AlimentoScreen} />
        <Stack.Screen name="Existencia" component={ExistenciaScreen} />
        <Stack.Screen name="Envase" component={EnvaseScreen} />
        <Stack.Screen name="ResumenSeccion" component={ResumenSeccion} />
        <Stack.Screen name="SilosScreen" component={SilosScreen} />
        <Stack.Screen name="AsignacionesScreen" component={AsignacionesScreen} />
        <Stack.Screen name="TransferenciasScreen" component={TransferenciasScreen} />
        <Stack.Screen name="LotesScreen" component={LotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
