import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`);
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

type SeleccionSeccionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SeleccionSeccion'>;

export default function SeleccionSeccion() {
  const navigation = useNavigation<SeleccionSeccionNavigationProp>();

  const handleSeleccion = (seccion: string) => {
    // Aquí podrías guardar la sección seleccionada en un contexto/global si lo necesitas
    navigation.navigate('Produccion', { seccionSeleccionada: seccion });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Selecciona la SECCIÓN/Caseta</Text>
        {secciones.map((seccion) => (
          <TouchableOpacity
            key={seccion}
            style={styles.button}
            onPress={() => handleSeleccion(seccion)}
          >
            <Text style={styles.buttonText}>{seccion}</Text>
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