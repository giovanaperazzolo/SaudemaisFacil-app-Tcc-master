// InfoSaudePG.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Button,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const InfoSaudePG = () => {
  const [pressaoData, setPressaoData] = useState([]);
  const [glicemiaData, setGlicemiaData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const [averageSistolica, setAverageSistolica] = useState(0);
  const [averageDiastolica, setAverageDiastolica] = useState(0);
  const [mostFrequentHumorPressao, setMostFrequentHumorPressao] = useState("");
  const [tonturaDias, setTonturaDias] = useState(0);
  const [averageGlicemia, setAverageGlicemia] = useState(0);
  const [mostFrequentHumorGlicemia, setMostFrequentHumorGlicemia] =
    useState("");
  const [jejumDias, setJejumDias] = useState(0);

  const calculateStatistics = () => {
    const totalSistolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Sistolica, 10),
      0
    );
    const totalDiastolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Diastolica, 10),
      0
    );
    const averageSistolica = totalSistolica / pressaoData.length;
    const averageDiastolica = totalDiastolica / pressaoData.length;

    const humorCountsPressao = pressaoData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumorPressao = Object.keys(humorCountsPressao).reduce(
      (a, b) => (humorCountsPressao[a] > humorCountsPressao[b] ? a : b),
      ""
    );

    const tonturaDias = pressaoData.filter((item) => item.Tontura).length;

    const totalGlicemia = glicemiaData.reduce(
      (acc, curr) => acc + parseInt(curr.Glicemia, 10),
      0
    );
    const averageGlicemia = totalGlicemia / glicemiaData.length;

    const humorCountsGlicemia = glicemiaData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumorGlicemia = Object.keys(humorCountsGlicemia).reduce(
      (a, b) => (humorCountsGlicemia[a] > humorCountsGlicemia[b] ? a : b),
      ""
    );

    const jejumDias = glicemiaData.filter((item) => item.Infasting).length;

    // Atualizar os estados
    setAverageSistolica(averageSistolica);
    setAverageDiastolica(averageDiastolica);
    setMostFrequentHumorPressao(mostFrequentHumorPressao);
    setTonturaDias(tonturaDias);
    setAverageGlicemia(averageGlicemia);
    setMostFrequentHumorGlicemia(mostFrequentHumorGlicemia);
    setJejumDias(jejumDias);
  };

  useEffect(() => {
    if (pressaoData.length > 0) {
      const totalSistolica = pressaoData.reduce(
        (acc, curr) => acc + parseInt(curr.Sistolica, 10),
        0
      );
      const averageSistolicaCalc = totalSistolica / pressaoData.length;
      setAverageSistolica(averageSistolicaCalc);

      const totalDiastolica = pressaoData.reduce(
        (acc, curr) => acc + parseInt(curr.Diastolica, 10),
        0
      );
      const averageDiastolicaCalc = totalDiastolica / pressaoData.length;
      setAverageDiastolica(averageDiastolicaCalc);

      const humorCounts = {};
      pressaoData.forEach((item) => {
        humorCounts[item.Humor] = (humorCounts[item.Humor] || 0) + 1;
      });
      const mostFrequent = Object.keys(humorCounts).reduce(
        (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
        ""
      );
      setMostFrequentHumorPressao(mostFrequent);

      const tonturaCount = pressaoData.filter((item) => item.Tontura).length;
      setTonturaDias(tonturaCount);
    }

    if (glicemiaData.length > 0) {
      const totalGlicemia = glicemiaData.reduce(
        (acc, curr) => acc + parseInt(curr.Glicemia, 10),
        0
      );
      const averageGlicemiaCalc = totalGlicemia / glicemiaData.length;
      setAverageGlicemia(averageGlicemiaCalc);

      const humorCountsGlicemia = {};
      glicemiaData.forEach((item) => {
        humorCountsGlicemia[item.Humor] =
          (humorCountsGlicemia[item.Humor] || 0) + 1;
      });
      const mostFrequentGlicemia = Object.keys(humorCountsGlicemia).reduce(
        (a, b) => (humorCountsGlicemia[a] > humorCountsGlicemia[b] ? a : b),
        ""
      );
      setMostFrequentHumorGlicemia(mostFrequentGlicemia);

      const jejumCount = glicemiaData.filter((item) => item.Infasting).length;
      setJejumDias(jejumCount);
    }
  }, [pressaoData, glicemiaData]);

  useEffect(() => {
    calculateStatistics();
  }, [pressaoData, glicemiaData]);

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchData();
    }
  }, [user, startDate, endDate]);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Erro", "Selecione as datas inicial e final.");
      return;
    }
    await fetchPressaoArterial();
    await fetchGlicemia();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!startDate || !endDate) {
      Alert.alert("Erro", "Selecione as datas inicial e final.");
      setRefreshing(false);
      return;
    }
    await fetchData();
    setRefreshing(false);
  }, [user, startDate, endDate]);

  const fetchPressaoArterial = async () => {
    const q = query(
      collection(db, "pressaoArterial"),
      where("UsuarioID", "==", user.uid),
      where("DataHora", ">=", startDate),
      where("DataHora", "<=", endDate),
      orderBy("DataHora", "desc")
    );
    const querySnapshot = await getDocs(q);
    setPressaoData(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const fetchGlicemia = async () => {
    const q = query(
      collection(db, "diabetes"),
      where("ID_user", "==", user.uid),
      where("Datetime", ">=", startDate),
      where("Datetime", "<=", endDate),
      orderBy("Datetime", "desc")
    );
    const querySnapshot = await getDocs(q);
    setGlicemiaData(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    } else {
      setStartDate(new Date()); // Garante que sempre haverá uma data válida
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    } else {
      setEndDate(new Date());
    }
  };

  const exportToExcel = async () => {
    const wb = XLSX.utils.book_new();

    // Crie planilhas para os dados detalhados
    const ws1 = XLSX.utils.json_to_sheet(
      pressaoData.map((data) => ({
        "Data/Hora": new Date(data.DataHora.seconds * 1000).toLocaleString(),
        "Pressão Alta/Baixa": `${data.Sistolica}/${data.Diastolica}`,
        Humor: data.Humor,
        "Tontura/Dor": data.Tontura ? "Sim" : "Não",
      }))
    );
    const ws2 = XLSX.utils.json_to_sheet(
      glicemiaData.map((data) => ({
        "Data e Hora": new Date(data.Datetime.seconds * 1000).toLocaleString(),
        Glicemia: data.Glicemia,
        "Em Jejum": data.Infasting ? "Sim" : "Não",
        Humor: data.Humor,
      }))
    );

    // Adicione resumos à planilha
    const summaryData = [
      ["Média de Pressão Arterial Sistólica", averageSistolica.toFixed(1)],
      ["Média de Pressão Arterial Diastólica", averageDiastolica.toFixed(1)],
      ["Humor Mais Frequente (Pressão)", mostFrequentHumorPressao],
      ["Dias com Tontura", tonturaDias],
      ["Média de Glicemia", averageGlicemia.toFixed(1)],
      ["Humor Mais Frequente (Glicemia)", mostFrequentHumorGlicemia],
      ["Dias em Jejum", jejumDias],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(wb, ws1, "Pressão Arterial");
    XLSX.utils.book_append_sheet(wb, ws2, "Glicemia");
    XLSX.utils.book_append_sheet(wb, ws3, "Resumo de Saúde");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = `${FileSystem.cacheDirectory}dadosSaude.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Compartilhar dados de saúde",
      });
      Alert.alert(
        "Exportação concluída",
        "Arquivo Excel foi compartilhado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao compartilhar o arquivo:", error);
      Alert.alert(
        "Erro de Exportação",
        "Não foi possível compartilhar o arquivo."
      );
    }
  };

  const TableHeader = ({ headers }) => (
    <View style={styles.tableHeaderRow}>
      {headers.map((header, index) => (
        <Text key={index} style={styles.tableHeaderCell}>
          {header}
        </Text>
      ))}
    </View>
  );

  const renderPressaoTable = () => (
    <View style={styles.table}>
      <TableHeader
        headers={["Data/Hora", "Pressão Alta/Baixa", "Humor", "Tontura/Dor"]}
      />
      {pressaoData.map((item, index) => {
        const sistolica = parseInt(item.Sistolica, 10);
        const diastolica = parseInt(item.Diastolica, 10);
        let backgroundColor = "#fff"; // Cor padrão

        // Altera a cor de fundo se a pressão estiver alta ou baixa
        if (sistolica > 140 || diastolica > 90) {
          backgroundColor = "#ffcccc"; // Vermelho claro para pressão alta
        } else if (sistolica < 110 || diastolica < 60) {
          backgroundColor = "#ccccff"; // Azul claro para pressão baixa
        }

        return (
          <View key={index} style={[styles.tableRow, { backgroundColor }]}>
            <Text style={styles.tableCell}>
              {new Date(item.DataHora.seconds * 1000).toLocaleString()}
            </Text>
            <Text
              style={styles.tableCell}
            >{`${item.Sistolica}/${item.Diastolica}`}</Text>
            <Text style={styles.tableCell}>{item.Humor}</Text>
            <Text style={styles.tableCell}>{item.Tontura ? "Sim" : "Não"}</Text>
          </View>
        );
      })}
    </View>
  );

  const calculateGlicemiaSummary = () => {
    if (!glicemiaData.length) {
      return (
        <Text style={styles.summaryText}>
          Carregando dados... ( Inserir data de inicial e Final)
        </Text>
      );
    }

    const totalGlicemia = glicemiaData.reduce(
      (acc, curr) => acc + parseInt(curr.Glicemia, 10),
      0
    );
    const averageGlicemia = totalGlicemia / glicemiaData.length;

    const humorCounts = glicemiaData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumor = Object.keys(humorCounts).reduce(
      (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
      ""
    );

    const jejumDias = glicemiaData.filter((item) => item.Infasting).length;

    return (
      <Text style={styles.summaryText}>
        A média de glicemia do usuário foi{" "}
        <Text style={styles.boldText}>{averageGlicemia.toFixed(1)} mg/dL</Text>{" "}
        nos últimos 30 dias. O humor mais frequente foi{" "}
        <Text style={styles.boldText}>{mostFrequentHumor}</Text>
        {", "}e a pessoa esteve em jejum por{" "}
        <Text style={styles.boldText}>{jejumDias}</Text> dias.
      </Text>
    );
  };

  const renderGlicemiaTable = () => (
    <View style={styles.table}>
      <TableHeader headers={["Data e Hora", "Glicemia", "Em Jejum", "Humor"]} />
      {glicemiaData.map((item, index) => {
        let backgroundColor = "#fff"; // Cor padrão para linhas normais

        if (item.Glicemia > 100) {
          backgroundColor = "#ffcccc"; // Vermelho claro para glicemia alta
        } else if (item.Glicemia < 70) {
          backgroundColor = "#ccccff"; // Azul claro para glicemia baixa
        }

        return (
          <View key={index} style={[styles.tableRow, { backgroundColor }]}>
            <Text style={styles.tableCell}>
              {new Date(item.Datetime.seconds * 1000).toLocaleString()}
            </Text>
            <Text style={styles.tableCell}>{`${item.Glicemia} mg/dL`}</Text>
            <Text style={styles.tableCell}>
              {item.Infasting ? "Sim" : "Não"}
            </Text>
            <Text style={styles.tableCell}>{item.Humor}</Text>
          </View>
        );
      })}
    </View>
  );
  const calculateSummary = () => {
    if (!pressaoData.length) {
      return (
        <Text style={styles.summaryText}>
          Carregando dados... (Inserir data de inicial e Final)
        </Text>
      );
    }

    const totalSistolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Sistolica, 10),
      0
    );
    const totalDiastolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Diastolica, 10),
      0
    );
    const averageSistolica = totalSistolica / pressaoData.length;
    const averageDiastolica = totalDiastolica / pressaoData.length;

    const humorCounts = pressaoData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumor = Object.keys(humorCounts).reduce(
      (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
      ""
    );

    const tonturaDias = pressaoData.filter((item) => item.Tontura).length;

    return (
      <Text style={styles.summaryText}>
        O usuário teve uma média de pressão{" "}
        <Text style={styles.boldText}>
          {averageSistolica.toFixed(1)}/{averageDiastolica.toFixed(1)}
        </Text>{" "}
        nesses 30 dias, seus humores variaram, porém ele ficou mais{" "}
        <Text style={styles.boldText}>{mostFrequentHumor}</Text> e teve{" "}
        <Text style={styles.boldText}>{tonturaDias}</Text> dias de dor e
        tontura.
      </Text>
    );
  };

  const SummarySection = () => (
    <View style={styles.summarySection}>{calculateSummary()}</View>
  );

  const GlicemiaSummarySection = () => (
    <View style={styles.summarySection}>{calculateGlicemiaSummary()}</View>
  );
  const renderDatePickers = () => (
    <View style={styles.datePickerContainer}>
      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={startDate.toLocaleDateString()}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Inicial</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePickerModal
            isVisible={showStartDatePicker}
            mode="date"
            onConfirm={(date) => {
              setStartDate(date);
              setShowStartDatePicker(false);
            }}
            onCancel={() => setShowStartDatePicker(false)}
            date={startDate}
          />
        )}
      </View>
      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={endDate.toLocaleDateString()}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Final</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePickerModal
            isVisible={showEndDatePicker}
            mode="date"
            onConfirm={(date) => {
              setEndDate(date);
              setShowEndDatePicker(false);
            }}
            onCancel={() => setShowEndDatePicker(false)}
            date={endDate}
          />
        )}
      </View>
    </View>
  );

  const renderExportButton = () => (
    <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
      <MaterialCommunityIcons name="microsoft-excel" size={24} color="white" />
      <Text style={styles.exportButtonText}>Exportar para Excel</Text>
    </TouchableOpacity>
  );

  const ColorLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Legenda de Cores:</Text>
      <View style={styles.legendItem}>
        <View style={[styles.colorBox, { backgroundColor: "#ffcccc" }]} />
        <Text style={styles.legendText}>Pressão / Glicemia Alta</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.colorBox, { backgroundColor: "#ccccff" }]} />
        <Text style={styles.legendText}>Pressão / Glicemia Baixa</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.pageTitle}>Monitoramento de Saúde</Text>
      {renderDatePickers()}
      {renderExportButton()}
      {ColorLegend()}
      <View style={styles.section}>
        <Text style={styles.title}>Pressão Arterial - Últimos 30 dias</Text>
        {renderPressaoTable()}
      </View>
      <SummarySection />
      <View style={[styles.section, styles.sectionWithSpacing]}>
        <Text style={styles.title}>Glicemia - Últimos 30 dias</Text>
        {renderGlicemiaTable()}
      </View>
      <GlicemiaSummarySection />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 10, // Ensure separation from other elements
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    alignSelf: "stretch", // Para ocupar toda a largura disponível
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Para centralizar os itens na linha
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableCell: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 2, // Adiciona um pequeno espaçamento horizontal
    textAlign: "center", // Centraliza o texto na célula
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f0f0f0", // Cor de fundo do cabeçalho
  },
  tableHeaderCell: {
    fontWeight: "bold", // Texto em negrito
    fontSize: 16, // Tamanho do texto
    // Adicione mais estilos conforme necessário
  },
  summaryText: {
    fontSize: 18, // Make sure the text is larger if needed
    marginTop: 10, // Add some space above the summary for clarity
    // Add any other styling you wish here
  },
  boldText: {
    fontWeight: "bold",
    // You might not need additional properties here as <Text> style inheritance works within nested <Text> components
  },
  // Make sure you have styles for your summarySection if you need to adjust layout or padding
  summarySection: {
    paddingTop: 10,
    paddingBottom: 20, // Adjust this value as needed for bottom padding
    // Add any other layout adjustments here
  },

  // Add a new style for the section that comes after a summary section
  sectionWithSpacing: {
    marginTop: 20, // Adjust this value as needed for top margin
  },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInputWrapper: {
    width: "50%",
    paddingRight: 5,
  },
  dateInput: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 2,
    borderColor: "#007BFF",
    backgroundColor: "#FFF",
    textAlign: "center",
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  exportButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  legendContainer: {
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  legendTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default InfoSaudePG;
