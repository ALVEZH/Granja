import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSeccion } from './EnvaseScreen';
import Modal from 'react-native-modal';

type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Menu'
>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { seccionSeleccionada, setSeccionSeleccionada } = useSeccion();
  // Estado local para marcar vistas llenadas
  const [completado, setCompletado] = useState({
    Produccion: false,
    Alimento: false,
    Existencia: false,
    Envase: false,
  });
  // Estado para mostrar el modal de cerrar sesión
  const [modalCerrarSesion, setModalCerrarSesion] = useState(false);

  // Lógica de cierre de sesión
  const handleCerrarSesion = () => {
    setModalCerrarSesion(true);
  };

  const confirmarCerrarSesion = () => {
    setModalCerrarSesion(false);
    setSeccionSeleccionada?.(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Actualizar estado de completado al volver al menú (puedes personalizar la lógica)
  useFocusEffect(
    React.useCallback(() => {
      // Aquí podrías revisar si hay datos guardados en la base de datos/local storage
      // y actualizar el estado de completado en consecuencia.
      // Por ahora, no se marca automáticamente nada como completado.
    }, [])
  );

  // Navegación simple, sin pasar funciones en los params
  const navegar = (vista: keyof typeof completado) => {
    navigation.navigate(vista as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('SeleccionSeccion')}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Menú</Text>
        <TouchableOpacity onPress={handleCerrarSesion} style={{ marginLeft: 10 }}>
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
      {/* Texto de sección actual */}
      <Text style={{ textAlign: 'center', color: '#517aa2', fontSize: 16, marginBottom: 10 }}>
        Estás en la sección: <Text style={{ fontWeight: 'bold' }}>{seccionSeleccionada?.Nombre || ''}</Text>
      </Text>
      
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navegar('Produccion')}
        >
          <Image
            source={require('../../assets/Iconos/produccion.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Producción</Text>
          {completado.Produccion && <Ionicons name="checkmark-circle" size={24} color="limegreen" style={styles.checkIcon} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navegar('Alimento')}
        >
          <Image
            source={require('../../assets/Iconos/alimento.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Alimento</Text>
          {completado.Alimento && <Ionicons name="checkmark-circle" size={24} color="limegreen" style={styles.checkIcon} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navegar('Existencia')}
        >
          <Image
            source={require('../../assets/Iconos/existencia.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Existencia</Text>
          {completado.Existencia && <Ionicons name="checkmark-circle" size={24} color="limegreen" style={styles.checkIcon} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navegar('Envase')}
        >
          <Image
            source={require('../../assets/Iconos/envase.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Envase</Text>
          {completado.Envase && <Ionicons name="checkmark-circle" size={24} color="limegreen" style={styles.checkIcon} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('SilosScreen')}
        >
          <Image
            source={require('../../assets/Iconos/silos.png')} // 👈 crea o usa un ícono
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Silos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('AsignacionesScreen')}
        >
          <Image
            source={require('../../assets/Iconos/asignar.png')} // 👈 crea o usa un ícono
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Asignaciones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('TransferenciasScreen')}
        >
          <Image
            source={require('../../assets/Iconos/transfer.png')} // 👈 crea o usa un ícono
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Transferencias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('LotesScreen')}
        >
          <Image
            source={require('../../assets/Iconos/lotes.png')} // 👈 crea o usa un ícono
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Lotes</Text>
        </TouchableOpacity>

        {/* BOTÓN PARA LA VISTA RESUMEN */}
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ResumenSeccion')}
        >
          <Image source={require('../../assets/Iconos/Resumen.png')} style={styles.resumenIcon} resizeMode="contain" />
          <Text style={styles.label}>Resumen Sección</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eaf1f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    padding: 6,
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  listButton: {
    width: '60%',
    maxWidth: 400,
    backgroundColor: '#749BC2',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkIcon: { position: 'absolute', right: 10, top: 10 },
  resumenIcon: { width: 50, height: 50, marginBottom: 10 },
});
