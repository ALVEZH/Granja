import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import { useGranjas, Granja } from '../hooks/useGranjas';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

type SeleccionSeccionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SeleccionSeccion'>;

export default function SeleccionSeccion() {
  const navigation = useNavigation<SeleccionSeccionNavigationProp>();
  const { setSeccionSeleccionada } = useSeccion();
  const { granjas, loading: loadingGranjas, error: errorGranjas } = useGranjas();
  // Estado para mostrar el modal de cerrar sesión
  const [modalCerrarSesion, setModalCerrarSesion] = useState(false);

  // Al seleccionar una sección (granja), guardar el objeto completo en el contexto y navegar al menú
  const handleSeleccion = (granja: Granja) => {
    setSeccionSeleccionada(granja);
    navigation.replace("Menu" );
  };

  // Lógica de cierre de sesión
  const handleCerrarSesion = () => {
    setModalCerrarSesion(true);
  };

  const confirmarCerrarSesion = () => {
    setModalCerrarSesion(false);
    setSeccionSeleccionada(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
        {/* Modal personalizado para cerrar sesión */}
        <Modal isVisible={modalCerrarSesion} onBackdropPress={() => setModalCerrarSesion(false)}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={48} color="#e53935" style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10, color: '#2a3a4b', textAlign: 'center' }}>¿Quieres cerrar la sesión?</Text>
            <Text style={{ color: '#666', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Se cerrará tu sesión y volverás a la pantalla de inicio de sesión.</Text>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#e0e7ef', borderRadius: 8, padding: 14, alignItems: 'center', marginRight: 8 }}
                onPress={() => setModalCerrarSesion(false)}
              >
                <Text style={{ color: '#2a3a4b', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#e53935', borderRadius: 8, padding: 14, alignItems: 'center', marginLeft: 8 }}
                onPress={confirmarCerrarSesion}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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