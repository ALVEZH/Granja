"use client"
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const envases = [
  "CAJA TIPO A",
  "SEPARADOR TIPO A",
  "CAJA TIPO B",
  "SEPARADOR TIPO B",
  "CONO",
  "CONO 240 PZS",
  "CONO ESTRELLA",
  "CINTA",
  "CINTA BLANCA",
];
const columnas = ['Existencia Inicial', 'Recibido', 'Consumo'];

export default function EnvaseScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seccionSeleccionada = (route as any).params?.seccionSeleccionada;
  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [envase]: { existenciaInicial, recibido, consumo, existenciaFinal } }
  const [tabla, setTabla] = useState(() => {
    const obj: any = {};
    envases.forEach(envase => {
      obj[envase] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
    });
    return obj;
  });

  // Calcular totales y existencia final
  const totales = useMemo(() => {
    let existenciaInicial = 0, recibido = 0, consumo = 0, existenciaFinal = 0;
    envases.forEach(envase => {
      const inicial = Number(tabla[envase].existenciaInicial) || 0;
      const rec = Number(tabla[envase].recibido) || 0;
      const cons = Number(tabla[envase].consumo) || 0;
      const final = inicial + rec - cons;
      existenciaInicial += inicial;
      recibido += rec;
      consumo += cons;
      existenciaFinal += final;
    });
    return { existenciaInicial, recibido, consumo, existenciaFinal };
  }, [tabla]);

  // Manejar cambios en la tabla
  const handleChange = (envase: string, campo: string, valor: string) => {
    setTabla((prev: any) => {
      const newTabla = {
        ...prev,
        [envase]: {
          ...prev[envase],
          [campo]: valor.replace(/[^0-9.]/g, '')
        }
      };
      // Calcular existencia final para este envase
      const inicial = Number(newTabla[envase].existenciaInicial) || 0;
      const recibido = Number(newTabla[envase].recibido) || 0;
      const consumo = Number(newTabla[envase].consumo) || 0;
      newTabla[envase].existenciaFinal = String(inicial + recibido - consumo);
      return newTabla;
    });
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const envase of envases) {
        const data: any = {
          caseta: seccionSeleccionada, // Guardamos la sección como caseta para mantener consistencia
          fecha: fechaHoy,
          tipo: envase,
          inicial: Number(tabla[envase].existenciaInicial) || 0,
          recibido: Number(tabla[envase].recibido) || 0,
          consumo: Number(tabla[envase].consumo) || 0,
          final: Number(tabla[envase].existenciaFinal) || 0,
        };
        await DatabaseQueries.insertEnvase(data);
      }
      Alert.alert('Éxito', 'Datos de envase guardados correctamente.');
      navigation.replace('ResumenSeccion', { seccionSeleccionada } as any);
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView horizontal style={{ backgroundColor: '#fff' }}>
        <View>
          <Text style={styles.title}>Envase - {seccionSeleccionada} - {fechaHoy}</Text>
          <ScrollView style={{ maxHeight: 520 }}>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>TIPO</Text>
                {columnas.map(col => (
                  <Text key={col} style={styles.headerCell}>{col}</Text>
                ))}
                <Text style={styles.headerCell}>EXIST. FINAL</Text>
              </View>
              {envases.map(envase => (
                <View key={envase} style={styles.dataRow}>
                  <Text style={styles.casetaCell}>{envase}</Text>
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[envase].existenciaInicial}
                    onChangeText={v => handleChange(envase, 'existenciaInicial', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[envase].recibido}
                    onChangeText={v => handleChange(envase, 'recibido', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.inputCell}
                    value={tabla[envase].consumo}
                    onChangeText={v => handleChange(envase, 'consumo', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={[styles.inputCell, { backgroundColor: '#f0f0f0' }]}>
                    {tabla[envase].existenciaFinal}
                  </Text>
                </View>
              ))}
              {/* Fila de totales */}
              <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
                <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.existenciaInicial}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.recibido}</Text>
                <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales.consumo}</Text>
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
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 110, textAlign: 'center', color: '#333' },
  inputCell: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, width: 90, height: 32, margin: 2, textAlign: 'center', backgroundColor: '#f8fafc', fontSize: 13, color: '#222' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
