import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Menu'
>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  // Estado local para marcar vistas llenadas
  const [completado, setCompletado] = useState({
    Produccion: false,
    Alimento: false,
    Existencia: false,
    Envase: false,
  });

  // Función para navegar y marcar como completado al volver
  const navegarYCompletar = (vista: keyof typeof completado) => {
    navigation.navigate(vista as any, {
      onGoBack: () => setCompletado(prev => ({ ...prev, [vista]: true })),
    });
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
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* <Text style={styles.title}>Menú</Text> */}

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navegarYCompletar('Produccion')}
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
          onPress={() => navegarYCompletar('Alimento')}
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
          onPress={() => navegarYCompletar('Existencia')}
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
          onPress={() => navegarYCompletar('Envase')}
        >
          <Image
            source={require('../../assets/Iconos/envase.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Envase</Text>
          {completado.Envase && <Ionicons name="checkmark-circle" size={24} color="limegreen" style={styles.checkIcon} />}
        </TouchableOpacity>

        {/* NUEVO BOTÓN PARA LA VISTA RESUMEN */}
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
