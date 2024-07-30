//medicalPrescriptionScreen.js
import React, { useState, useEffect,useRef  } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, storage } from "../config/firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import * as LocalAuthentication from 'expo-local-authentication';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';


// Componente da tela de prescrições médicas
const MedicalPrescriptionScreen = () => {
  // Estados do componente
  const [prescriptions, setPrescriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [medicamento, setMedicamento] = useState("");
  const [tipoReceita, setTipoReceita] = useState("");
  const [typesPrescription, setTypesPrescription] = useState([]);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false); // Estado para controlar o refresh
  const animation = useRef(new Animated.Value(0)).current;
  const [typePrescriptionsMap, setTypePrescriptionsMap] = useState({});



  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onRefresh = () => {
    const user = getAuth().currentUser;
    if (user) {
      setRefreshing(true);
      fetchPrescriptions(user.uid);
    }
  };
  
  

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isBiometricSupported = await LocalAuthentication.isEnrolledAsync();
    const auth = getAuth();

    if (hasHardware && isBiometricSupported) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Autenticação necessária",
        fallbackLabel: "Digite a senha do dispositivo",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        fetchPrescriptions(auth.currentUser?.uid);
      } else {
        Alert.alert("Autenticação", "Autenticação falhou ou foi cancelada.");
      }
    } else {
      Alert.alert("Autenticação", "Dispositivo não suporta autenticação biométrica.");
    }
  };

  const fetchTypesPrescription = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "TypePrescription"));
      const typesMap = {}; // Cria um objeto para mapear IDs para nomes
      querySnapshot.forEach(doc => {
        typesMap[doc.id] = doc.data().Type; // Assume que o nome do tipo está sob a chave 'Type'
      });
      setTypePrescriptionsMap(typesMap); // Salva o mapa no estado
    } catch (error) {
      console.error("Erro ao buscar tipos de prescrição:", error);
      Alert.alert("Erro", "Não foi possível buscar os tipos de prescrição.");
    }
  };
  
  const fetchPrescriptions = async (userID) => {
    if (!userID) return;
    setRefreshing(true);
    try {
      const presQuery = query(collection(db, "medicalPrescription"), where("ID_users", "==", userID));
      const querySnapshot = await getDocs(presQuery);
      const prescriptionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const typeName = typePrescriptionsMap[data.type] || "Tipo desconhecido"; // Usa o mapa para substituir o ID pelo nome
        return { id: doc.id, ...data, typeName }; // Inclui o nome do tipo no objeto de prescrição
      });
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error("Erro ao buscar prescrições médicas:", error);
      Alert.alert("Erro", "Não foi possível buscar as prescrições médicas.");
    }
    setRefreshing(false);
  };
  
  useEffect(() => {
    fetchTypesPrescription().then(() => {
      if (getAuth().currentUser) {
        fetchPrescriptions(getAuth().currentUser.uid);
      }
    });
    authenticate();
  }, []);
  

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Animated.Text style={[styles.authText, { transform: [{ scale: animation }] }]}>
          A autenticação é necessária para acessar esta tela.
        </Animated.Text>
        <TouchableOpacity style={styles.button} onPress={authenticate}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }


  // Função para fechar o modal
  const onClose = () => {
    setModalVisible(false);
    setSelectedImage(null); // Limpa a imagem selecionada
    setMedicamento(""); // Limpa o campo de medicamento
    setTipoReceita(""); // Reseta a seleção do tipo de receita
    setCurrentPrescriptionId(null); // Limpa o ID atual após fechar o modal
  };
  

  // Função para escolher uma foto da galeria
  const handleChoosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // Verifica se o resultado não foi cancelado e possui a propriedade 'uri'
    if (!result.cancelled && result.uri) {
      setSelectedImage(result.uri); // Atualiza o estado corretamente
      console.log("Imagem selecionada:", result.uri);
    } else if (!result.cancelled && result.assets && result.assets[0].uri) {
      // Caso a estrutura inclua um array 'assets'
      setSelectedImage(result.assets[0].uri);
      console.log("Imagem selecionada:", result.assets[0].uri);
    } else {
      console.log("Nenhuma imagem foi selecionada.");
    }
  };
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("É necessário conceder permissão para acessar a câmera.");
      return;
    }

    // Lança a câmera para o usuário tirar uma foto
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Permite edição básica, como recorte
      aspect: [4, 3],
      quality: 1, // Ajuste conforme necessário para gerenciar o tamanho do arquivo
    });

    // Verifica se o usuário não cancelou a captura da foto
    if (!result.cancelled) {
      // Atualiza o estado com o URI da imagem capturada
      // A estrutura de `result` mudou em versões mais recentes do expo-image-picker.
      // Agora, result.assets é um array de objetos, cada um representando uma imagem ou vídeo selecionados.
      // Verifica se result.assets existe e possui ao menos um item com 'uri'
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
        console.log("Foto capturada:", result.assets[0].uri);
      } else {
        // Se result.assets não estiver no formato esperado, usa result.uri diretamente
        // Isso é útil para manter compatibilidade com versões anteriores do expo-image-picker
        setSelectedImage(result.uri);
        console.log("Foto capturada:", result.uri);
      }
    } else {
      console.log("Captura de foto cancelada.");
    }
  };

// Função para enviar ou atualizar a prescrição no banco de dados
const handleUploadPrescription = async () => {
  if (!selectedImage) {
    alert("Por favor, selecione uma imagem.");
    return;
  }

  try {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = (e) => {
        console.error(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", selectedImage, true);
      xhr.send(null);
    });

    const fileRef = ref(storage, `prescriptions/${new Date().toISOString()}`);
    await uploadBytes(fileRef, blob);
    blob.close();

    const downloadUrl = await getDownloadURL(fileRef);
    const auth = getAuth();
    const user = auth.currentUser;
    const userID = user ? user.uid : "";

    const prescriptionData = {
      ID_users: userID,
      Medicamento: medicamento,
      dateTime: new Date(),
      file: downloadUrl,
      type: tipoReceita,
    };

    if (currentPrescriptionId) {
      // Atualiza o documento existente
      await updateDoc(doc(db, "medicalPrescription", currentPrescriptionId), prescriptionData);
      alert("Prescrição atualizada com sucesso.");
    } else {
      // Adiciona um novo documento
      await addDoc(collection(db, "medicalPrescription"), prescriptionData);
      alert("Prescrição salva com sucesso.");
    }

    setModalVisible(false);
    setSelectedImage(null); // Limpar a imagem selecionada
    setMedicamento(""); // Limpa o campo de medicamento
    setTipoReceita(""); // Reseta a seleção do tipo de receita
    fetchPrescriptions(userID); // Atualiza a lista após salvar/atualizar uma prescrição
  } catch (error) {
    console.error("Erro ao salvar prescrição: ", error);
    alert("Erro ao salvar prescrição.");
  }
};


  // Adicione uma função para deletar uma prescrição
  const deletePrescription = async (id) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza de que deseja excluir esta prescrição?",
      [
        { text: "Cancelar" },
        {
          text: "Excluir",
          onPress: async () => {
            await deleteDoc(doc(db, "medicalPrescription", id));
            // Chamada para atualizar a lista após a exclusão
            fetchPrescriptions(getAuth().currentUser?.uid);
          },
        },
      ]
    );
  };
  
  const editPrescription = (prescription) => {
    setMedicamento(prescription.Medicamento);
    setTipoReceita(prescription.type);  // Certifique-se de que este 'type' corresponde ao ID esperado pelo Picker
    setSelectedImage(prescription.file);
    setCurrentPrescriptionId(prescription.id);
    setModalVisible(true);
  };
  

  // Renderiza cada item da lista de prescrições
  const renderPrescription = ({ item }) => (
    <View style={styles.prescriptionCard}>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Medicamento:</Text> {item.Medicamento}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Tipo:</Text> {item.typeName}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Data:</Text> {item.dateTime.toDate().toLocaleDateString()}
      </Text>
      {item.file && (
        <Image source={{ uri: item.file }} style={styles.cardImage} />
      )}
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => downloadFile(item.file, `Prescription_${item.id}.jpg`)}>
          <Icon name="download" size={24} color="green" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => editPrescription(item)}>
          <Icon name="edit" size={24} color="blue" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deletePrescription(item.id)}>
          <Icon name="trash" size={24} color="red" style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  


// Função para baixar e salvar a imagem na galeria
const downloadFile = async (uri, fileName) => {
  try {
    // Primeiro, pede a permissão para acessar a galeria
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Acesso à galeria não permitido!');
      return;
    }

    // Baixa o arquivo para o sistema de arquivos local
    const fileUri = FileSystem.documentDirectory + fileName;
    const downloadResult = await FileSystem.downloadAsync(uri, fileUri);

    if (downloadResult.status === 200) {
      // Salva o arquivo baixado na galeria do dispositivo
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      Alert.alert("Sucesso", "Arquivo baixado e salvo na galeria com sucesso!");
    } else {
      throw new Error('Falha no download do arquivo.');
    }
  } catch (error) {
    Alert.alert("Erro", "Erro ao realizar o download: " + error.message);
  }
};

// Componente da tela de prescrições médicas
return (
  <View style={styles.container}>
  <FlatList
    data={prescriptions.sort((a, b) => new Date(b.dateTime.seconds * 1000) - new Date(a.dateTime.seconds * 1000))}
    renderItem={renderPrescription}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    }    ListHeaderComponent={(
      <>
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Cadastrar Receita</Text>
        </TouchableOpacity>

        {/* Legenda dos ícones */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legenda dos Ícones:</Text>
          <View style={styles.legendItem}>
            <Icon name="download" size={24} color="green" />
            <Text style={styles.legendText}>Baixar Receita/Prescrição</Text>
          </View>
          <View style={styles.legendItem}>
            <Icon name="edit" size={24} color="blue" />
            <Text style={styles.legendText}>Editar Receita/Prescrição</Text>
          </View>
          <View style={styles.legendItem}>
            <Icon name="trash" size={24} color="red" />
            <Text style={styles.legendText}>Excluir Receita/Prescrição</Text>
          </View>
        </View>

        {/* Conteúdo do Modal */}
   {/* Conteúdo do Modal */}
   <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>x</Text>
          </TouchableOpacity>
          <Text style={styles.LabelMedicamento}>
            Título da Prescrição / Receita:
          </Text>
          <TextInput
            style={styles.input}
            onChangeText={setMedicamento}
            value={medicamento}
            placeholder="Um Resumo curto da Receita / Prescrição"
          />
          <Text style={styles.label}>Categoria de Receita:</Text>
          <Picker
  selectedValue={tipoReceita}
  onValueChange={(itemValue, itemIndex) => setTipoReceita(itemValue)}
  style={styles.picker}
>
  {Object.entries(typePrescriptionsMap).map(([key, value]) => (
    <Picker.Item key={key} label={value} value={key} />
  ))}
</Picker>


          <View style={{ height: 180 }} />
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <Text style={styles.buttonText}>Tirar Foto</Text>
          </TouchableOpacity>
          <View style={{ height: 80 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleChoosePhoto}
            >
              <Text style={styles.buttonText}>Escolher Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: selectedImage ? "#007bff" : "gray" },
              ]}
              onPress={handleUploadPrescription}
              disabled={!selectedImage}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 60 }} />
        </View>
      </View>
    </Modal>
      </>
    )}
    style={{ width: "100%" }}
  />
  </View>
);

};
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authText: {
    color: 'red', // Escolha uma cor que chame atenção
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 20,
    paddingVertical: 15, // Ajuste a altura do botão aqui
    paddingHorizontal: 30, // Ajuste a largura do botão aqui
    margin: 12, // Margem ao redor do botão
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 0 },
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    justifyContent: "space-around", // Garante um espaçamento uniforme entre os itens
    backgroundColor: "white",
    borderRadius: 25,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    width: "90%",
    height: "70%",
    marginTop: -80,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginTop: 10, // Espaço a partir do topo do modal
    marginRight: 10, // Espaço a partir da direita do modal
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    padding: 10,
    marginVertical: 10,
  },
  input: {
    height: 40,
    width: "100%", // Pode usar a largura total do modal
    margin: -10,
    marginVertical: 39,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  label: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 10, // Ajuste a margem superior para dar espaço entre a label e o Picker
    fontSize: 23, // Ajuste conforme necessário
  },
  LabelMedicamento: {
    alignSelf: "flex-start",
    marginLeft: 1,
    marginVertical: -0,
    marginTop: 30,
    fontSize: 22,
  },
  previewImage: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listItemText: {
    fontSize: 18,
    marginBottom: 10,
  },
  prescriptionCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  legendContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    width: "70%",
    justifyContent: "space-around",
    alignSelf: "center", // Altere aqui para "center" para centralizar o container
},
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  legendText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default MedicalPrescriptionScreen;
