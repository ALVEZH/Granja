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

type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Menu'
>;

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Menú</Text>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('Produccion')}
        >
          <Image
            source={require('../../assets/Iconos/produccion.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Producción</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('Alimento')}
        >
          <Image
            source={require('../../assets/Iconos/alimento.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Alimento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('Existencia')}
        >
          <Image
            source={require('../../assets/Iconos/existencia.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Existencia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('Envase')}
        >
          <Image
            source={require('../../assets/Iconos/envase.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.label}>Envase</Text>
        </TouchableOpacity>

        {/* NUEVO BOTÓN PARA LA VISTA RESUMEN */}
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ResumenSeccion')}
        >
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
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 70,
    marginTop: 25,
    color: '#333',
    textAlign: 'center',
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
});
