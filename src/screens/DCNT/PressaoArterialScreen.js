// PressaoArterialScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Button,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import RNPickerSelect from "react-native-picker-select";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const PressaoArterialScreen = ({ isModalVisible, closeModal }) => {
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [humor, setHumor] = useState("");
  const [tontura, setTontura] = useState(false);
  const [humores, setHumores] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const [humorItems, setHumorItems] = useState([]);
  const [humorSelecionado, setHumorSelecionado] = useState({});

  useEffect(() => {
    const fetchHumores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "humors"));
        const fetchedHumores = querySnapshot.docs.map((doc) => ({
          label: doc.data().humores, // Confirme se este é o campo correto
          value: doc.id,
        }));
        setHumores(fetchedHumores);
        console.log(fetchedHumores);
      } catch (error) {
        console.error("Erro ao buscar humores:", error);
        Alert.alert("Erro", "Não foi possível buscar os humores.");
      }
    };

    fetchHumores();
  }, []);

  const handleSalvarPressao = async () => {
    // Verificação de usuário movida para dentro desta função
    if (!user) {
      Alert.alert(
        "Usuário não logado",
        "Você precisa estar logado para salvar a pressão arterial."
      );
      return;
    }

    if (!sistolica || !diastolica) {
      Alert.alert("Erro", "Por favor, insira os valores de pressão arterial.");
      return;
    }

    try {
      await addDoc(collection(db, "pressaoArterial"), {
        Sistolica: sistolica,
        Diastolica: diastolica,
        Humor: humorSelecionado.label, // Salva o label do humor, não o ID
        Tontura: tontura,
        UsuarioID: user.uid,
        DataHora: serverTimestamp(),
      });
      Alert.alert("Sucesso", "Pressão arterial salva com sucesso!");
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar os dados de pressão arterial: ", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar os dados de pressão arterial."
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true} // Isso permite que o fundo do modal seja transparente
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.tituloModal}>Registro de Pressão Arterial</Text>
          <Text>Pressão Alta (SYS):</Text>
          <TextInput
            style={styles.input}
            placeholder="Insira os Valores Aqui"
            placeholderTextColor="#999999" // Esta é a cor do placeholder
            keyboardType="numeric"
            value={sistolica}
            onChangeText={setSistolica}
          />
          <Text>Pressão Baixa (DIA):</Text>
          <TextInput
            style={styles.input}
            placeholder="Insira os Valores Aqui"
            placeholderTextColor="#999999" // Esta é a cor do placeholder
            keyboardType="numeric"
            value={diastolica}
            onChangeText={setDiastolica}
          />
          <Text>Humor:</Text>
          <RNPickerSelect
            onValueChange={(value) => {
              const selectedHumor = humores.find((h) => h.value === value);
              setHumorSelecionado(selectedHumor || {});
            }}
            items={humores}
            placeholder={{ label: "Selecione um humor...", value: null }}
            style={pickerSelectStyles}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Tontura ou dor de cabeça? </Text>
            <Switch value={tontura} onValueChange={setTontura} />
          </View>

          <TouchableOpacity
            style={styles.buttonSalvar}
            onPress={handleSalvarPressao}
          >
            <Text style={styles.textButtonSalvar}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonClose]} onPress={closeModal}>
            <Text style={styles.textButtonClose}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    minWidth: "80%",
    backgroundColor: "#2196F3", // Cor primária do botão    height: 48, // Altura do botão para fácil interação
    justifyContent: "center", // Centraliza o texto no botão
    marginVertical: 8, // Espaço vertical para separar os botões
  },
  buttonText: {
    fontSize: 18, // Tamanho da fonte para botões
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
});

export default PressaoArterialScreen;
