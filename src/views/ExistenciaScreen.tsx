import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Constantes
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`);
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

// Tipos
type ExistenciaRegistro = {
  existenciaInicial: string;
  entradaAves: string;
  mortalidadAves: string;
  salidaAves: string;
  existenciaFinal: string; // Calculado
};

type ExistenciaData = {
  [seccion: string]: {
    [caseta: string]: ExistenciaRegistro;
  };
};

export default function ExistenciaScreen() {
  // Estado principal
  const [existenciaData, setExistenciaData] = useState<ExistenciaData>(() => {
    const initialData: ExistenciaData = {};
    secciones.forEach((seccion) => {
      initialData[seccion] = {};
      casetas.forEach((caseta) => {
        initialData[seccion][caseta] = {
          existenciaInicial: '',
          entradaAves: '',
          mortalidadAves: '',
          salidaAves: '',
          existenciaFinal: '',
        };
      });
    });
    return initialData;
  });

  const [selectedSeccion, setSelectedSeccion] = useState<string>(secciones[0]);
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null);
  const [showModalSeccion, setShowModalSeccion] = useState(false);

  // Actualiza los campos y calcula existencia final
  const handleChange = useCallback(
    (
      seccion: string,
      caseta: string,
      campo: keyof Omit<ExistenciaRegistro, 'existenciaFinal'>,
      valor: string
    ) => {
      setExistenciaData((prev) => {
        const registroPrevio = prev[seccion][caseta];
        const nuevoRegistro = {
          ...registroPrevio,
          [campo]: valor,
        };

        // Calcular existencia final
        const inicial = Number(nuevoRegistro.existenciaInicial) || 0;
        const entrada = Number(nuevoRegistro.entradaAves) || 0;
        const mortalidad = Number(nuevoRegistro.mortalidadAves) || 0;
        const salida = Number(nuevoRegistro.salidaAves) || 0;
        nuevoRegistro.existenciaFinal = String(inicial + entrada - mortalidad - salida);

        return {
          ...prev,
          [seccion]: {
            ...prev[seccion],
            [caseta]: nuevoRegistro,
          },
        };
      });
    },
    []
  );

  // Reutilizable input con label flotante
  const CustomInput = ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
  }) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#94a3b8"
      />
      {value ? <Text style={styles.floatingLabel}>{label}</Text> : null}
    </View>
  );

  // Card para contener inputs
  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.card}>{children}</View>
  );

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

      {/* Contenido */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaListContainer}>
            {casetas.map((caseta) => (
              <TouchableOpacity
                key={caseta}
                style={styles.casetaCard}
                onPress={() => setSelectedCaseta(caseta)}
              >
                <Icon
                  name="home"
                  size={24}
                  color="#749BC2"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.casetaText}>{caseta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>
              REGISTRO DE EXISTENCIA - {selectedSeccion} - {selectedCaseta}
            </Text>

            <Card>
              <CustomInput
                label="Existencia Inicial"
                value={existenciaData[selectedSeccion][selectedCaseta].existenciaInicial}
                onChangeText={(text) =>
                  handleChange(selectedSeccion, selectedCaseta, 'existenciaInicial', text)
                }
              />
              <CustomInput
                label="Entrada Aves"
                value={existenciaData[selectedSeccion][selectedCaseta].entradaAves}
                onChangeText={(text) =>
                  handleChange(selectedSeccion, selectedCaseta, 'entradaAves', text)
                }
              />
              <CustomInput
                label="Mortalidad Aves"
                value={existenciaData[selectedSeccion][selectedCaseta].mortalidadAves}
                onChangeText={(text) =>
                  handleChange(selectedSeccion, selectedCaseta, 'mortalidadAves', text)
                }
              />
              <CustomInput
                label="Salida Aves"
                value={existenciaData[selectedSeccion][selectedCaseta].salidaAves}
                onChangeText={(text) =>
                  handleChange(selectedSeccion, selectedCaseta, 'salidaAves', text)
                }
              />
              <View style={styles.existenciaFinalContainer}>
                <Text style={styles.existenciaFinalLabel}>Existencia Final:</Text>
                <Text style={styles.existenciaFinalValue}>
                  {existenciaData[selectedSeccion][selectedCaseta].existenciaFinal}
                </Text>
              </View>
            </Card>

            {/* Botones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#749BC2' }]}
                onPress={() => {
                  // Aquí podrías implementar lógica para guardar en base de datos
                  alert('Datos guardados (simulado)');
                }}
              >
                <Text style={styles.buttonText}>GUARDAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#e74c3c' }]}
                onPress={() => setSelectedCaseta(null)}
              >
                <Text style={styles.buttonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal para selección de sección */}
      <Modal
        visible={showModalSeccion}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModalSeccion(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Sección</Text>
            <ScrollView>
              {secciones.map((seccion) => (
                <TouchableOpacity
                  key={seccion}
                  style={styles.modalSectionItem}
                  onPress={() => {
                    setSelectedSeccion(seccion);
                    setShowModalSeccion(false);
                    setSelectedCaseta(null); // Resetea caseta al cambiar sección
                  }}
                >
                  <Text style={styles.modalSectionText}>{seccion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf1f9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#749BC2',
  },
  seccionSelector: { flexDirection: 'row', alignItems: 'center' },
  seccionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  content: { flex: 1 },

  // Lista casetas
  casetaListContainer: { padding: 16 },
  casetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  casetaText: { fontSize: 16, fontWeight: '600', color: '#749BC2' },

  // Formulario
  formContainer: { flex: 1, padding: 16 },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#749BC2',
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 4,
  },

  inputContainer: { position: 'relative', marginBottom: 16 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#749BC2',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#333',
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 8,
    fontSize: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    color: '#749BC2',
    fontWeight: 'bold',
  },

  existenciaFinalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  existenciaFinalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  existenciaFinalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#749BC2',
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSectionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalSectionText: {
    fontSize: 16,
  },
});
