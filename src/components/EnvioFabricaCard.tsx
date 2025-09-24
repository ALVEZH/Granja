import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from "react-native";
import { EnvioFabrica } from "../hooks/useEnviosFabrica";

interface Granja { GranjaID: number; Nombre: string; }
interface Silo { SiloID: number; Nombre: string; }

interface Props {
  item: EnvioFabrica;
  granjas: Granja[];
  silos: Silo[];
}

const EnvioFabricaCard: React.FC<Props> = ({ item, granjas, silos }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const fechaCorta = new Date(item.Fecha).toLocaleDateString();

  const granjaDestino = granjas.find(g => g.GranjaID === item.GranjaDestinoID)?.Nombre || "-";
  const siloDestino = silos.find(s => s.SiloID === item.SiloDestinoID)?.Nombre || "-";

  return (
    <>
      {/* Carta resumida */}
      <TouchableOpacity style={styles.card} onPress={() => setModalVisible(true)}>
        <Text style={styles.cardTitle}>{fechaCorta}</Text>
        <Text>Granja Destino: {granjaDestino}</Text>
        <Text>Silo Destino: {siloDestino}</Text>
        <Text>Tipo Alimento: {item.TipoAlimento}</Text>
        <Text>Cantidad Kg: {item.CantidadKg}</Text>
      </TouchableOpacity>

      {/* Modal detalle */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle de Envío</Text>
            <ScrollView>
              <Text>Fecha: {fechaCorta}</Text>
              <Text>Granja Destino: {granjaDestino}</Text>
              <Text>Silo Destino: {siloDestino}</Text>
              <Text>Tipo Alimento: {item.TipoAlimento}</Text>
              <Text>Cantidad Kg: {item.CantidadKg}</Text>
              <Text>Chofer: {item.Chofer || "-"}</Text>
              <Text>Placas: {item.Placas || "-"}</Text>
              <Text>Observaciones: {item.Observaciones || "-"}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EnvioFabricaCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignSelf: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
