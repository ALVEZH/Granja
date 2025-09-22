// src/screens/LotesScreen.tsx
import React, { useState, useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useGranjas } from "../hooks/useGranjas";
import { useSilos } from "../hooks/useSilos";
import { useLotes, Lote } from "../hooks/useLotes";
import { Picker } from "@react-native-picker/picker";
import { ordenarLotesFIFO } from "../util/fifo";

const LotesScreen: React.FC = () => {
  const { granjas } = useGranjas();
  const { silos } = useSilos();
  const { lotes } = useLotes();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [granjaFilter, setGranjaFilter] = useState<number | null>(null);
  const [siloFilter, setSiloFilter] = useState<number | null>(null);

  // 🔹 Nuevo estado para modal de filtros
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);

  // 🔹 Agrupar silos con sus lotes ordenados FIFO, filtrando por granja y tipo de alimento
  const silosConLotes = silos
    .filter((s) => !granjaFilter || s.GranjaID === granjaFilter)
    .filter((s) => !siloFilter || s.SiloID === siloFilter)
    .map((s) => {
      const lotesDelSilo = lotes
        .filter((l) => l.SiloID === s.SiloID && l.CantidadDisponibleKg > 0)
        .map((l) => ({ ...l, GranjaID: s.GranjaID }));
      return { ...s, lotes: ordenarLotesFIFO(lotesDelSilo) };
    });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/Iconos/lo.png")}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
            Lotes
          </Text>
        </View>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: any }) => {
    const granja = granjas.find((g) => g.GranjaID === item.GranjaID);
    return (
      <View style={styles.loteCard}>
        <Text style={styles.loteTitle}>{item.Nombre}</Text>
        <Text style={styles.subText}>Granja: {granja?.Nombre || "-"}</Text>

        {item.lotes.map((l: Lote, index: number) => {
          const porcentaje = Math.min(
            100,
            Math.round((l.CantidadDisponibleKg / l.CantidadInicialKg) * 100)
          );
          return (
            <View key={l.LoteID} style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "bold" }}>Lote {index + 1} (FIFO)</Text>
              <Text style={styles.subText}>Tipo: {l.TipoAlimento}</Text>

              <View style={styles.siloContainer}>
                <View style={styles.silo}>
                  <View
                    style={[styles.siloFill, { height: `${porcentaje}%` }]}
                  />
                </View>

                <View style={styles.indicadores}>
                  <Text style={styles.indText}>
                    Inicial: {l.CantidadInicialKg} kg
                  </Text>
                  <Text style={styles.indText}>
                    Disponible: {l.CantidadDisponibleKg} kg
                  </Text>
                  <Text style={styles.indText}>Llenado: {porcentaje}%</Text>
                </View>
              </View>

              {l.Observaciones ? (
                <Text style={styles.observaciones}>📝 {l.Observaciones}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🔹 Botón compacto de filtros */}
      <TouchableOpacity
        style={styles.filtroBoton}
        onPress={() => setModalFiltrosVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.filtroBotonTexto}>
          {granjas.find((g) => g.GranjaID === granjaFilter)?.Nombre || "Todas las granjas"} |{" "}
          {silos.find((s) => s.SiloID === siloFilter)?.Nombre || "Todos los silos"}
        </Text>
      </TouchableOpacity>


      {/* 🔹 Modal de filtros */}
      <Modal visible={modalFiltrosVisible} animationType="slide" transparent>
        <View style={styles.modalFiltrosBackground}>
          <View style={styles.modalFiltrosContainer}>
            <Text style={styles.modalTitle}>Filtros</Text>

            {/* Filtro Granja */}
            <Text style={styles.label}>Granja:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={granjaFilter}
                onValueChange={setGranjaFilter}
              >
                <Picker.Item label="Todas" value={null} />
                {granjas.map((g) => (
                  <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                ))}
              </Picker>
            </View>

            {/* Filtro Silo */}
            <Text style={styles.label}>Silo:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={siloFilter}
                onValueChange={setSiloFilter}
              >
                <Picker.Item label="Todos" value={null} />
                {silos
                  .filter((s) => !granjaFilter || s.GranjaID === granjaFilter)
                  .map((s) => (
                    <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                  ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalFiltrosVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Aplicar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                onPress={() => setModalFiltrosVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔹 Lista de silos con lotes FIFO */}
      <FlatList
        data={silosConLotes}
        keyExtractor={(item) => item.SiloID.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No hay lotes disponibles
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default LotesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eaf1f9" },

  // 🔹 Botón compacto de filtros
  filtroBoton: {
  backgroundColor: "#007AFF",
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 24,
  alignSelf: "center",       // 🔹 centra el botón
  marginVertical: 16,
  elevation: 5,              // 🔹 sombra Android
  shadowColor: "#000",       // 🔹 sombra iOS
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},
filtroBotonTexto: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  textAlign: "center",
},


  modalFiltrosBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalFiltrosContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  label: { fontWeight: "bold", marginTop: 8, marginBottom: 4 },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },

  loteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
  },
  loteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2a3a4b",
  },
  subText: { fontSize: 14, color: "#555" },
  siloContainer: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  silo: {
    width: 50,
    height: 120,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 8,
    backgroundColor: "#eee",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  siloFill: {
    width: "100%",
    backgroundColor: "#007AFF",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  indicadores: { marginLeft: 16 },
  indText: { fontWeight: "bold", color: "#333", marginBottom: 4 },
  observaciones: { marginTop: 8, fontStyle: "italic", color: "#555" },
});
