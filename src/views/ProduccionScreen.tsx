"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';

const tiposHuevo = [
  'BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'
];
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

// Habilita LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProduccionScreen() {
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

  // Estructura: { [caseta]: { [tipo]: { cajas: string, restos: string } } }
  const [tabla, setTabla] = useState(() => {
    const obj: any = {};
    casetas.forEach(caseta => {
      obj[caseta] = {};
      tiposHuevo.forEach(tipo => {
        obj[caseta][tipo] = { cajas: '', restos: '' };
      });
    });
    return obj;
  });

  // Calcular totales por tipo
  const totales = useMemo(() => {
    const t: any = {};
    tiposHuevo.forEach(tipo => {
      let cajas = 0, restos = 0;
      casetas.forEach(caseta => {
        cajas += Number(tabla[caseta][tipo].cajas) || 0;
        restos += Number(tabla[caseta][tipo].restos) || 0;
      });
      t[tipo] = { cajas, restos };
    });
    return t;
  }, [tabla]);

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
    casetas.forEach(c => { obj[c] = false; });
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
      for (const caseta of casetas) {
        const data: any = {
          caseta: seccionSeleccionada,
          fecha: fechaHoy,
          blanco_cajas: Number(tabla[caseta]['BLANCO'].cajas) || 0,
          blanco_restos: Number(tabla[caseta]['BLANCO'].restos) || 0,
          roto1_cajas: Number(tabla[caseta]['ROTO 1'].cajas) || 0,
          roto1_restos: Number(tabla[caseta]['ROTO 1'].restos) || 0,
          roto2_cajas: Number(tabla[caseta]['ROTO 2'].cajas) || 0,
          roto2_restos: Number(tabla[caseta]['ROTO 2'].restos) || 0,
          manchado_cajas: Number(tabla[caseta]['MANCHADO'].cajas) || 0,
          manchado_restos: Number(tabla[caseta]['MANCHADO'].restos) || 0,
          fragil1_cajas: Number(tabla[caseta]['FRAGIL 1'].cajas) || 0,
          fragil1_restos: Number(tabla[caseta]['FRAGIL 1'].restos) || 0,
          fragil2_cajas: Number(tabla[caseta]['FRAGIL 2'].cajas) || 0,
          fragil2_restos: Number(tabla[caseta]['FRAGIL 2'].restos) || 0,
          yema_cajas: Number(tabla[caseta]['YEMA'].cajas) || 0,
          yema_restos: Number(tabla[caseta]['YEMA'].restos) || 0,
          b1_cajas: Number(tabla[caseta]['B1'].cajas) || 0,
          b1_restos: Number(tabla[caseta]['B1'].restos) || 0,
          extra240_cajas: Number(tabla[caseta]['EXTRA 240PZS'].cajas) || 0,
          extra240_restos: Number(tabla[caseta]['EXTRA 240PZS'].restos) || 0,
        };
        await DatabaseQueries.insertProduccion(data);
      }
      Alert.alert('Éxito', 'Datos de producción guardados correctamente.');
      navigation.replace('Alimento');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/Iconos/produccion.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>PRODUCCIÓN</Text>
          </View>
          <Text style={styles.subtitle}>{seccionSeleccionada} - {fechaHoy}</Text>
        </View>
        {casetas.map((caseta, idx) => (
          <View key={caseta} style={[styles.casetaBlock, idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd]}>
            <TouchableOpacity onPress={() => toggleCaseta(caseta)} style={styles.casetaHeader} activeOpacity={0.7}>
              <Text style={styles.casetaTitle}>{caseta}</Text>
              <Text style={styles.caret}>{casetasAbiertas[caseta] ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {casetasAbiertas[caseta] && (
              <View style={styles.casetaContent}>
                {tiposHuevo.map(tipo => (
                  <View key={tipo} style={styles.tipoRow}>
                    <Text style={styles.tipoLabel}>{tipo}</Text>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputPair}>
                        <Text style={styles.inputLabel}>Cajas</Text>
                        <TextInput
                          style={styles.inputCell}
                          value={tabla[caseta][tipo].cajas}
                          onChangeText={v => handleChange(caseta, tipo, 'cajas', v)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                      <View style={styles.inputPair}>
                        <Text style={styles.inputLabel}>Restos</Text>
                        <TextInput
                          style={styles.inputCell}
                          value={tabla[caseta][tipo].restos}
                          onChangeText={v => handleChange(caseta, tipo, 'restos', v)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%', paddingLeft: 0, paddingRight: 42 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
  headerTextAbsoluteWrapper: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#2a3a4b', textAlign: 'center', letterSpacing: 1 },
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
  inputCell: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, width: 60, height: 32, textAlign: 'center', backgroundColor: '#f8fafc', fontSize: 13, color: '#222', marginBottom: 2 },
  totalesBlock: { margin: 16, padding: 10, backgroundColor: '#dbeafe', borderRadius: 8 },
  totalesTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#2a3a4b' },
  totalesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  totalesCell: { marginLeft: 10, fontSize: 13, color: '#333' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
