//RelPressaoArterialScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { db } from "../../config/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const screenWidth = Dimensions.get("window").width;
const recordsPerPage = 10; // Adicione esta linha para definir quantos registros por página você deseja

const RelPressaoArterialScreen = ({ closeModal }) => {
  const [pressaoData, setPressaoData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  // ...

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "pressaoArterial"),
          where("UsuarioID", "==", user.uid),
          orderBy("DataHora", "desc")
        );
        const querySnapshot = await getDocs(q);
        const newData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            DataHora: data.DataHora.toDate(),
            Sistolica: Number(data.Sistolica),
            Diastolica: Number(data.Diastolica),
          };
        });
        setPressaoData(newData);
      } catch (error) {
        console.error("Erro ao buscar dados: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  // Filtrando a última semana
  const umaSemanaAtras = new Date();
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 365);
  const dadosFiltrados = pressaoData.filter(
    (p) => p.DataHora >= umaSemanaAtras
  );

  const totalPages = Math.ceil(pressaoData.length / recordsPerPage); // Correção para calcular o total de páginas

  // Criando as labels e datasets após a filtragem dos dados
  const labels = dadosFiltrados.map(
    (p) =>
      `${p.DataHora.getDate()}/${
        p.DataHora.getMonth() + 1
      } ${p.DataHora.getHours()}:${p.DataHora.getMinutes()}`
  );
  const sistolicaValues = dadosFiltrados.map((p) => p.Sistolica);
  const diastolicaValues = dadosFiltrados.map((p) => p.Diastolica);

  // Implementando a lógica de paginação para a tabela
  const itensPorPagina = 10;
  const [paginaAtual, setPaginaAtual] = useState(0);
  const paginas = Math.ceil(dadosFiltrados.length / itensPorPagina);

  const dadosPaginados = pressaoData.slice(
    currentPage * recordsPerPage,
    (currentPage + 1) * recordsPerPage
  );

  // Função para mudar de página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 0 && novaPagina < totalPages) {
      // Correção para usar totalPages
      setCurrentPage(novaPagina);
    }
  };

  const exportToPDF = async () => {
    // Aqui você implementará a lógica de exportação para PDF.
    // Isso geralmente envolve a criação de um documento PDF com os dados e salvando ou compartilhando o arquivo.
    console.log("Exportar para PDF");
  };

  // Função para calcular a cor de fundo baseada nos valores da pressão
  const getBackgroundColor = (sistolica, diastolica) => {
    if (sistolica > 140 || diastolica > 90) {
      return "#ffcccc"; // Vermelho para pressão alta
    } else if (sistolica < 110 || diastolica < 60) {
      return "#ccccff"; // Azul para pressão baixa
    }
    return "#fff"; // Branco para valores normais
  };

  const chartConfig = {
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#fb8c00",
    backgroundGradientTo: "#ffa726",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
  };

  return (
    <View style={styles.modalOverlay}>
      <ScrollView
        vertical={true}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollViewContent}
      >
        <Text style={styles.titleRelatorio}>Relatório de Pressão Arterial</Text>

        {/* Contêiner para a tabela */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: "#EDF3EF", borderColor: "#9CCC65" },
          ]}
        >
         {/* Cabeçalho da Tabela */}
<View style={styles.tableHeader}>
  <Text style={styles.headerText}>Data/Hora</Text>
  <Text style={styles.headerText}>Pres.Arterial</Text>
  <Text style={styles.headerText}>Humor</Text>
  <Text style={styles.headerText}>Tontura</Text>
</View>

{/* Linhas da Tabela */}
{dadosPaginados.map((pressao, index) => {
  const backgroundColor = getBackgroundColor(pressao.Sistolica, pressao.Diastolica);
  return (
    <View
      key={index}
      style={[styles.recordRow, { backgroundColor }]}
    >
      <Text style={styles.recordCell}>
        {pressao.DataHora.toLocaleDateString()} {pressao.DataHora.toLocaleTimeString()}
      </Text>
      <Text style={styles.recordCell}>
        {`${pressao.Sistolica}/${pressao.Diastolica}`}
      </Text>
      <Text style={styles.recordCell}>{pressao.Humor}</Text>
      <Text style={styles.recordCell}>
        {pressao.Tontura ? "Sim" : "Não"}
      </Text>
    </View>
  );
})}

          {/* Paginação */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={styles.paginationButton}
            >
              <Text>Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.pageNumberText}>
              {currentPage + 1} de {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              style={styles.paginationButton}
            >
              <Text>Próximo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>Histórico de Pressão Arterial</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.chartScroll}
        >
          <View
            style={[
              styles.sectionContainer,
              { backgroundColor: "#EDF3EF", borderColor: "#9CCC65" },
            ]}
          >
            <LineChart
              data={{
                labels: labels,
                datasets: [
                  {
                    data: sistolicaValues,
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: diastolicaValues,
                    color: (opacity = 1) => `rgba(244, 65, 134, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={labels.length * 100} // Altere o multiplicador conforme necessário para espaçamento
              height={220}
              chartConfig={{
                backgroundColor: "#e26a00",
                backgroundGradientFrom: "#fb8c00",
                backgroundGradientTo: "#ffa726",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                  marginHorizontal: 16, // Adicione margem horizontal para evitar corte no gráfico
                },
                propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.exportButton]}
            onPress={exportToPDF}
          >
            <Text style={styles.buttonText}>Exportar para PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={closeModal}
          >
            <Text style={styles.buttonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30, // para garantir que o texto não fique escondido atrás do ícone
  },
  chart: {
    marginHorizontal: 16, // Adicione margens horizontais para evitar o gráfico de tocar as bordas
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "gray",
    borderRadius: 8,
    color: "black",
    paddingRight: 30, // para garantir que o texto não fique escondido atrás do ícone
  },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 255)",
    paddingTop: 50, // Reduzido para diminuir o espaço no topo
    elevation: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10, // Reduzido para diminuir o padding geral
  },
  titleRelatorio:{
    fontWeight: "bold", // Negrito
    fontSize: 22, // Tamanho da fonte maior
    marginBottom: 50, // Espaço abaixo do título
    textAlign: "center", // Centralizar texto

  },
  title: {
    fontWeight: "bold", // Negrito
    fontSize: 22, // Tamanho da fonte maior
    marginBottom: 30, // Espaço abaixo do título
    textAlign: "center", // Centralizar texto
  },
  tableHeader: {
    alignSelf: "stretch",
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    textAlign: "left", // Alterado para 'left' para alinhar à esquerda.
    backgroundColor: "#eee", // fundo da cabeçalho da tabela
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
    padding: 7,
  },
  recordRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7, // Espaçamento vertical reduzido
    paddingHorizontal: 7, // Espaçamento horizontal reduzido
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  recordCell: {
    flex: 1,
    width: "80%",
    fontSize: 15,

    textAlign: "center",
  },

  chartScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: -20,
  },
  exportButton: {
    backgroundColor: "#4CAF50",
  },
  closeButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Isso espalhará os botões e o texto de forma igual
    alignItems: "center",
    padding: 10,
  },
  paginationButton: {
    padding: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    marginHorizontal: 20, // Adiciona espaço horizontal entre os botões e o texto
  },
  pageNumberText: {
    fontSize: 16,
    // Você pode adicionar margem aqui se precisar, mas `justifyContent: 'space-between'` deve ser suficiente
  },
  button: {
    padding: 15,
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: "#EDF3EF",
    borderRadius: 20,
    padding: 25,
    marginBottom: 50,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#9CCC65",
  },
});
export default RelPressaoArterialScreen;
