import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, useRoute } from '@react-navigation/native';

// Tipado para parámetros de navegación
type RootStackParamList = {
  CapturaScreen: { usuario: string };
};

type CapturaRouteProp = RouteProp<RootStackParamList, 'CapturaScreen'>;

export default function CapturaScreen() {
  const route = useRoute<CapturaRouteProp>();
  const usuario = route.params?.usuario || 'Usuario';

  const [caseta, setCaseta] = useState('');
  const [seccion, setSeccion] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipo, setTipo] = useState('');
  const [cantidad, setCantidad] = useState('');

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const validateAndSave = () => {
    if (!caseta.trim()) {
      Alert.alert('Error', 'La caseta es obligatoria.');
      return;
    }
    if (!seccion.trim()) {
      Alert.alert('Error', 'La sección es obligatoria.');
      return;
    }
    if (!tipo.trim()) {
      Alert.alert('Error', 'El tipo es obligatorio.');
      return;
    }
    if (!cantidad.trim()) {
      Alert.alert('Error', 'La cantidad es obligatoria.');
      return;
    }
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0.');
      return;
    }

    Alert.alert(
      'Datos guardados',
      `👤 Usuario: ${usuario}\nCaseta: ${caseta}\nSección: ${seccion}\nFecha: ${fecha.toLocaleDateString()}\nTipo: ${tipo}\nCantidad: ${cantidadNum}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Captura de Datos</Text>

          <Text style={styles.label}>Caseta *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa caseta"
            value={caseta}
            onChangeText={setCaseta}
          />

          <Text style={styles.label}>Sección *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa sección"
            value={seccion}
            onChangeText={setSeccion}
          />

          <Text style={styles.label}>Fecha *</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, styles.dateInput]}
          >
            <Text>{fecha.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fecha}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipo}
              onValueChange={(itemValue) => setTipo(itemValue)}
              mode="dropdown"
            >
              <Picker.Item label="Selecciona un tipo..." value="" />
              <Picker.Item label="Tipo A" value="tipoA" />
              <Picker.Item label="Tipo B" value="tipoB" />
              <Picker.Item label="Tipo C" value="tipoC" />
            </Picker>
          </View>

          <Text style={styles.label}>Cantidad *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa cantidad"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={validateAndSave}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16,
  },
  dateInput: {
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#5A67D8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
