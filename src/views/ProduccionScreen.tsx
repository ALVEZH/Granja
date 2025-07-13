"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const tiposHuevo = [
  'BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'
];
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

export default function ProduccionScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const seccionSeleccionada = (route as any).params?.seccionSeleccionada;
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
    setTabla(prev => ({
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

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetas) {
        const data: any = {
          caseta,
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
      navigation.replace('Alimento', { seccionSeleccionada });
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView horizontal style={{ backgroundColor: '#fff' }}>
        <View>
          <Text style={styles.title}>Producción - {seccionSeleccionada} - {fechaHoy}</Text>
          <ScrollView style={{ maxHeight: 520 }}>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>CASETA</Text>
                {tiposHuevo.map(tipo => (
                  <View key={tipo} style={styles.headerTipo}>
                    <Text style={styles.headerCellTipo}>{tipo}</Text>
                    <View style={styles.headerSubRow}>
                      <Text style={styles.headerSubCell}>Cajas</Text>
                      <Text style={styles.headerSubCell}>Restos</Text>
                    </View>
                  </View>
                ))}
              </View>
              {casetas.map(caseta => (
                <View key={caseta} style={styles.dataRow}>
                  <Text style={styles.casetaCell}>{caseta}</Text>
                  {tiposHuevo.map(tipo => (
                    <View key={tipo} style={styles.dataTipo}>
                      <TextInput
                        style={styles.inputCell}
                        value={tabla[caseta][tipo].cajas}
                        onChangeText={v => handleChange(caseta, tipo, 'cajas', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                      <TextInput
                        style={styles.inputCell}
                        value={tabla[caseta][tipo].restos}
                        onChangeText={v => handleChange(caseta, tipo, 'restos', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  ))}
                </View>
              ))}
              {/* Fila de totales */}
              <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
                <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
                {tiposHuevo.map(tipo => (
                  <View key={tipo} style={styles.dataTipo}>
                    <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales[tipo].cajas}</Text>
                    <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totales[tipo].restos}</Text>
                  </View>
                ))}
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
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 70, textAlign: 'center', color: '#222' },
  headerTipo: { flexDirection: 'column', alignItems: 'center', minWidth: 70 },
  headerCellTipo: { fontWeight: 'bold', fontSize: 12, color: '#222', textAlign: 'center' },
  headerSubRow: { flexDirection: 'row' },
  headerSubCell: { fontSize: 11, fontWeight: 'bold', width: 35, textAlign: 'center', color: '#444' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  dataTipo: { flexDirection: 'row', alignItems: 'center', minWidth: 70 },
  inputCell: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, width: 35, height: 32, margin: 2, textAlign: 'center', backgroundColor: '#f8fafc', fontSize: 13, color: '#222' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
