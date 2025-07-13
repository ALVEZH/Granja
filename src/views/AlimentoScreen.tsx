"use client"
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);
const columnas = ['Existencia Inicial', 'Entrada', 'Consumo', 'Tipo'];

export default function AlimentoScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seccionSeleccionada = (route as any).params?.seccionSeleccionada;
  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [caseta]: { existenciaInicial, entrada, consumo, tipo } }
  const [tabla, setTabla] = useState(() => {
    const obj: any = {};
    casetas.forEach(caseta => {
      obj[caseta] = { existenciaInicial: '', entrada: '', consumo: '', tipo: '' };
    });
    return obj;
  });

  // Calcular totales
  const totales = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, consumo = 0;
    casetas.forEach(caseta => {
      existenciaInicial += Number(tabla[caseta].existenciaInicial) || 0;
      entrada += Number(tabla[caseta].entrada) || 0;
      consumo += Number(tabla[caseta].consumo) || 0;
    });
    return { existenciaInicial, entrada, consumo };
  }, [tabla]);

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, campo: string, valor: string) => {
    setTabla(prev => ({
      ...prev,
      [caseta]: {
        ...prev[caseta],
        [campo]: campo === 'tipo' ? valor : valor.replace(/[^0-9.]/g, '')
      }
    }));
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetas) {
        const data: any = {
          caseta,
          fecha: fechaHoy,
          existencia_inicial: Number(tabla[caseta].existenciaInicial) || 0,
          entrada: Number(tabla[caseta].entrada) || 0,
          consumo: Number(tabla[caseta].consumo) || 0,
          tipo: tabla[caseta].tipo,
          edad: '', // Edad se captura en Existencia
        };
        await DatabaseQueries.insertAlimento(data);
      }
      Alert.alert('Éxito', 'Datos de alimento guardados correctamente.');
      navigation.replace('Existencia', { seccionSeleccionada });
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView horizontal style={{ backgroundColor: '#fff' }}>
        <View>
          <Text style={styles.title}>Alimento - {seccionSeleccionada} - {fechaHoy}</Text>
          <ScrollView style={{ maxHeight: 520 }}>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>CASETA</Text>
                {columnas.map(col => (
                  <Text key={col} style={styles.headerCell}>{col}</Text>
                ))}
              </View>
              {casetas.map(caseta => (
                <View key={caseta} style={styles.dataRow}>
                  <Text style={styles.casetaCell}>{caseta}</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].existenciaInicial}
                    onChangeText={v => handleChange(caseta, 'existenciaInicial', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].entrada}
                    onChangeText={v => handleChange(caseta, 'entrada', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].consumo}
                    onChangeText={v => handleChange(caseta, 'consumo', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].tipo}
                    onChangeText={v => handleChange(caseta, 'tipo', v)}
                    placeholder="Tipo"
                  />
                </View>
              ))}
              {/* Fila de totales */}
              <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
                <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.existenciaInicial}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.entrada}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.consumo}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}></Text>
              </View>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
            <Text style={styles.btnGuardarText}>Guardar y continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
  title: { fontSize: 18, fontWeight: 'bold', margin: 12, textAlign: 'center', color: '#333' },
  table: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 8, margin: 8, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#dbeafe', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 90, textAlign: 'center', color: '#222' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  inputCell: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, width: 90, height: 32, margin: 2, textAlign: 'center', backgroundColor: '#f8fafc', fontSize: 13, color: '#222' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
