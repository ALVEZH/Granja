import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
// @ts-ignore - Ignore type checking for react-native-vector-icons
import Icon from 'react-native-vector-icons/MaterialIcons';

// Type definitions
type CasetaKey = 'CASETA 1' | 'CASETA 2' | 'CASETA 3' | 'CASETA 4' | 'CASETA 5' | 'CASETA 6' | 'CASETA 7' | 'CASETA 8' | 'CASETA 9';
type ColumnaProduccion = 'BLANCO' | 'ROTO 1' | 'ROTO 2' | 'MANCHADO' | 'FRAGIL 1' | 'FRAGIL 2' | 'YEMA' | 'B1' | 'EXTRA 240PZS';

interface ProduccionData {
  cajas: number;
  restos: number;
}

interface AlimentoData {
  existenciaInicial: number;
  entrada: number;
  consumo: number;
  tipo: string;
  edad: string;
}

interface ExistenciaData {
  inicial: number;
  entrada: number;
  mortalidad: number;
  salida: number;
  final: number;
}

interface EnvaseData {
  tipo: string;
  inicial: number;
  recibido: number;
  consumo: number;
  final: number;
}

const secciones: CasetaKey[] = ['CASETA 1', 'CASETA 2', 'CASETA 3', 'CASETA 4', 'CASETA 5', 'CASETA 6', 'CASETA 7', 'CASETA 8', 'CASETA 9'];
const columnasProduccion: ColumnaProduccion[] = ['BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'];

// Simulación de datos más realista basada en la imagen
const produccionSimulada: Record<CasetaKey, Record<ColumnaProduccion, ProduccionData>> = {
  'CASETA 1': {
    'BLANCO': { cajas: 71, restos: 8 },
    'ROTO 1': { cajas: 1, restos: 15 },
    'ROTO 2': { cajas: 1, restos: 14 },
    'MANCHADO': { cajas: 1, restos: 18 },
    'FRAGIL 1': { cajas: 2, restos: 7 },
    'FRAGIL 2': { cajas: 0, restos: 20 },
    'YEMA': { cajas: 0, restos: 5 },
    'B1': { cajas: 14, restos: 5 },
    'EXTRA 240PZS': { cajas: 29, restos: 12 }
  },
  'CASETA 2': {
    'BLANCO': { cajas: 22, restos: 8 },
    'ROTO 1': { cajas: 0, restos: 14 },
    'ROTO 2': { cajas: 1, restos: 13 },
    'MANCHADO': { cajas: 1, restos: 18 },
    'FRAGIL 1': { cajas: 1, restos: 12 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 29 },
    'B1': { cajas: 0, restos: 2 },
    'EXTRA 240PZS': { cajas: 26, restos: 32 }
  },
  'CASETA 3': {
    'BLANCO': { cajas: 25, restos: 0 },
    'ROTO 1': { cajas: 0, restos: 12 },
    'ROTO 2': { cajas: 1, restos: 20 },
    'MANCHADO': { cajas: 1, restos: 20 },
    'FRAGIL 1': { cajas: 3, restos: 14 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 35 },
    'B1': { cajas: 30, restos: 3 },
    'EXTRA 240PZS': { cajas: 120, restos: 32 }
  },
  'CASETA 4': {
    'BLANCO': { cajas: 224, restos: 4 },
    'ROTO 1': { cajas: 0, restos: 5 },
    'ROTO 2': { cajas: 1, restos: 24 },
    'MANCHADO': { cajas: 1, restos: 30 },
    'FRAGIL 1': { cajas: 0, restos: 52 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 1 },
    'B1': { cajas: 21, restos: 0 },
    'EXTRA 240PZS': { cajas: 40, restos: 21 }
  },
  'CASETA 5': {
    'BLANCO': { cajas: 188, restos: 5 },
    'ROTO 1': { cajas: 1, restos: 10 },
    'ROTO 2': { cajas: 1, restos: 20 },
    'MANCHADO': { cajas: 0, restos: 20 },
    'FRAGIL 1': { cajas: 0, restos: 15 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 25 },
    'B1': { cajas: 1, restos: 2 },
    'EXTRA 240PZS': { cajas: 30, restos: 5 }
  },
  'CASETA 6': {
    'BLANCO': { cajas: 24, restos: 10 },
    'ROTO 1': { cajas: 1, restos: 12 },
    'ROTO 2': { cajas: 2, restos: 8 },
    'MANCHADO': { cajas: 2, restos: 8 },
    'FRAGIL 1': { cajas: 2, restos: 24 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 6 },
    'B1': { cajas: 4, restos: 0 },
    'EXTRA 240PZS': { cajas: 31, restos: 35 }
  },
  'CASETA 7': {
    'BLANCO': { cajas: 72, restos: 6 },
    'ROTO 1': { cajas: 1, restos: 27 },
    'ROTO 2': { cajas: 1, restos: 27 },
    'MANCHADO': { cajas: 2, restos: 24 },
    'FRAGIL 1': { cajas: 2, restos: 24 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 7 },
    'B1': { cajas: 3, restos: 0 },
    'EXTRA 240PZS': { cajas: 30, restos: 10 }
  },
  'CASETA 8': {
    'BLANCO': { cajas: 22, restos: 30 },
    'ROTO 1': { cajas: 0, restos: 11 },
    'ROTO 2': { cajas: 2, restos: 5 },
    'MANCHADO': { cajas: 1, restos: 30 },
    'FRAGIL 1': { cajas: 1, restos: 34 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 12 },
    'B1': { cajas: 0, restos: 1 },
    'EXTRA 240PZS': { cajas: 32, restos: 6 }
  },
  'CASETA 9': {
    'BLANCO': { cajas: 24, restos: 3 },
    'ROTO 1': { cajas: 0, restos: 8 },
    'ROTO 2': { cajas: 1, restos: 26 },
    'MANCHADO': { cajas: 1, restos: 26 },
    'FRAGIL 1': { cajas: 3, restos: 27 },
    'FRAGIL 2': { cajas: 0, restos: 0 },
    'YEMA': { cajas: 0, restos: 4 },
    'B1': { cajas: 8, restos: 20 },
    'EXTRA 240PZS': { cajas: 28, restos: 5 }
  }
};

const alimentoData: Record<CasetaKey, AlimentoData> = {
  'CASETA 1': { existenciaInicial: 2870, entrada: 1240, consumo: 0, tipo: 'PL', edad: '45.1' },
  'CASETA 2': { existenciaInicial: 0, entrada: 1510, consumo: 0, tipo: '', edad: '45.2' },
  'CASETA 3': { existenciaInicial: 0, entrada: 1672, consumo: 0, tipo: '', edad: '45.2' },
  'CASETA 4': { existenciaInicial: 0, entrada: 1109, consumo: 0, tipo: '', edad: '45.2' },
  'CASETA 5': { existenciaInicial: 0, entrada: 1819, consumo: 0, tipo: '', edad: '45.2' },
  'CASETA 6': { existenciaInicial: 0, entrada: 1810, consumo: 0, tipo: '', edad: '45.5' },
  'CASETA 7': { existenciaInicial: 0, entrada: 1800, consumo: 0, tipo: '', edad: '45.5' },
  'CASETA 8': { existenciaInicial: 0, entrada: 1796, consumo: 0, tipo: '', edad: '50.5' },
  'CASETA 9': { existenciaInicial: 0, entrada: 1372, consumo: 0, tipo: '', edad: '52.5' }
};

const existenciaData: Record<CasetaKey, ExistenciaData> = {
  'CASETA 1': { inicial: 12784, entrada: 0, mortalidad: 10, salida: 0, final: 12774 },
  'CASETA 2': { inicial: 0, entrada: 0, mortalidad: 8, salida: 0, final: 0 },
  'CASETA 3': { inicial: 16224, entrada: 0, mortalidad: 8, salida: 0, final: 16216 },
  'CASETA 4': { inicial: 15404, entrada: 0, mortalidad: 5, salida: 0, final: 15399 },
  'CASETA 5': { inicial: 16851, entrada: 0, mortalidad: 5, salida: 0, final: 16846 },
  'CASETA 6': { inicial: 10019, entrada: 0, mortalidad: 12, salida: 1, final: 10006 },
  'CASETA 7': { inicial: 16607, entrada: 0, mortalidad: 8, salida: 2, final: 16597 },
  'CASETA 8': { inicial: 16472, entrada: 0, mortalidad: 10, salida: 7, final: 16455 },
  'CASETA 9': { inicial: 16179, entrada: 0, mortalidad: 11, salida: 5, final: 16163 }
};

const envaseData: Record<CasetaKey, EnvaseData> = {
  'CASETA 1': { tipo: 'CAJA TIPO A', inicial: 1009, recibido: 229, consumo: 246, final: 746 },
  'CASETA 2': { tipo: 'SEPARADOR TIPO A', inicial: 1009, recibido: 229, consumo: 246, final: 746 },
  'CASETA 3': { tipo: 'CAJA TIPO B', inicial: 0, recibido: 0, consumo: 46, final: 0 },
  'CASETA 4': { tipo: 'SEPARADOR TIPO B', inicial: 0, recibido: 0, consumo: 46, final: 0 },
  'CASETA 5': { tipo: 'CONO', inicial: 69.4, recibido: 0, consumo: 24, final: 86.74 },
  'CASETA 6': { tipo: 'CONO 240 PZS', inicial: 11.5, recibido: 0, consumo: 1.75, final: 9.75 },
  'CASETA 7': { tipo: 'CONO ESTRELLA', inicial: 0, recibido: 0, consumo: 0, final: 0 },
  'CASETA 8': { tipo: 'CINTA', inicial: 14.7, recibido: 9, consumo: 7.75, final: 8.75 },
  'CASETA 9': { tipo: 'CINTA BLANCA', inicial: 7.2, recibido: 1, consumo: 0.5, final: 1 }
};

type ResumenSeccionProps = {
  navigation: any;
};

export default function ResumenSeccion({ navigation }: ResumenSeccionProps) {
  const [selectedSeccion, setSelectedSeccion] = useState<CasetaKey>(secciones[0]);
  const [showModal, setShowModal] = useState(false);

  // Calcular totales
  const totalesProduccion = useMemo(() => {
    const totales: Record<ColumnaProduccion, ProduccionData> = {} as Record<ColumnaProduccion, ProduccionData>;
    columnasProduccion.forEach(columna => {
      totales[columna] = { cajas: 0, restos: 0 };
      secciones.forEach(seccion => {
        totales[columna].cajas += produccionSimulada[seccion][columna].cajas;
        totales[columna].restos += produccionSimulada[seccion][columna].restos;
      });
    });
    return totales;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>UNION AGROPECUARIA ALZE SA DE CV.</Text>
        <Text style={styles.reportTitle}>REPORTE DE PRODUCCION DIARIA EN GRANJAS</Text>
        <View style={styles.headerInfo}>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>SECCIÓN</Text>
            <Text style={styles.sectionValue}>C</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>FECHA</Text>
            <Text style={styles.dateValue}>17-25</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Producción Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRODUCCIÓN</Text>
          
          {/* Headers */}
          <View style={styles.productionHeader}>
            <Text style={[styles.headerCell, { width: 60 }]}>TIPO</Text>
            {columnasProduccion.map(col => (
              <View key={col} style={styles.productionColumn}>
                <Text style={styles.columnTitle}>{col}</Text>
                <View style={styles.subHeaders}>
                  <Text style={styles.subHeader}>CAJAS</Text>
                  <Text style={styles.subHeader}>RESTOS</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalColumn}>
              <Text style={styles.columnTitle}>TOTAL</Text>
              <View style={styles.subHeaders}>
                <Text style={styles.subHeader}>CAJAS</Text>
                <Text style={styles.subHeader}>RESTOS</Text>
              </View>
            </View>
          </View>

          {/* Data Rows */}
          {secciones.map((seccion, index) => (
            <View key={seccion} style={[styles.dataRow, index % 2 === 0 && styles.evenRow]}>
              <Text style={[styles.dataCell, { width: 60 }]}>{seccion}</Text>
              {columnasProduccion.map(col => (
                <View key={col} style={styles.productionColumn}>
                  <Text style={styles.dataValue}>{produccionSimulada[seccion][col].cajas}</Text>
                  <Text style={styles.dataValue}>{produccionSimulada[seccion][col].restos}</Text>
                </View>
              ))}
              <View style={styles.totalColumn}>
                <Text style={styles.dataValue}>
                  {columnasProduccion.reduce((sum, col) => sum + produccionSimulada[seccion][col].cajas, 0)}
                </Text>
                <Text style={styles.dataValue}>
                  {columnasProduccion.reduce((sum, col) => sum + produccionSimulada[seccion][col].restos, 0)}
                </Text>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={[styles.dataRow, styles.totalRow]}>
            <Text style={[styles.dataCell, { width: 60, fontWeight: 'bold' }]}>TOTAL</Text>
            {columnasProduccion.map(col => (
              <View key={col} style={styles.productionColumn}>
                <Text style={[styles.dataValue, styles.totalValue]}>{totalesProduccion[col].cajas}</Text>
                <Text style={[styles.dataValue, styles.totalValue]}>{totalesProduccion[col].restos}</Text>
              </View>
            ))}
            <View style={styles.totalColumn}>
              <Text style={[styles.dataValue, styles.totalValue]}>
                {Object.values(totalesProduccion).reduce((sum, item) => sum + item.cajas, 0)}
              </Text>
              <Text style={[styles.dataValue, styles.totalValue]}>
                {Object.values(totalesProduccion).reduce((sum, item) => sum + item.restos, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Sections Row */}
        <View style={styles.bottomSections}>
          {/* Alimento */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomSectionTitle}>ALIMENTO</Text>
            <View style={styles.bottomTable}>
              <View style={styles.bottomHeader}>
                <Text style={styles.bottomHeaderCell}>SECCIÓN</Text>
                <Text style={styles.bottomHeaderCell}>EXISTENCIA INICIAL</Text>
                <Text style={styles.bottomHeaderCell}>ENTRADA</Text>
                <Text style={styles.bottomHeaderCell}>CONSUMO</Text>
                <Text style={styles.bottomHeaderCell}>TIPO</Text>
                <Text style={styles.bottomHeaderCell}>EDAD</Text>
              </View>
              {secciones.map((seccion, index) => (
                <View key={seccion} style={[styles.bottomRow, index % 2 === 0 && styles.evenRow]}>
                  <Text style={styles.bottomCell}>{seccion}</Text>
                  <Text style={styles.bottomCell}>{alimentoData[seccion].existenciaInicial}</Text>
                  <Text style={styles.bottomCell}>{alimentoData[seccion].entrada}</Text>
                  <Text style={styles.bottomCell}>{alimentoData[seccion].consumo}</Text>
                  <Text style={styles.bottomCell}>{alimentoData[seccion].tipo}</Text>
                  <Text style={styles.bottomCell}>{alimentoData[seccion].edad}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Existencia */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomSectionTitle}>EXISTENCIA</Text>
            <View style={styles.bottomTable}>
              <View style={styles.bottomHeader}>
                <Text style={styles.bottomHeaderCell}>SECCIÓN</Text>
                <Text style={styles.bottomHeaderCell}>EXISTENCIA INICIAL AVES</Text>
                <Text style={styles.bottomHeaderCell}>ENTRADA AVES</Text>
                <Text style={styles.bottomHeaderCell}>MORTALIDAD AVES</Text>
                <Text style={styles.bottomHeaderCell}>SALIDA AVES</Text>
                <Text style={styles.bottomHeaderCell}>EXISTENCIA FINAL AVES</Text>
              </View>
              {secciones.map((seccion, index) => (
                <View key={seccion} style={[styles.bottomRow, index % 2 === 0 && styles.evenRow]}>
                  <Text style={styles.bottomCell}>{seccion}</Text>
                  <Text style={styles.bottomCell}>{existenciaData[seccion].inicial}</Text>
                  <Text style={styles.bottomCell}>{existenciaData[seccion].entrada}</Text>
                  <Text style={styles.bottomCell}>{existenciaData[seccion].mortalidad}</Text>
                  <Text style={styles.bottomCell}>{existenciaData[seccion].salida}</Text>
                  <Text style={styles.bottomCell}>{existenciaData[seccion].final}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Envase */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomSectionTitle}>ENVASE</Text>
            <View style={styles.bottomTable}>
              <View style={styles.bottomHeader}>
                <Text style={styles.bottomHeaderCell}>SECCIÓN</Text>
                <Text style={styles.bottomHeaderCell}>ENVASE</Text>
                <Text style={styles.bottomHeaderCell}>EXISTENCIA INICIAL</Text>
                <Text style={styles.bottomHeaderCell}>RECIBIDO</Text>
                <Text style={styles.bottomHeaderCell}>CONSUMO</Text>
                <Text style={styles.bottomHeaderCell}>EXISTENCIA FINAL</Text>
              </View>
              {secciones.map((seccion, index) => (
                <View key={seccion} style={[styles.bottomRow, index % 2 === 0 && styles.evenRow]}>
                  <Text style={styles.bottomCell}>{seccion}</Text>
                  <Text style={styles.bottomCell}>{envaseData[seccion].tipo}</Text>
                  <Text style={styles.bottomCell}>{envaseData[seccion].inicial}</Text>
                  <Text style={styles.bottomCell}>{envaseData[seccion].recibido}</Text>
                  <Text style={styles.bottomCell}>{envaseData[seccion].consumo}</Text>
                  <Text style={styles.bottomCell}>{envaseData[seccion].final}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>FIRMA Y NOMBRE ENCARGADO</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>FIRMA Y NOMBRE SUPERVISOR</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>FIRMA Y NOMBRE DE CHOFER</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>
      </ScrollView>

      {/* Modal para seleccionar sección */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {secciones.map(seccion => (
              <TouchableOpacity
                key={seccion}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSeccion(seccion);
                  setShowModal(false);
                }}
              >
                <Text style={styles.modalText}>{seccion}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Botón regresar */}
      <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
    elevation: 3,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4a90e2',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    marginBottom: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBox: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    color: '#666',
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateBox: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scroll: {
    flex: 1,
    padding: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 12,
    textAlign: 'center',
  },
  productionHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  productionColumn: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    paddingHorizontal: 2,
  },
  totalColumn: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: '#333',
    paddingHorizontal: 2,
  },
  columnTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
  },
  subHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  subHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  dataCell: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
  },
  dataValue: {
    fontSize: 9,
    textAlign: 'center',
    color: '#333',
    flex: 1,
  },
  totalRow: {
    backgroundColor: '#e8f4f8',
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  bottomSections: {
    marginBottom: 20,
  },
  bottomSection: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  bottomSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  bottomHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  bottomHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 6,
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  bottomRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bottomCell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
    padding: 6,
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#333',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: '80%',
    maxHeight: '60%',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  modalText: {
    fontSize: 18,
    color: '#517aa2',
  },
  modalClose: {
    padding: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#749BC2',
    fontWeight: 'bold',
  },
  btnBack: {
    position: 'absolute',
    top: 40,
    left: 12,
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
});