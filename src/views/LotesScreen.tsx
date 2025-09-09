// src/screens/LotesScreen.tsx
import React, { useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useGranjas } from "../hooks/useGranjas";
import { useSilos } from "../hooks/useSilos";
import { useLotes, Lote } from "../hooks/useLotes";
import { Picker } from "@react-native-picker/picker";

const LotesScreen: React.FC = () => {
  const { granjas } = useGranjas();
  const { silos } = useSilos();
  const { lotes } = useLotes();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [granjaFilter, setGranjaFilter] = useState<number | null>(null);
  const [siloFilter, setSiloFilter] = useState<number | null>(null);

  const filteredLotes = lotes.filter(l => {
    const silo = silos.find(s => s.SiloID === l.SiloID);
    return (!granjaFilter || silo?.GranjaID === granjaFilter) &&
           (!siloFilter || l.SiloID === siloFilter);
  });

  const handleBack = () => navigation.replace("Menu");

  const renderItem = ({ item }: { item: Lote }) => {
    const silo = silos.find(s => s.SiloID === item.SiloID);
    const granja = granjas.find(g => g.GranjaID === silo?.GranjaID);

    const porcentaje = Math.min(
      100,
      Math.round((item.CantidadDisponibleKg / item.CantidadInicialKg) * 100)
    );

    return (
      <View style={styles.loteCard}>
        <Text style={styles.loteTitle}>{silo?.Nombre || "Silo ID " + item.SiloID}</Text>
        <Text style={styles.subText}>Granja: {granja?.Nombre || "-"}</Text>
        <Text style={styles.subText}>Tipo: {item.TipoAlimento}</Text>

        <View style={styles.siloContainer}>
          {/* Dibujo de silo */}
          <View style={styles.silo}>
            <View style={[styles.siloFill, { height: `${porcentaje}%` }]} />
          </View>

          {/* Indicadores */}
          <View style={styles.indicadores}>
            <Text style={styles.indText}>Inicial: {item.CantidadInicialKg} kg</Text>
            <Text style={styles.indText}>Disponible: {item.CantidadDisponibleKg} kg</Text>
            <Text style={styles.indText}>Llenado: {porcentaje}%</Text>
          </View>
        </View>

        {item.Observaciones ? (
          <Text style={styles.observaciones}>📝 {item.Observaciones}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={28} color="#333" onPress={handleBack} style={styles.backButton} />
        <Text style={styles.headerTitle}>LOTES DE SILOS</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtros */}
      <ScrollView
  horizontal
  style={styles.filtros}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}
>
  <View style={styles.pickerContainer}>
    <Text style={styles.filterLabel}>Granja:</Text>
    <Picker
      selectedValue={granjaFilter}
      onValueChange={setGranjaFilter}
      style={styles.picker}
    >
      <Picker.Item label="Todas" value={null} />
      {granjas.map(g => (
        <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
      ))}
    </Picker>
  </View>

  <View style={styles.pickerContainer}>
    <Text style={styles.filterLabel}>Silo:</Text>
    <Picker
      selectedValue={siloFilter}
      onValueChange={setSiloFilter}
      style={styles.picker}
    >
      <Picker.Item label="Todos" value={null} />
      {silos
        .filter(s => !granjaFilter || s.GranjaID === granjaFilter)
        .map(s => (
          <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
        ))}
    </Picker>
  </View>
</ScrollView>


      {/* Lista de lotes */}
      <FlatList
        data={filteredLotes}
        keyExtractor={(item) => item.LoteID.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>No hay lotes disponibles</Text>
        }
      />
    </SafeAreaView>
  );
};

export default LotesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eaf1f9" },
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
  filtros: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: "#fff" },
  pickerContainer: {
  marginHorizontal: 8,
  alignItems: "center",
  backgroundColor: "#f0f4f8",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 10,
  elevation: 2,
},

  filterLabel: { fontWeight: "bold", marginBottom: 4 },
  picker: { width: 150, height: 40 },
  loteCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginVertical: 8, elevation: 3 },
  loteTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4, color: "#2a3a4b" },
  subText: { fontSize: 14, color: "#555" },
  siloContainer: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  silo: { width: 50, height: 120, borderWidth: 2, borderColor: "#333", borderRadius: 8, backgroundColor: "#eee", justifyContent: "flex-end", overflow: "hidden" },
  siloFill: { width: "100%", backgroundColor: "#007AFF", borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  indicadores: { marginLeft: 16 },
  indText: { fontWeight: "bold", color: "#333", marginBottom: 4 },
  observaciones: { marginTop: 8, fontStyle: "italic", color: "#555" },
});
