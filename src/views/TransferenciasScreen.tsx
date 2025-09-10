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

const TransferenciasScreen: React.FC = () => {
  const { transferencias, reload, saveTransferencia } = useTransferencias();
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

  const handleSave = async () => {
    if (!granjaOrigenID || !siloOrigenID || !granjaDestinoID || !siloDestinoID || !cantidadKg || !estatus) {
      Alert.alert("Error", "Todos los campos obligatorios deben estar completos");
      return;
    }

    try {
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
      Alert.alert("Error", err.message);
    }
  };

  const renderItem = ({ item }: { item: Transferencia }) => {
    const granjaOrigen = granjas.find(g => g.GranjaID === item.GranjaOrigenID)?.Nombre || `ID ${item.GranjaOrigenID}`;
    const granjaDestino = granjas.find(g => g.GranjaID === item.GranjaDestinoID)?.Nombre || `ID ${item.GranjaDestinoID}`;
    const siloOrigen = silos.find(s => s.SiloID === item.SiloOrigenID)?.Nombre || `ID ${item.SiloOrigenID}`;
    const siloDestino = silos.find(s => s.SiloID === item.SiloDestinoID)?.Nombre || `ID ${item.SiloDestinoID}`;
    const fechaCorta = item.Fecha?.split("T")[0] || item.Fecha;

    return (
      <View style={styles.item}>
        <Text style={styles.itemTitle}>Fecha: {fechaCorta}</Text>
        <Text>Granja Origen: {granjaOrigen}</Text>
        <Text>Silo Origen: {siloOrigen}</Text>
        <Text>Granja Destino: {granjaDestino}</Text>
        <Text>Silo Destino: {siloDestino}</Text>
        <Text>Tipo Alimento: {item.TipoAlimento}</Text>
        <Text>Cantidad Kg: {item.CantidadKg}</Text>
        <Text>Estatus: {item.Estatus}</Text>
        <Text>Chofer: {item.Chofer || "-"}</Text>
        <Text>Placas: {item.Placas || "-"}</Text>
        <Text>Observaciones: {item.Observaciones || "-"}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      

      {/* Lista */}
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={transferencias}
          keyExtractor={(item) => item.TransferenciaID.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          /* ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Image
                source={require("../../assets/Iconos/transfer.png")}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>
          } */
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No hay transferencias registradas.
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
                    onValueChange={(value) => setSiloOrigenID(value)}
                  >
                    <Picker.Item label="Seleccione un silo" value={null} />
                    {silos
                      .filter((s) => s.GranjaID === granjaOrigenID)
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
                      .filter((s) => s.GranjaID === granjaDestinoID)
                      .map((s) => (
                        <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                      ))
                    }
                  </Picker>
                </View>

                <TextInput
                style={styles.input}
                placeholder="Tipo de Alimento"
                value={tipoAlimento}
                onChangeText={setTipoAlimento}
                />

                {/* Cantidad Kg */}
                <TextInput
                  style={styles.input}
                  placeholder="Cantidad Kg"
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

                {/* Chofer */}
                <TextInput
                  style={styles.input}
                  placeholder="Chofer (opcional)"
                  value={chofer}
                  onChangeText={setChofer}
                />

                {/* Placas */}
                <TextInput
                  style={styles.input}
                  placeholder="Placas (opcional)"
                  value={placas}
                  onChangeText={setPlacas}
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
                  <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                    onPress={() => setModalVisible(false)}
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
});
