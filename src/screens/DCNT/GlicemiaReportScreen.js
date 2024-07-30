// GlicemiaReportScreen.js
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
const recordsPerPage = 10;

const GlicemiaReportScreen = ({ closeModal }) => {
  const [glicemiaData, setGlicemiaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const auth = getAuth();
  const user = auth.currentUser;
  const [pressaoData, setPressaoData] = useState([]);

  // A ordem dos Hooks aqui está correta, garantindo que sejam chamados incondicionalmente
  const [paginaAtual, setPaginaAtual] = useState(0); // Esse estado parece estar duplicado, considere remover se não estiver em uso

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "diabetes"),
          where("ID_user", "==", user.uid),
          orderBy("Datetime", "desc")
        );
        const querySnapshot = await getDocs(q);
        const newData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          Datetime: doc.data().Datetime.toDate(),
        }));
        setGlicemiaData(newData);
      } catch (error) {
        console.error("Erro ao buscar dados de glicemia: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  if (loading) {
    return <Text>Carregando dados...</Text>;
  }
  const currentData = glicemiaData.slice(
    currentPage * recordsPerPage,
    (currentPage + 1) * recordsPerPage
  );

  // Funções como exportToPDF e closeModal devem ser declaradas aqui
  const exportToPDF = () => {
    console.log("Implemente a exportação para PDF aqui.");
  };

  // Filtrando a última semana
  const umaSemanaAtras = new Date();
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
  const dadosFiltrados = glicemiaData.filter(
    (p) => p.Datetime >= umaSemanaAtras
  );

  // Implementando a lógica de paginação para a tabela
  const itensPorPagina = 10;
  const paginas = Math.ceil(dadosFiltrados.length / itensPorPagina);

  const dadosPaginados = glicemiaData.slice(
    currentPage * recordsPerPage,
    (currentPage + 1) * recordsPerPage
  );

  // Correção para calcular o total de páginas
  const totalPages = Math.ceil(glicemiaData.length / recordsPerPage);

  // Atualizar a lógica para mudar de página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 0 && novaPagina < totalPages) {
      setCurrentPage(novaPagina);
    }
  };
  const labels = glicemiaData.map(
    (p) =>
      `${p.Datetime.getDate()}/${
        p.Datetime.getMonth() + 1
      } ${p.Datetime.getHours()}:${p.Datetime.getMinutes()}`
  );
  const GlicemiaValues = glicemiaData.map((p) => p.Glicemia);

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
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollViewContent}
      >
        <Text style={styles.title}>Relatório de Glicemia</Text>

        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: "#EDF3EF", borderColor: "#9CCC65" },
          ]}
        >
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Data/Hora</Text>
            <Text style={styles.headerText}>Glicemia</Text>
            <Text style={styles.headerText}>Humor</Text>
            <Text style={styles.headerText}>Em Jejum</Text>
          </View>

          {currentData.map((item, index) => {
            let backgroundColor = "#fff"; // Cor padrão
            if (item.Glicemia > 100) {
              backgroundColor = "#ffcccc"; // Vermelho claro para glicemia alta
            } else if (item.Glicemia < 75) {
              backgroundColor = "#ccccff"; // Azul claro para glicemia baixa
            }

            return (
              <View key={index} style={[styles.recordRow, { backgroundColor }]}>
                <Text style={styles.recordCell}>
                  {item.Datetime.toLocaleDateString()}{" "}
                  {item.Datetime.toLocaleTimeString()}
                </Text>
                <Text
                  style={styles.recordCell}
                >{`${item.Glicemia} mg/dL`}</Text>
                <Text style={styles.recordCell}>{item.Humor}</Text>
                <Text style={styles.recordCell}>
                  {item.tontura ? "Sim" : "Não"}
                </Text>
              </View>
            );
          })}

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

        <Text style={styles.title}>Histórico de Glicemia</Text>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.chartScrollContent}
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
                    data: GlicemiaValues,
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
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
    paddingTop: 70, // Ajustar conforme necessário para mover o conteúdo para baixo
    elevation: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontWeight: "bold", // Negrito
    fontSize: 22, // Tamanho da fonte maior
    marginBottom: 20, // Espaço abaixo do título
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
    padding: 5,
  },
  recordRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    textAlign: "center",
    borderBottomWidth: 1,
    width: "100%",
    borderBottomColor: "#ddd",
  },
  recordCell: {
    flex: 1,
    width: "100%",
    fontSize: 15,
    textAlign: "center",
  },
  chartContainer: {
    alignSelf: "stretch",
    marginTop: 10,
    marginHorizontal: 16, // Isso evitará que o gráfico toque nas bordas laterais
    marginRight: 30, // Garante que a margem direita seja 0
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
    marginTop: 20,
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Fundo escuro translúcido
  },
  tituloModal: {
    fontWeight: "bold", // Negrito
    fontSize: 22, // Tamanho da fonte maior
    marginBottom: 20, // Espaço abaixo do título
    textAlign: "center", // Centralizar texto
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
      marginHorizontal: 15,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%", // Ajuste de acordo com a largura desejada
    maxWidth: 400, // Para tablets e dispositivos maiores
  },
  input: {
    height: 48, // Tamanho maior para fácil interação
    marginVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 20, // Fonte maior para melhor leitura
  },
  picker: {
    height: 48, // Altura maior para o picker
    width: "100%",
    marginVertical: 12,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginLeft: 0.5,
    marginBottom: 1,
    paddingVertical: 15, // Aumenta o espaço vertical dentro do contêiner
    paddingHorizontal: 10, // Espaço horizontal dentro do contêiner
    borderRadius: 100, // Cantos arredondados para a estética
    backgroundColor: "#ccc", // Cor de fundo cinza
    width: "100%", // Ocupa a largura toda do modal
  },
  switchLabel: {
    flex: 1, // Isso garante que o texto não empurre o switch para fora da tela
    marginRight: 1, // Adiciona um pouco de margem entre o texto e o switch
  },
  button: {
    padding: 15,
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 8,
  },
  buttonClose: {
    backgroundColor: "#f44336", // Cor do botão para fechar o modal
    paddingVertical: 12, // Espaçamento vertical
    paddingHorizontal: 50, // Espaçamento horizontal
    borderRadius: 25, // Cantos arredondados
    elevation: 3, // Sombreamento para dar efeito 3D
    marginTop: 20, // Margem superior
  },
  textButtonClose: {
    color: "#FFFFFF", // Cor do texto branco
    fontWeight: "bold", // Negrito
    fontSize: 18, // Tamanho da fonte
    textAlign: "center", // Centralizar texto
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  buttonSalvar: {
    backgroundColor: "#4CAF50", // Cor de fundo verde
    paddingVertical: 12, // Espaçamento vertical
    paddingHorizontal: 50, // Espaçamento horizontal
    borderRadius: 25, // Cantos arredondados
    elevation: 3, // Sombreamento para dar efeito 3D
    marginTop: 20, // Margem superior
  },
  textButtonSalvar: {
    color: "#FFFFFF", // Cor do texto branco
    fontWeight: "bold", // Negrito
    fontSize: 18, // Tamanho da fonte
    textAlign: "center", // Centralizar texto
  },
  sectionContainer: {
    backgroundColor: "#EDF3EF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 50,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#9CCC65",
  },
});

export default GlicemiaReportScreen;
