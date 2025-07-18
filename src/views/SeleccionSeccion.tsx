import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Selecciona una sección</Text>
        {loadingGranjas && <ActivityIndicator size="large" color="#749BC2" style={{ marginVertical: 20 }} />}
        {errorGranjas && <Text style={{ color: 'red' }}>{errorGranjas}</Text>}
        {!loadingGranjas && granjas.map((granja) => (
          <TouchableOpacity
            key={granja.GranjaID}
            style={styles.button}
            onPress={() => handleSeleccion(granja)}
          >
            <Text style={styles.buttonText}>{granja.Nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eaf1f9',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 25,
    color: '#333',
    textAlign: 'center',
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