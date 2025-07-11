import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

const tiposAlimento = ['Pollinaza', 'Concentrado', 'Maíz'];
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`);
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

type RegistroAlimento = {
  tipo: string;
  existenciaInicial: string;
  entrada: string;
  consumo: string;
};

type AlimentoData = {
  [seccion: string]: {
    [caseta: string]: RegistroAlimento;
  };
};

export default function AlimentoScreen() {
  const [alimentoData, setAlimentoData] = useState<AlimentoData>(() => {
    const initial: AlimentoData = {};
    secciones.forEach(seccion => {
      initial[seccion] = {};
      casetas.forEach(caseta => {
        initial[seccion][caseta] = {
          tipo: '',
          existenciaInicial: '',
          entrada: '',
          consumo: '',
        };
      });
    });
    return initial;
  });

  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0]);
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null);
  const [showModalSeccion, setShowModalSeccion] = useState(false);

  const handleChange = (
    campo: keyof RegistroAlimento,
    value: string
  ) => {
    if (!selectedCaseta) return;
    setAlimentoData(prev => ({
      ...prev,
      [selectedSeccion]: {
        ...prev[selectedSeccion],
        [selectedCaseta]: {
          ...prev[selectedSeccion][selectedCaseta],
          [campo]: value,
        },
      },
    }));
  };

  const progresoCasetas = useMemo(() => {
    const registros = alimentoData[selectedSeccion];
    const total = Object.keys(registros).length;

    const completadas = Object.values(registros).filter(casetaData =>
      casetaData.tipo !== '' ||
      casetaData.existenciaInicial !== '' ||
      casetaData.entrada !== '' ||
      casetaData.consumo !== ''
    ).length;

    return completadas / total;
  }, [alimentoData, selectedSeccion]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.seccionSelector}
          onPress={() => setShowModalSeccion(true)}
        >
          <Text style={styles.seccionText}>{selectedSeccion}</Text>
          <Icon name="arrow-drop-down" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progreso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progreso de Sección</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progresoCasetas * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progresoCasetas * 100)}%</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaList}>
            {casetas.map(caseta => (
              <TouchableOpacity
                key={caseta}
                style={styles.casetaCard}
                onPress={() => setSelectedCaseta(caseta)}
              >
                <Icon name="home" size={24} color="#517aa2" />
                <Text style={styles.casetaText}>{caseta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>ALIMENTO - {selectedSeccion} / {selectedCaseta}</Text>

            <Text style={styles.label}>Tipo de Alimento</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={alimentoData[selectedSeccion][selectedCaseta].tipo}
                onValueChange={value => handleChange('tipo', value)}
              >
                <Picker.Item label="Selecciona tipo" value="" />
                {tiposAlimento.map(tipo => (
                  <Picker.Item key={tipo} label={tipo} value={tipo} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Existencia inicial"
              keyboardType="numeric"
              value={alimentoData[selectedSeccion][selectedCaseta].existenciaInicial}
              onChangeText={text => handleChange('existenciaInicial', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Entrada"
              keyboardType="numeric"
              value={alimentoData[selectedSeccion][selectedCaseta].entrada}
              onChangeText={text => handleChange('entrada', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Consumo"
              keyboardType="numeric"
              value={alimentoData[selectedSeccion][selectedCaseta].consumo}
              onChangeText={text => handleChange('consumo', text)}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setSelectedCaseta(null)}
              >
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#e74c3c' }]}
                onPress={() => setSelectedCaseta(null)}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal de Sección */}
      <Modal visible={showModalSeccion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una sección</Text>
            {secciones.map(seccion => (
              <TouchableOpacity
                key={seccion}
                onPress={() => {
                  setSelectedSeccion(seccion);
                  setShowModalSeccion(false);
                }}
                style={styles.modalItem}
              >
                <Text>{seccion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf1f9' },
  header: {
    backgroundColor: '#749BC2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  seccionSelector: { flexDirection: 'row', alignItems: 'center' },
  seccionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 6 },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#eaf1f9',
  },
  progressLabel: { fontSize: 14, color: '#333', marginBottom: 4 },
  progressBarBackground: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#749BC2',
  },
  progressText: { fontSize: 12, color: '#555', textAlign: 'right', marginTop: 4 },
  casetaList: { padding: 16 },
  casetaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 3,
  },
  casetaText: { fontSize: 16, color: '#517aa2', fontWeight: '600' },
  formContainer: { padding: 16 },
  formTitle: { fontSize: 18, textAlign: 'center', fontWeight: 'bold', color: '#517aa2', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#749BC2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalItem: { paddingVertical: 12, borderBottomColor: '#ccc', borderBottomWidth: 1 },
});
