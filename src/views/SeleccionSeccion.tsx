import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import { useGranjas, Granja } from '../hooks/useGranjas';

type SeleccionSeccionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SeleccionSeccion'>;

export default function SeleccionSeccion() {
  const navigation = useNavigation<SeleccionSeccionNavigationProp>();
  const { setSeccionSeleccionada } = useSeccion();
  const { granjas, loading: loadingGranjas, error: errorGranjas } = useGranjas();

  // Al seleccionar una sección (granja), guardar el objeto completo en el contexto y navegar al menú
  const handleSeleccion = (granja: Granja) => {
    setSeccionSeleccionada(granja);
    navigation.navigate('Menu');
  };

  // Lógica de cierre de sesión
  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            setSeccionSeleccionada(null);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Selecciona una sección</Text>
          <TouchableOpacity onPress={handleCerrarSesion} style={styles.logoutButton}>
            <Image source={require('../../assets/Iconos/CerrarSesion.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        {loadingGranjas && <ActivityIndicator size="large" color="#749BC2" style={{ marginVertical: 20 }} />}
        {errorGranjas && <Text style={{ color: 'red' }}>{errorGranjas}</Text>}
        <View style={styles.container}>
          {!loadingGranjas && granjas
            .filter(granja => granja.Nombre !== 'TEST_GRANJA_API')
            .map((granja) => (
            <TouchableOpacity
              key={granja.GranjaID}
              style={styles.button}
              onPress={() => handleSeleccion(granja)}
            >
              <Text style={styles.buttonText}>{granja.Nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eaf1f9',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    padding: 4,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginBottom: 0,
    marginTop: 0,
  },
  button: {
    width: '70%',
    backgroundColor: '#749BC2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 