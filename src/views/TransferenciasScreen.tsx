// src/screens/TransferenciasScreen.tsx
import React, { useState ,useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useGranjas } from "../hooks/useGranjas";
import { useSilos } from "../hooks/useSilos";
import { useTransferencias, Transferencia } from "../hooks/useTransferencias";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import TransferenciaCard from "../components/TransferenciaCard";


const TransferenciasScreen: React.FC = () => {
  const { transferencias, reload, saveTransferencia , getLoteDefault} = useTransferencias();
  const { granjas } = useGranjas();
  const { silos } = useSilos();

  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [modalVisible, setModalVisible] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [granjaOrigenID, setGranjaOrigenID] = useState<number | null>(null);
  const [siloOrigenID, setSiloOrigenID] = useState<number | null>(null);
  const [granjaDestinoID, setGranjaDestinoID] = useState<number | null>(null);
  const [siloDestinoID, setSiloDestinoID] = useState<number | null>(null);
  const [tipoAlimento, setTipoAlimento] = useState(""); 
  const [cantidadKg, setCantidadKg] = useState("");
  const [estatus, setEstatus] = useState("");
  const [chofer, setChofer] = useState("");
  const [placas, setPlacas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<string | null>(null);
  const [cantidadDisponible, setCantidadDisponible] = useState<number>(0);
  const [loading, setLoading] = useState(false);


  // estados para filtro de fechas
const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
const [fechaFin, setFechaFin] = useState<Date | null>(null);
const [showPickerInicio, setShowPickerInicio] = useState(false);
const [showPickerFin, setShowPickerFin] = useState(false);


// Normaliza: inicio del día (00:00:00)
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};
// Normaliza: fin del día (23:59:59.999)
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
};

  
  const handleBack = () => navigation.replace("Menu" );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFecha(new Date());
    setGranjaOrigenID(null);
    setSiloOrigenID(null);
    setGranjaDestinoID(null);
    setSiloDestinoID(null);
    setTipoAlimento("");
    setCantidadKg("");
    setEstatus("");
    setChofer("");
    setPlacas("");
    setObservaciones("");
    setModalVisible(true);
  };

  useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/Iconos/transfer.png")}
              style={{ width: 32, height: 32, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              Transferencias
            </Text>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleAdd} style={{ marginRight: 16 }}>
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        ),
      });
    }, [navigation]);

  const handleSave = () => {
  if (
    !granjaOrigenID ||
    !siloOrigenID ||
    !granjaDestinoID ||
    !siloDestinoID ||
    !cantidadKg ||
    !estatus
  ) {
    Alert.alert("Error", "Todos los campos obligatorios deben estar completos");
    return;
  }

  if (parseFloat(cantidadKg) > cantidadDisponible) {
    Alert.alert(
      "Error",
      "La cantidad a transferir no puede ser mayor a la disponible en el silo de origen."
    );
    return;
  }

  Alert.alert(
    "Confirmar transferencia",
    `¿Desea transferir ${cantidadKg} kg de ${tipoAlimento} al silo destino?`,
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            setLoading(true); // 👈 activa el loading

            await saveTransferencia({
              Fecha: fecha.toISOString(),
              GranjaOrigenID: granjaOrigenID,
              SiloOrigenID: siloOrigenID,
              GranjaDestinoID: granjaDestinoID,
              SiloDestinoID: siloDestinoID,
              TipoAlimento: tipoAlimento,
              CantidadKg: parseFloat(cantidadKg),
              Estatus: estatus,
              Chofer: chofer,
              Placas: placas,
              Observaciones: observaciones,
            });

            setModalVisible(false);
          } catch (err: any) {
            Alert.alert("Error", err.message || "No se pudo guardar la transferencia.");
          } finally {
            setLoading(false); // 👈 desactiva el loading
          }
        },
      },
    ]
  );
};


 const renderItem = ({ item }: { item: Transferencia }) => {
  return (
    <TransferenciaCard 
      item={item} 
      granjas={granjas} 
      silos={silos} 
    />
  );
};

// Función para filtrar
const transferenciasFiltradas = transferencias.filter((t) => {
  const fecha = new Date(t.Fecha);

  if (fechaInicio && fecha < startOfDay(fechaInicio)) return false;
  if (fechaFin && fecha > endOfDay(fechaFin)) return false;

  return true;
});


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}

      {/* FILTRO POR RANGO DE FECHAS */}
<View style={styles.filtroContainer}>
  <TouchableOpacity style={styles.filtroBtn} onPress={() => setShowPickerInicio(true)}>
    <Text style={styles.filtroBtnText}>
      {fechaInicio ? startOfDay(fechaInicio).toISOString().split("T")[0] : "Inicio"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.filtroBtn} onPress={() => setShowPickerFin(true)}>
    <Text style={styles.filtroBtnText}>
      {fechaFin ? endOfDay(fechaFin).toISOString().split("T")[0] : "Fin"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.limpiarBtn} onPress={() => { setFechaInicio(null); setFechaFin(null); }}>
    <Text style={styles.limpiarBtnText}>Limpiar</Text>
  </TouchableOpacity>
</View>

<View style={{ alignItems: "center", marginVertical: 6 }}>
  {fechaInicio && fechaFin && (
    <Text style={{ fontStyle: "italic" }}>
      Filtrando del {fechaInicio.toLocaleDateString()} al {fechaFin.toLocaleDateString()}
    </Text>
  )}
</View>


{/* DatePickers condicionales */}
{showPickerInicio && (
  
    <DateTimePicker
      value={fechaInicio || new Date()}
      mode="date"
      display="spinner"
      onChange={(_, selected) => {
        setShowPickerInicio(false);
        if (selected) setFechaInicio(selected);
      }}
      style={{ backgroundColor: "#fff" }}
    />
)}

{showPickerFin && (
  <DateTimePicker
    value={fechaFin || new Date()}
    mode="date"
    display="default"
    onChange={(_, selected) => {
      setShowPickerFin(false);
      if (selected) {
        if (fechaInicio && selected <= fechaInicio) {
          Alert.alert("Error", "La fecha fin no puede ser menor que la fecha inicio");
        } else {
          setFechaFin(selected);
        }
      }
    }}
  />
)}

      

      {/* Lista */}
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={transferenciasFiltradas}
          renderItem={renderItem}
          keyExtractor={(item) => item.TransferenciaID.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              {fechaInicio || fechaFin
                ? "No hay transferencias en este rango de fechas."
                : "No hay transferencias registradas."}
            </Text>
          }
          contentContainerStyle={styles.scroll}
        />
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Nueva Transferencia</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Granja Origen */}
                <Text style={styles.label}>Granja Origen</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={granjaOrigenID}
                    onValueChange={(value) => {
                      setGranjaOrigenID(value);
                      setSiloOrigenID(null);
                    }}
                  >
                    <Picker.Item label="Seleccione una granja" value={null} />
                    {granjas.map((g) => (
                      <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                    ))}
                  </Picker>
                </View>

                {/* Silo Origen */}
                <Text style={styles.label}>Silo Origen</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={siloOrigenID}
                    enabled={!!granjaOrigenID}
                    onValueChange={async (value) => {
                      setSiloOrigenID(value);
                      if (value) {
                        const lote = await getLoteDefault(value);
                        if (lote) {
                          setTipoAlimento(lote.tipoAlimento); // tipo de alimento
                          setLoteSeleccionado(lote.tipoAlimento);
                          setCantidadDisponible(lote.cantidadDisponible); // nueva variable de estado
                        } else {
                          setTipoAlimento("");
                          setLoteSeleccionado(null);
                          setCantidadDisponible(0);
                        }
                      } else {
                        setTipoAlimento("");
                        setLoteSeleccionado(null);
                        setCantidadDisponible(0);
                      }
                    }}
                  >
                    <Picker.Item label="Seleccione un silo" value={null} />
                    {silos
                      .filter((s) => s.GranjaID === granjaOrigenID && s.Activo)
                      .map((s) => (
                        <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                      ))
                    }
                  </Picker>
                </View>

                {/* Granja Destino */}
                <Text style={styles.label}>Granja Destino</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={granjaDestinoID}
                    onValueChange={(value) => {
                      setGranjaDestinoID(value);
                      setSiloDestinoID(null);
                    }}
                  >
                    <Picker.Item label="Seleccione una granja" value={null} />
                    {granjas.map((g) => (
                      <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                    ))}
                  </Picker>
                </View>

                {/* Silo Destino */}
                <Text style={styles.label}>Silo Destino</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={siloDestinoID}
                    enabled={!!granjaDestinoID}
                    onValueChange={(value) => setSiloDestinoID(value)}
                  >
                    <Picker.Item label="Seleccione un silo" value={null} />
                    {silos
                      .filter((s) => s.GranjaID === granjaDestinoID && s.Activo)
                      .map((s) => (
                        <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                      ))
                    }
                  </Picker>
                </View>

               <TextInput
                  style={styles.input}
                  placeholder="Tipo de Alimento"
                  value={tipoAlimento} // esto se actualizará automáticamente
                  editable={false}
                />

                {/* Cantidad Kg */}
                <TextInput
                  style={styles.input}
                  placeholder={`Disponible: ${cantidadDisponible} kg`}
                  keyboardType="numeric"
                  value={cantidadKg}
                  onChangeText={setCantidadKg}
                />

                {/* Estatus */}
                <TextInput
                  style={styles.input}
                  placeholder="Estatus"
                  value={estatus}
                  onChangeText={setEstatus}
                />

                {/* Chofer: solo letras y espacios */}
                <TextInput
                  style={styles.input}
                  placeholder="Chofer (opcional)"
                  value={chofer}
                  onChangeText={(text) => {
                    const regex = /^[a-zA-Z\s]*$/; // solo letras y espacios
                    if (regex.test(text)) {
                      setChofer(text);
                    } else {
                      Alert.alert("Entrada inválida", "El nombre del chofer solo puede contener letras y espacios.");
                    }
                  }}
                />

                {/* Placas: solo letras y números */}
                <TextInput
                  style={styles.input}
                  placeholder="Placas (opcional)"
                  value={placas}
                  onChangeText={(text) => {
                    const regex = /^[a-zA-Z0-9]*$/; // solo letras y números
                    if (regex.test(text)) {
                      setPlacas(text);
                    } else {
                      Alert.alert("Entrada inválida", "Las placas solo pueden contener letras y números.");
                    }
                  }}
                />

                {/* Observaciones */}
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Observaciones (opcional)"
                  multiline
                  value={observaciones}
                  onChangeText={setObservaciones}
                />

                {/* Fecha */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateInput}>Fecha: {fecha.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={fecha}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setFecha(selectedDate);
                    }}
                  />
                )}

                {/* Botones */}
                <View style={styles.modalButtons}>
                  {/* Guardar */}
                  <TouchableOpacity
  style={[
    styles.modalButton,
    loading && { backgroundColor: "#999" }, // gris mientras carga
  ]}
  onPress={handleSave}
  disabled={loading} // 👈 deshabilita mientras guarda
>
  <Text style={{ color: "#fff", fontWeight: "bold" }}>
    {loading ? "Guardando..." : "Guardar"}
  </Text>
</TouchableOpacity>


                  {/* Cancelar con confirmación */}
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                    onPress={() => {
                      Alert.alert(
                        "Confirmar cancelación",
                        "¿Estás seguro de que deseas cancelar? Se perderán los cambios.",
                        [
                          { text: "No", style: "cancel" },
                          { text: "Sí, cancelar", style: "destructive", onPress: () => setModalVisible(false) }
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default TransferenciasScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eaf1f9" },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#2a3a4b", textAlign: "center", flex: 1 },
  backButton: { padding: 6, width: 40, alignItems: "flex-start", justifyContent: "center" },
  item: { backgroundColor: "#fff", padding: 16, marginVertical: 6, borderRadius: 12, elevation: 3 },
  itemTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  label: { fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  dateInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalButton: { flex: 1, backgroundColor: "#007AFF", padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: "center" },
  headerContainer: { alignItems: 'center', marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },

  filtroContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3, // sombra para Android
    shadowColor: "#000", // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filtroBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  limpiarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  limpiarBtnText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
});
