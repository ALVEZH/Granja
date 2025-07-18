"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCasetas } from '../hooks/useCasetas';
import { useGranjas } from '../hooks/useGranjas';

// Definir el tipo para los datos de cada caseta
interface CasetaAlimento {
  existenciaInicial: string;
  entrada: string;
  consumo: string;
  tipo: string;
}

const columnas = ['Existencia Inicial', 'Entrada', 'Consumo', 'Tipo'];

export default function AlimentoScreen() {
  // const route = useRoute();
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { seccionSeleccionada } = useSeccion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Obtener GranjaID de la granja seleccionada (asumiendo que seccionSeleccionada es "Granja - Caseta")
  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const granjaNombre = seccionSeleccionada?.Nombre ?? '';
  const { granjas } = useGranjas();
  const granja = granjas.find(g => g.Nombre === granjaNombre);
  const { casetas, loading: loadingCasetas, error: errorCasetas } = useCasetas(granjaId);

  // Filtrar solo las casetas de la granja seleccionada (por si la API no lo hace)
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  // Estructura: { [caseta]: { existenciaInicial, entrada, consumo, tipo } }
  const [tabla, setTabla] = useState<Record<string, CasetaAlimento>>({});

  // Sincronizar tabla cuando cambian las casetas
  useEffect(() => {
    if (!casetas) return;
    setTabla((prev: Record<string, CasetaAlimento>) => {
      const obj: Record<string, CasetaAlimento> = {};
      casetas.forEach(caseta => {
        obj[caseta.Nombre] = prev[caseta.Nombre] || { existenciaInicial: '', entrada: '', consumo: '', tipo: '' };
      });
      return obj;
    });
  }, [casetas]);

  // Calcular totales
  const totales = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, consumo = 0;
    casetas?.forEach(caseta => {
      existenciaInicial += Number(tabla[caseta.Nombre]?.existenciaInicial) || 0;
      entrada += Number(tabla[caseta.Nombre]?.entrada) || 0;
      consumo += Number(tabla[caseta.Nombre]?.consumo) || 0;
    });
    return { existenciaInicial, entrada, consumo };
  }, [tabla, casetas]);

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, campo: string, valor: string) => {
    setTabla((prev: Record<string, CasetaAlimento>) => ({
      ...prev,
      [caseta]: {
        ...prev[caseta],
        [campo]: campo === 'tipo' ? valor : valor.replace(/[^0-9.]/g, '')
      }
    }));
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    for (const caseta of casetas || []) {
      // Solo guarda si hay algún campo lleno
      if (
        tabla[caseta.Nombre]?.existenciaInicial ||
        tabla[caseta.Nombre]?.entrada ||
        tabla[caseta.Nombre]?.consumo ||
        tabla[caseta.Nombre]?.tipo
      ) {
        const data: any = {
          caseta: caseta.Nombre,
          fecha: fechaHoy,
          granja_id: granjaId,
          existencia_inicial: Number(tabla[caseta.Nombre]?.existenciaInicial) || 0,
          entrada: Number(tabla[caseta.Nombre]?.entrada) || 0,
          consumo: Number(tabla[caseta.Nombre]?.consumo) || 0,
          tipo: tabla[caseta.Nombre]?.tipo,
          edad: '',
        };
        await DatabaseQueries.insertAlimento(data);
      }
    }
    Alert.alert('Éxito', 'Datos de alimento guardados correctamente.');
    navigation.replace('Menu');
  };

  // Estado para controlar qué casetas están abiertas
  const [casetasAbiertas, setCasetasAbiertas] = useState<{ [caseta: string]: boolean }>(() => {
    const obj: { [caseta: string]: boolean } = {};
    casetas?.forEach(c => { obj[c.Nombre] = false; });
    return obj;
  });

  const toggleCaseta = (caseta: string) => {
    if (typeof LayoutAnimation !== 'undefined') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setCasetasAbiertas(prev => ({ ...prev, [caseta]: !prev[caseta] }));
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
        <Text style={styles.headerTitle}>ALIMENTO</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/alimento.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {loadingCasetas && <Text>Cargando casetas...</Text>}
          {errorCasetas && <Text style={{ color: 'red' }}>{errorCasetas}</Text>}
          {casetasFiltradas && casetasFiltradas.map((caseta, idx) => (
            <View key={caseta.Nombre} style={[styles.casetaBlock, idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd]}>
              <TouchableOpacity onPress={() => toggleCaseta(caseta.Nombre)} style={styles.casetaHeader} activeOpacity={0.7}>
                <Text style={styles.casetaTitle}>{caseta.Nombre}</Text>
                <Text style={styles.caret}>{casetasAbiertas[caseta.Nombre] ? '\u25b2' : '\u25bc'}</Text>
              </TouchableOpacity>
              {casetasAbiertas[caseta.Nombre] && (
                <View style={styles.casetaContent}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Existencia Inicial</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[caseta.Nombre]?.existenciaInicial || ''}
                      onChangeText={v => handleChange(caseta.Nombre, 'existenciaInicial', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Entrada</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[caseta.Nombre]?.entrada || ''}
                      onChangeText={v => handleChange(caseta.Nombre, 'entrada', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Consumo</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[caseta.Nombre]?.consumo || ''}
                      onChangeText={v => handleChange(caseta.Nombre, 'consumo', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Tipo</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[caseta.Nombre]?.tipo || ''}
                      onChangeText={v => handleChange(caseta.Nombre, 'tipo', v)}
                      placeholder="Tipo"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
          {/* Totales generales */}
          <View style={styles.totalesBlock}>
            <Text style={styles.totalesTitle}>Totales</Text>
            <View style={styles.totalesRow}>
              <Text style={styles.totalesCell}>Existencia Inicial: {totales.existenciaInicial}</Text>
              <Text style={styles.totalesCell}>Entrada: {totales.entrada}</Text>
              <Text style={styles.totalesCell}>Consumo: {totales.consumo}</Text>
            </View>
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
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
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
  headerImage: { width: 48, height: 48, marginRight: 10 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', margin: 12, textAlign: 'center', color: '#333' },
  table: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 8, margin: 8, backgroundColor: '#fff' },
  headerRowTable: { flexDirection: 'row', backgroundColor: '#dbeafe', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 90, textAlign: 'center', color: '#222' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  inputCell: {
    borderWidth: 1.5,
    borderColor: '#b0b8c1',
    borderRadius: 8,
    width: 110,
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
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  casetaBlock: { borderRadius: 10, margin: 10, padding: 0, elevation: 2, overflow: 'hidden' },
  casetaBlockEven: { backgroundColor: '#f4f8fd' },
  casetaBlockOdd: { backgroundColor: '#e0e7ef' },
  casetaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#c7d7ee' },
  casetaTitle: { fontSize: 16, fontWeight: 'bold', color: '#2a3a4b' },
  caret: { fontSize: 18, color: '#2a3a4b', marginLeft: 8 },
  casetaContent: { padding: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { width: 120, fontWeight: '600', color: '#3b3b3b', fontSize: 13 },
  totalesBlock: { margin: 16, padding: 10, backgroundColor: '#dbeafe', borderRadius: 8 },
  totalesTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#2a3a4b' },
  totalesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 },
  totalesCell: { marginRight: 16, fontSize: 13, color: '#333' },
});
