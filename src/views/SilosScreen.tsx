import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useSilos, Silo } from "../hooks/useSilos";
import { useGranjas, Granja } from "../hooks/useGranjas";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const SilosScreen: React.FC = () => {
  const { silos, reload, saveSilo, deleteSilo } = useSilos();
  const { granjas } = useGranjas();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSilo, setEditingSilo] = useState<Partial<Silo> | null>(null);
  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [activo, setActivo] = useState(true);
  const [granjaID, setGranjaID] = useState<number | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleBack = () => {
    navigation.replace("Menu");
  };

  const handleAdd = () => {
    setEditingSilo(null);
    setNombre("");
    setCapacidad("");
    setActivo(true);
    setGranjaID(null);
    setModalVisible(true);
  };

  const handleEdit = (silo: Silo) => {
    setEditingSilo(silo);
    setNombre(silo.Nombre);
    setCapacidad(silo.CapacidadKg.toString());
    setActivo(silo.Activo);
    setGranjaID(silo.GranjaID);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre || !capacidad || !granjaID) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    try {
      await saveSilo({
        ...editingSilo,
        Nombre: nombre,
        CapacidadKg: parseFloat(capacidad),
        Activo: activo,
        GranjaID: granjaID,
      });
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = (silo: Silo) => {
    Alert.alert(
      "Eliminar silo",
      `¿Desea eliminar "${silo.Nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSilo(silo.SiloID);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Silo }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{item.Nombre}</Text>
      <Text>Capacidad: {item.CapacidadKg.toLocaleString()} kg</Text>
      <Text>Granja: {item.GranjaID}</Text>
      <Text>Activo: {item.Activo ? "✅ Sí" : "❌ No"}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SILOS</Text>

        <TouchableOpacity onPress={handleAdd} style={{ width: 40, alignItems: "flex-end" }}>
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={silos || []}
          keyExtractor={(item) => item.SiloID.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Image
              source={require("../../assets/Iconos/silos.png")} 
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>
        }
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>No hay silos registrados.</Text>
          }
          contentContainerStyle={styles.scroll}
        />
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingSilo ? "Editar Silo" : "Agregar Silo"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Capacidad (kg)"
              keyboardType="numeric"
              value={capacidad}
              onChangeText={setCapacidad}
            />

            <View style={{ marginBottom: 12 }}>
              <Text>Granja:</Text>
              <Picker
                selectedValue={granjaID}
                onValueChange={(value) => setGranjaID(value)}
              >
                <Picker.Item label="Seleccione una granja..." value={null} />
                {granjas.map((g: Granja) => (
                  <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Text>Activo: </Text>
              <TouchableOpacity onPress={() => setActivo(!activo)}>
                <Text style={{ color: activo ? "green" : "red" }}>
                  {activo ? "✅ Sí" : "❌ No"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={handleSave} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SilosScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eaf1f9" },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2a3a4b",
    textAlign: "center",
    flex: 1,
    letterSpacing: 1,
  },
  backButton: {
    padding: 6,
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  item: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  itemTitle: { fontSize: 18, fontWeight: "bold" },
  itemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 12 },
  modalButton: { backgroundColor: "#007AFF", padding: 12, borderRadius: 8, flex: 1, marginHorizontal: 4 },
  modalButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
});
