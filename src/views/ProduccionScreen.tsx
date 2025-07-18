"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCasetas } from '../hooks/useCasetas';
import { useGranjas } from '../hooks/useGranjas';

const tiposHuevo = [
  'BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'
];

// Habilita LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Definir el tipo para los datos de cada caseta en producción
interface CasetaProduccion {
  [tipo: string]: { cajas: string; restos: string };
}

export default function ProduccionScreen() {
  // const route = useRoute();
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { seccionSeleccionada } = useSeccion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const granjaNombre = seccionSeleccionada?.Nombre ?? '';
  const { granjas } = useGranjas();
  const granja = granjas.find(g => g.Nombre === granjaNombre);
  const { casetas, loading: loadingCasetas, error: errorCasetas } = useCasetas(granjaId);

  // Filtrar solo las casetas de la granja seleccionada (por si la API no lo hace)
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [caseta]: { [tipo]: { cajas: string, restos: string } } }
  const [tabla, setTabla] = useState<Record<string, CasetaProduccion>>({});

  // Sincronizar tabla cuando cambian las casetasFiltradas
  useEffect(() => {
    if (!casetasFiltradas) return;
    setTabla(prev => {
      let changed = false;
      const obj: Record<string, CasetaProduccion> = { ...prev };
      // Agregar nuevas casetas
      casetasFiltradas.forEach(caseta => {
        if (!obj[caseta.Nombre]) {
          changed = true;
          obj[caseta.Nombre] = {};
          tiposHuevo.forEach(tipo => {
            obj[caseta.Nombre][tipo] = { cajas: '', restos: '' };
          });
        } else {
          tiposHuevo.forEach(tipo => {
            if (!obj[caseta.Nombre][tipo]) {
              changed = true;
              obj[caseta.Nombre][tipo] = { cajas: '', restos: '' };
            }
          });
        }
      });
      // Eliminar casetas que ya no existen
      Object.keys(obj).forEach(nombre => {
        if (!casetasFiltradas.find(c => c.Nombre === nombre)) {
          changed = true;
          delete obj[nombre];
        }
      });
      // Solo actualizar si hubo cambios
      if (changed) return obj;
      return prev;
    });
  }, [JSON.stringify(casetasFiltradas)]);

  // Calcular totales por tipo
  const totales = useMemo(() => {
    const t: any = {};
    tiposHuevo.forEach(tipo => {
      let cajas = 0, restos = 0;
      casetasFiltradas.forEach(caseta => {
        cajas += Number(tabla[caseta.Nombre]?.[tipo]?.cajas) || 0;
        restos += Number(tabla[caseta.Nombre]?.[tipo]?.restos) || 0;
      });
      t[tipo] = { cajas, restos };
    });
    return t;
  }, [tabla, casetasFiltradas]);

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, tipo: string, campo: 'cajas' | 'restos', valor: string) => {
    setTabla((prev: typeof tabla) => ({
      ...prev,
      [caseta]: {
        ...prev[caseta],
        [tipo]: {
          ...prev[caseta][tipo],
          [campo]: valor.replace(/[^0-9]/g, '')
        }
      }
    }));
  };

  // Estado para controlar qué casetas están abiertas
  const [casetasAbiertas, setCasetasAbiertas] = useState<{ [caseta: string]: boolean }>(() => {
    const obj: { [caseta: string]: boolean } = {};
    casetasFiltradas.forEach(c => { obj[c.Nombre] = false; });
    return obj;
  });

  const toggleCaseta = (caseta: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCasetasAbiertas(prev => ({ ...prev, [caseta]: !prev[caseta] }));
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetasFiltradas || []) {
        const data: any = {
          caseta: caseta.Nombre, // <-- solo el nombre
          fecha: fechaHoy,
          granja_id: granjaId,
          blanco_cajas: Number(tabla[caseta.Nombre]?.['BLANCO']?.cajas) || 0,
          blanco_restos: Number(tabla[caseta.Nombre]?.['BLANCO']?.restos) || 0,
          roto1_cajas: Number(tabla[caseta.Nombre]?.['ROTO 1']?.cajas) || 0,
          roto1_restos: Number(tabla[caseta.Nombre]?.['ROTO 1']?.restos) || 0,
          roto2_cajas: Number(tabla[caseta.Nombre]?.['ROTO 2']?.cajas) || 0,
          roto2_restos: Number(tabla[caseta.Nombre]?.['ROTO 2']?.restos) || 0,
          manchado_cajas: Number(tabla[caseta.Nombre]?.['MANCHADO']?.cajas) || 0,
          manchado_restos: Number(tabla[caseta.Nombre]?.['MANCHADO']?.restos) || 0,
          fragil1_cajas: Number(tabla[caseta.Nombre]?.['FRAGIL 1']?.cajas) || 0,
          fragil1_restos: Number(tabla[caseta.Nombre]?.['FRAGIL 1']?.restos) || 0,
          fragil2_cajas: Number(tabla[caseta.Nombre]?.['FRAGIL 2']?.cajas) || 0,
          fragil2_restos: Number(tabla[caseta.Nombre]?.['FRAGIL 2']?.restos) || 0,
          yema_cajas: Number(tabla[caseta.Nombre]?.['YEMA']?.cajas) || 0,
          yema_restos: Number(tabla[caseta.Nombre]?.['YEMA']?.restos) || 0,
          b1_cajas: Number(tabla[caseta.Nombre]?.['B1']?.cajas) || 0,
          b1_restos: Number(tabla[caseta.Nombre]?.['B1']?.restos) || 0,
          extra240_cajas: Number(tabla[caseta.Nombre]?.['EXTRA 240PZS']?.cajas) || 0,
          extra240_restos: Number(tabla[caseta.Nombre]?.['EXTRA 240PZS']?.restos) || 0,
        };
        console.log('Guardando producción:', data);
        await DatabaseQueries.insertProduccion(data);
      }
      Alert.alert('Éxito', 'Datos de producción guardados correctamente.');
      navigation.replace('Menu');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('Menu')}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRODUCCIÓN</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/produccion.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {loadingCasetas && <Text>Cargando casetas...</Text>}
          {errorCasetas && <Text style={{ color: 'red' }}>{errorCasetas}</Text>}
          {casetasFiltradas.map((caseta, idx) => {
            const datosCaseta = tabla[caseta.Nombre] || {};
            return (
              <View key={caseta.Nombre} style={[styles.casetaBlock, idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd]}>
                <TouchableOpacity onPress={() => toggleCaseta(caseta.Nombre)} style={styles.casetaHeader} activeOpacity={0.7}>
                  <Text style={styles.casetaTitle}>{caseta.Nombre}</Text>
                  <Text style={styles.caret}>{casetasAbiertas[caseta.Nombre] ? '\u25b2' : '\u25bc'}</Text>
                </TouchableOpacity>
                {casetasAbiertas[caseta.Nombre] && (
                  <View style={styles.casetaContent}>
                    {tiposHuevo.map(tipo => {
                      const datosTipo = (datosCaseta && datosCaseta[tipo]) ? datosCaseta[tipo] : { cajas: '', restos: '' };
                      return (
                        <View key={tipo} style={styles.tipoRow}>
                          <Text style={styles.tipoLabel}>{tipo}</Text>
                          <View style={styles.inputGroup}>
                            <View style={styles.inputPair}>
                              <Text style={styles.inputLabel}>Cajas</Text>
                              <TextInput
                                style={styles.inputCell}
                                value={datosTipo.cajas}
                                onChangeText={v => handleChange(caseta.Nombre, tipo, 'cajas', v)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                            <View style={styles.inputPair}>
                              <Text style={styles.inputLabel}>Restos</Text>
                              <TextInput
                                style={styles.inputCell}
                                value={datosTipo.restos}
                                onChangeText={v => handleChange(caseta.Nombre, tipo, 'restos', v)}
                                keyboardType="numeric"
                                placeholder="0"
                              />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          {/* Totales generales */}
          <View style={styles.totalesBlock}>
            <Text style={styles.totalesTitle}>Totales por tipo</Text>
            {tiposHuevo.map(tipo => (
              <View key={tipo} style={styles.totalesRow}>
                <Text style={styles.tipoLabel}>{tipo}</Text>
                <Text style={styles.totalesCell}>Cajas: {totales[tipo].cajas}</Text>
                <Text style={styles.totalesCell}>Restos: {totales[tipo].restos}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
            <Text style={styles.btnGuardarText}>Guardar y continuar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
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
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2a3a4b',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 1,
  },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
  headerTextAbsoluteWrapper: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 10, textAlign: 'center' },
  casetaBlock: { borderRadius: 10, margin: 10, padding: 0, elevation: 2, overflow: 'hidden' },
  casetaBlockEven: { backgroundColor: '#f4f8fd' },
  casetaBlockOdd: { backgroundColor: '#e0e7ef' },
  casetaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#c7d7ee' },
  casetaTitle: { fontSize: 16, fontWeight: 'bold', color: '#2a3a4b' },
  caret: { fontSize: 18, color: '#2a3a4b', marginLeft: 8 },
  casetaContent: { padding: 10 },
  tipoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tipoLabel: { width: 100, fontWeight: '600', color: '#3b3b3b', fontSize: 13 },
  inputGroup: { flexDirection: 'row', gap: 10 },
  inputPair: { flexDirection: 'column', alignItems: 'center', marginRight: 10 },
  inputLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  inputCell: {
    borderWidth: 1.5,
    borderColor: '#b0b8c1',
    borderRadius: 8,
    width: 60,
    height: 40,
    margin: 4,
    paddingHorizontal: 12,
    textAlign: 'center',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  totalesBlock: { margin: 16, padding: 10, backgroundColor: '#dbeafe', borderRadius: 8 },
  totalesTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#2a3a4b' },
  totalesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  totalesCell: { marginLeft: 10, fontSize: 13, color: '#333' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
