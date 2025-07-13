"use client"
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);
const columnas = ['Existencia Inicial', 'Entrada', 'Mortalidad', 'Salida', 'Edad'];

export default function ExistenciaScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seccionSeleccionada = (route as any).params?.seccionSeleccionada;
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
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetas) {
        const data: any = {
          caseta,
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
      Alert.alert('Éxito', 'Datos de existencia guardados correctamente.');
      navigation.replace('Envase', { seccionSeleccionada } as any);
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView horizontal style={{ backgroundColor: '#fff' }}>
        <View>
          <Text style={styles.title}>Existencia - {seccionSeleccionada} - {fechaHoy}</Text>
          <ScrollView style={{ maxHeight: 520 }}>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>CASETA</Text>
                {columnas.map(col => (
                  <Text key={col} style={styles.headerCell}>{col}</Text>
                ))}
                <Text style={styles.headerCell}>EXIST. FINAL</Text>
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
                    value={tabla[caseta].mortalidad}
                    onChangeText={v => handleChange(caseta, 'mortalidad', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].salida}
                    onChangeText={v => handleChange(caseta, 'salida', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[caseta].edad}
                    onChangeText={v => handleChange(caseta, 'edad', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={[styles.inputCell, { backgroundColor: '#f0f0f0' }]}>
                    {tabla[caseta].existenciaFinal}
                  </Text>
                </View>
              ))}
              {/* Fila de totales */}
              <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
                <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.existenciaInicial}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.entrada}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.mortalidad}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.salida}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}></Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.existenciaFinal}</Text>
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
