"use client"
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';

const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);
const columnas = ['Existencia Inicial', 'Entrada', 'Mortalidad', 'Salida', 'Edad'];

export default function ExistenciaScreen() {
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

  // Estructura: { [caseta]: { existenciaInicial, entrada, mortalidad, salida, edad, existenciaFinal } }
  const [tabla, setTabla] = useState(() => {
    const obj: any = {};
    casetas.forEach(caseta => {
      obj[caseta] = { 
        existenciaInicial: '', 
        entrada: '', 
        mortalidad: '', 
        salida: '', 
        edad: '',
        existenciaFinal: '0'
      };
    });
    return obj;
  });

  // Calcular totales y existencia final
  const totales = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, mortalidad = 0, salida = 0, existenciaFinal = 0;
    
    casetas.forEach(caseta => {
      const inicial = Number(tabla[caseta].existenciaInicial) || 0;
      const ent = Number(tabla[caseta].entrada) || 0;
      const mort = Number(tabla[caseta].mortalidad) || 0;
      const sal = Number(tabla[caseta].salida) || 0;
      const final = inicial + ent - mort - sal;
      
      existenciaInicial += inicial;
      entrada += ent;
      mortalidad += mort;
      salida += sal;
      existenciaFinal += final;
    });
    
    return { existenciaInicial, entrada, mortalidad, salida, existenciaFinal };
  }, [tabla]);

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, campo: string, valor: string) => {
    setTabla((prev: any) => {
      const newTabla = {
        ...prev,
        [caseta]: {
          ...prev[caseta],
          [campo]: campo === 'edad' ? valor.replace(/[^0-9]/g, '') : valor.replace(/[^0-9]/g, '')
        }
      };

      // Calcular existencia final para esta caseta
      const inicial = Number(newTabla[caseta].existenciaInicial) || 0;
      const entrada = Number(newTabla[caseta].entrada) || 0;
      const mortalidad = Number(newTabla[caseta].mortalidad) || 0;
      const salida = Number(newTabla[caseta].salida) || 0;
      newTabla[caseta].existenciaFinal = String(inicial + entrada - mortalidad - salida);

      return newTabla;
    });
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    // if (!seccionSeleccionada) {
    //   Alert.alert('Error', 'No se ha seleccionado una sección.');
    //   return;
    // }
    // Validar que al menos una caseta tenga algún campo lleno
    const algunaCasetaLlena = casetas.some(caseta =>
      tabla[caseta].existenciaInicial || tabla[caseta].entrada || tabla[caseta].mortalidad || tabla[caseta].salida || tabla[caseta].edad || tabla[caseta].existenciaFinal
    );
    if (!algunaCasetaLlena) {
      Alert.alert('Error', 'Debes llenar al menos una caseta antes de continuar.');
      return;
    }
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetas) {
        // Solo guarda si hay algún campo lleno
        if (
          tabla[caseta].existenciaInicial ||
          tabla[caseta].entrada ||
          tabla[caseta].mortalidad ||
          tabla[caseta].salida ||
          tabla[caseta].edad ||
          tabla[caseta].existenciaFinal
        ) {
          const data: any = {
            caseta: seccionSeleccionada,
            fecha: fechaHoy,
            inicial: Number(tabla[caseta].existenciaInicial) || 0,
            entrada: Number(tabla[caseta].entrada) || 0,
            mortalidad: Number(tabla[caseta].mortalidad) || 0,
            salida: Number(tabla[caseta].salida) || 0,
            edad: Number(tabla[caseta].edad) || 0,
            final: Number(tabla[caseta].existenciaFinal) || 0,
          };
          await DatabaseQueries.insertExistencia(data);
        }
      }
      Alert.alert('Éxito', 'Datos de existencia guardados correctamente.');
      navigation.replace('Envase');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  // Estado para controlar qué casetas están abiertas
  const [casetasAbiertas, setCasetasAbiertas] = useState<{ [caseta: string]: boolean }>(() => {
    const obj: { [caseta: string]: boolean } = {};
    casetas.forEach(c => { obj[c] = false; });
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
      <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/Iconos/existencia.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>EXISTENCIA</Text>
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
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Existencia Inicial</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].existenciaInicial}
                    onChangeText={v => handleChange(caseta, 'existenciaInicial', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Entrada</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].entrada}
                    onChangeText={v => handleChange(caseta, 'entrada', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Mortalidad</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].mortalidad}
                    onChangeText={v => handleChange(caseta, 'mortalidad', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Salida</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].salida}
                    onChangeText={v => handleChange(caseta, 'salida', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Edad</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].edad}
                    onChangeText={v => handleChange(caseta, 'edad', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Existencia Final</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].existenciaFinal}
                    onChangeText={v => handleChange(caseta, 'existenciaFinal', v)}
                    keyboardType="numeric"
                    placeholder="0"
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
            <Text style={styles.totalesCell}>Inicial: {totales.existenciaInicial}</Text>
            <Text style={styles.totalesCell}>Entrada: {totales.entrada}</Text>
            <Text style={styles.totalesCell}>Mortalidad: {totales.mortalidad}</Text>
            <Text style={styles.totalesCell}>Salida: {totales.salida}</Text>
            <Text style={styles.totalesCell}>Final: {totales.existenciaFinal}</Text>
          </View>
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
  title: { fontSize: 18, fontWeight: 'bold', margin: 12, textAlign: 'center', color: '#333' },
  table: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 8, margin: 8, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%', paddingLeft: 0, paddingRight: 42 },
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 90, textAlign: 'center', color: '#222' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  inputCell: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, width: 90, height: 32, margin: 2, textAlign: 'center', backgroundColor: '#f8fafc', fontSize: 13, color: '#222' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#2a3a4b', textAlign: 'center', letterSpacing: 1 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 10, textAlign: 'center' },
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
