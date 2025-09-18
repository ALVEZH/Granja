import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

interface Granja {
  GranjaID: number;
  Nombre: string;
}

interface Silo {
  SiloID: number;
  Nombre: string;
}

interface Transferencia {
  TransferenciaID: number;
  Fecha: string;
  GranjaOrigenID: number;
  SiloOrigenID: number;
  GranjaDestinoID: number;
  SiloDestinoID: number;
  TipoAlimento: string;
  CantidadKg: number;
  Estatus: string;
  Chofer?: string;
  Placas?: string;
  Observaciones?: string;
}

interface Props {
  item: Transferencia;
  granjas: Granja[];
  silos: Silo[];
}

const TransferenciaCard: React.FC<Props> = ({ item, granjas, silos }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const fechaCorta = new Date(item.Fecha).toLocaleDateString();

  // Resolver nombres
  const granjaOrigen =
    granjas.find((g) => g.GranjaID === item.GranjaOrigenID)?.Nombre ||
    `ID ${item.GranjaOrigenID}`;
  const granjaDestino =
    granjas.find((g) => g.GranjaID === item.GranjaDestinoID)?.Nombre ||
    `ID ${item.GranjaDestinoID}`;
  const siloOrigen =
    silos.find((s) => s.SiloID === item.SiloOrigenID)?.Nombre ||
    `ID ${item.SiloOrigenID}`;
  const siloDestino =
    silos.find((s) => s.SiloID === item.SiloDestinoID)?.Nombre ||
    `ID ${item.SiloDestinoID}`;

  return (
    <>
      {/* Card resumida */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.cardTitle}>{fechaCorta}</Text>
        <Text>Silo Destino: {siloDestino}</Text>
        <Text>Tipo Alimento: {item.TipoAlimento}</Text>
        <Text>Cantidad Kg: {item.CantidadKg}</Text>
      </TouchableOpacity>

      {/* Modal con detalle */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle de Transferencia</Text>

            <Text>Fecha: {fechaCorta}</Text>
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

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TransferenciaCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
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
