//MedicationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Certifique-se de importar useRoute também
import { Picker } from "@react-native-picker/picker";
import {
  CapsuleIcon,
  PillIcon,
  PoteIcon,
  ComprimidoRetangularIcon,
  InjecaoIcon,
  AdesivoIcon,
  CremeIcon,
  SprayIcon,
} from "./FormsMedications"; // Importando os ícones
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import firebase from "firebase/app";
import { db, storage } from "../../config/firebaseConfig"; // Ajuste para o caminho correto do seu arquivo de configuração
import { collection, addDoc, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const colors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FFFFFF",
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#800080",
  "#008080",
  "#000080",
  "#40E0D0",
  "#FF7F50",
  "#FFEBCD",
  "#EE82EE",
];

const MedicationScreen = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [medicationName, setMedicationName] = useState("");
  const [medicationType, setMedicationType] = useState("");
  const [medicationDosage, setMedicationDosage] = useState(""); // Defina um valor inicial para testar
  const [TypemedicationDosage, setTypemedicationDosage] = useState(""); // Defina um valor inicial para testar
  const [medicationForm, setMedicationForm] = useState("Pill"); // Inicializa com 'Pill', mas isso deve ser definido em passos anteriores
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF"); // Inicializando com branco
  const [selectedImage, setSelectedImage] = useState(null);
  const [observations, setObservations] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // Novo estado para controlar o cartão expandido
  const [selectedMedication, setSelectedMedication] = useState(null); // Estado para guardar o medicamento selecionado para edição

  const handleNext = () => {
    // Verifica as condições para os passos iniciais
    if (
      (currentStep === 1 && medicationName) ||
      (currentStep === 2 && medicationType) ||
      (currentStep === 3 && medicationDosage && TypemedicationDosage)
    ) {
      setCurrentStep(currentStep + 1);
    }
    // Verifica se a forma do medicamento foi selecionada
    else if (currentStep === 4 && medicationForm) {
      setCurrentStep(currentStep + 1); // Avança para a etapa de seleção de cor
    }
  };

  // Carrega os medicamentos do usuário logado
  const loadMedications = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "medications"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const meds = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMedications(meds);
    } else {
      setMedications([]);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    // Pre-populate form if editing
    if (selectedMedication) {
      setMedicationName(selectedMedication.name);
      setMedicationType(selectedMedication.type);
      setMedicationDosage(selectedMedication.dosage);
      // Continue setting other necessary fields
    }
  }, [selectedMedication]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleRegisterMedication = async () => {
    const auth = getAuth(); // Inicializa o módulo de autenticação
    const user = auth.currentUser; // Obtém o usuário atualmente logado

    if (!user) {
      alert("Você precisa estar logado para registrar medicamentos.");
      return;
    }
    try {
      // Carregando a imagem no Storage
      const imageRef = ref(
        storage,
        `Medication_Images/${new Date().toISOString()}`
      );
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      // Adicionando dados ao Firestore
      const docRef = await addDoc(collection(db, "medications"), {
        name: medicationName,
        type: medicationType,
        dosage: `${medicationDosage} ${TypemedicationDosage}`,
        form: medicationForm,
        color: selectedColor,
        backgroundColor: backgroundColor,
        observations: observations,
        imageUrl: imageUrl,
        userId: user.uid, // Adiciona o ID do usuário para referenciar o medicamento ao usuário logado
      });

      alert("Medicamento cadastrado com sucesso!");
      setCurrentStep(0); // Volta para o início
      await loadMedications(); // Recarrega os medicamentos
    } catch (error) {
      console.error("Erro ao cadastrar medicamento:", error);
      alert("Erro ao cadastrar o medicamento.");
    }
  };

  const IconComponents = {
    Pill: PillIcon,
    Capsule: CapsuleIcon,
    Potinho: PoteIcon,
    ComprimidoRetangular: ComprimidoRetangularIcon,
    Injecao: InjecaoIcon,
    Adesivo: AdesivoIcon,
    Cream: CremeIcon,
    Spray: SprayIcon,

    // Adicione outros ícones conforme necessário
  };

  const SelectedIcon = IconComponents[medicationForm];

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSelection = (form) => {
    setMedicationForm(form);
  };

  const handleDosageChange = (dosage) => {
    setMedicationDosage(dosage);
  };

  const handleColorSelection = (color) => {
    setSelectedColor(color);
  };

  const handleAddMedication = () => {
    setCurrentStep(1); // Muda para a tela de adição de medicamento
  };

  // Função para exibir opções ao clicar no cartão
  const handleSelectCard = (id) => {
    if (selectedId === id) {
      setSelectedId(null); // Se já está selecionado, fecha ao clicar novamente
    } else {
      setSelectedId(id); // Caso contrário, abre as opções
    }
  };

  const openEditModal = (medication) => {
    setSelectedMedication(medication); // Salva o medicamento no estado
    setCurrentStep(1); // Abre o modal de edição no passo 1
  };

  const confirmDelete = async (id) => {
    try {
      // Referência ao documento do medicamento no Firestore
      const medicationRef = doc(db, "medications", id);
      // Deleta o documento
      await deleteDoc(medicationRef);
      // Filtra o medicamento excluído da lista local
      setMedications((prevMedications) =>
        prevMedications.filter((medication) => medication.id !== id)
      );
      alert("Medicamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir o medicamento:", error);
      alert("Erro ao excluir o medicamento.");
    }
  };
  

  // No topo do arquivo, garanta que você tenha importado os ícones adequados e as cores.

  const renderMedication = ({ item }) => {
    // Resolve the icon component based on the medication form
    const MedicationIcon = IconComponents[item.form];

    return (
      <View>
        <TouchableOpacity style={styles.medicationCard} onPress={() => handleSelectCard(item.id)}>
          <Image source={{ uri: item.imageUrl }} style={styles.medicationImage} />
          <View style={styles.medicationInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10, padding: 5 }}>

              <View style={{ flex: 1 }}>
                <Text style={styles.medicationName}>{item.name}</Text>
                <Text style={styles.medicationDetails}>
                  Dosagem: {item.dosage}, Tipo: {item.type}
                </Text>

              </View>

            </View>
          </View>
        </TouchableOpacity>
        {selectedId === item.id && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
              <MaterialIcons name="edit" size={24} color="white" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
              <MaterialIcons name="delete" size={24} color="white" />
              <Text style={styles.actionButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
      // A estrutura de result mudou em versões mais recentes do expo-image-picker.
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

  return (
    <View style={styles.container}>
      {currentStep === 0 && (
        <FlatList
          data={medications}
          renderItem={renderMedication}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addButton} onPress={() => setCurrentStep(1)}>
              <Text style={styles.addButtonText}>Adicionar Medicamento</Text>
            </TouchableOpacity>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMedications} />}

          contentContainerStyle={{
            paddingBottom: 1, // Espaço extra na parte inferior
            paddingHorizontal: 30, // Adiciona espaçamento horizontal
          }} style={{ width: "90%" }} // Garante que o FlatList ocupe toda a largura disponível
        />
      )}
      {currentStep === 1 && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require("../assets/icons/pill.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>Nome do Medicamento</Text>
          </View>
          <TextInput
            style={styles.input}
            value={medicationName}
            onChangeText={setMedicationName}
            placeholder="Digite o nome do medicamento"
          />
          <TouchableOpacity
            style={[styles.button, !medicationName && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!medicationName}
          >
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePrevious}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {currentStep === 2 && (
        <View style={styles.step}>
          <Text style={styles.medicationLabel}>{medicationName}</Text>
          <Image
            source={require("../assets/icons/capsule.png")}
            style={styles.logo}
          />
          <Text style={styles.headerText}>Escolha o Tipo de Medicamento</Text>
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Formas Comuns</Text>
              {["Cápsula", "Comprimido", "Líquido", "Tópico"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.optionButton}
                  onPress={() => setMedicationType(type)}
                >
                  <Text style={styles.optionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Mais Formas</Text>
              {[
                "Adesivo",
                "Creme",
                "Dispositivo",
                "Espuma",
                "Gel",
                "Gotas",
                "Inalador",
                "Injeção",
                "Loção",
                "Pomada",
                "Pó",
                "Spray",
                "Supositório",
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.optionButton}
                  onPress={() => setMedicationType(type)}
                >
                  <Text style={styles.optionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, !medicationType && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!medicationType}
            >
              <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.button} onPress={handlePrevious}>
                <Text style={styles.buttonText}>Voltar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {currentStep === 3 && (
        <ScrollView>
          <View style={styles.step}>
            <View style={styles.stepContainer}>
              <Text style={styles.medicationLabel}>
                {`${medicationName} - ${medicationType}, ${medicationDosage} ${TypemedicationDosage}`}
              </Text>
              <Image
                source={require("../assets/icons/liquid.png")}
                style={styles.logo}
              />
              <Text style={styles.headerText}>
                Adicione a Intensidade do Medicamento
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Intensidade</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={medicationDosage}
                  onChangeText={handleDosageChange}
                  placeholder="Digite a intensidade"
                  editable={true}
                />
              </View>
              <View style={styles.pickerContainer}>
                <Text style={styles.labelTipo}>Escolha a Unidade</Text>
                <Picker
                  selectedValue={TypemedicationDosage}
                  onValueChange={(itemValue, itemIndex) =>
                    setTypemedicationDosage(itemValue)
                  }
                  style={styles.picker}
                >
                  {["mg", "mcg", "g", "mL", "%"].map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    !(medicationDosage && TypemedicationDosage) &&
                    styles.buttonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!(medicationDosage && TypemedicationDosage)}
                >
                  <Text style={styles.buttonText}>Seguinte</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handlePrevious}
                >
                  <Text style={styles.buttonText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {currentStep === 4 && (
        <ScrollView>
          <View style={styles.container}>
            <Image
              source={require("../assets/icons/forms.png")}
              style={styles.logo}
            />
            <View style={styles.header}>
              <Text style={styles.medicationLabel}>
                {medicationName} - {medicationType}, {medicationDosage}{" "}
                {TypemedicationDosage}, {medicationForm}
              </Text>
              <Text style={styles.headerText}>Escolha a Forma</Text>
            </View>
            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => handleFormSelection("Capsule")}
              >
                <CapsuleIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Cápsula</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Pill")}
              >
                <PillIcon color="#007bff" size={50} />

                <Text style={styles.gridLabel}>Comprimido</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Potinho")}
              >
                <PoteIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Pote de Remédio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("ComprimidoRetangular")}
              >
                <ComprimidoRetangularIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Comprimido Retangulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Injecao")}
              >
                <InjecaoIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Siringa de Injeção</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Adesivo")}
              >
                <AdesivoIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Adesivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Cream")}
              >
                <CremeIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Creme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Spray")}
              >
                <SprayIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Spray</Text>
              </TouchableOpacity>
              {/* Adicione mais opções conforme necessário */}
            </View>
            <TouchableOpacity
              style={[styles.button, !medicationForm && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!medicationForm}
            >
              <Text style={styles.buttonText}>Seguinte</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      )}

      {currentStep === 5 && (
        <ScrollView>
          <View style={styles.steps}>
            <Image
              source={require("../assets/icons/color.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>Escolha as Cores do Remédio</Text>

            <View style={[styles.iconContainer, { backgroundColor }]}>
              {SelectedIcon && (
                <SelectedIcon color={selectedColor} size={100} />
              )}
            </View>

            <Text style={styles.subHeaderText}>Cor do Ícone:</Text>
            <View style={styles.colorGrid}>
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={styles.subHeaderText}>Cor de Fundo:</Text>
            <View style={styles.colorGrid}>
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setBackgroundColor(color)}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setCurrentStep(currentStep + 1)}
            >
              <Text style={styles.buttonText}>Confirmar Cores</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePrevious}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {currentStep === 6 && (
        <KeyboardAwareScrollView style={{ flex: 1 }} extraScrollHeight={20}>
          <View style={styles.steps}>
            <Image
              source={require("../assets/icons/fotografia.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>Detalhes do Remédio</Text>

            <View style={styles.messageContainer}>
              <Markdown style={styles.markdownStyles}>
                {`**Capture ou selecione uma foto** da caixa do medicamento ou do conteúdo do remédio.`}
              </Markdown>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleChoosePhoto}
              >
                <MaterialIcons name="photo-library" size={24} color="white" />
                <Text style={styles.buttonText}>Escolher Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleTakePhoto}
              >
                <MaterialIcons name="camera-alt" size={24} color="white" />
                <Text style={styles.buttonText}>Tirar Foto</Text>
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
              />
            )}

            <View style={styles.messageContainer}>
              <Markdown style={styles.markdownStyles}>
                {observations
                  ? `**Observações:** ${observations}`
                  : "**Adicione quaisquer observações sobre o medicamento:**"}
              </Markdown>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Observações sobre o medicamento"
              multiline
              numberOfLines={4}
              onChangeText={setObservations}
              value={observations}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => setCurrentStep(7)}
            >
              <Text style={styles.buttonText}>Salvar e Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      )}

      {currentStep === 7 && (
        <ScrollView>
          <View style={styles.steps}>
            <Image
              source={require("../assets/icons/farmacia.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>
              Confirmação do Registro do Medicamento
            </Text>

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Nome do Medicamento:</Text>
              <Text style={styles.info}>{medicationName}</Text>
            </View>

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Tipo:</Text>
              <Text style={styles.info}>{medicationType}</Text>
            </View>

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Dosagem e Unidade:</Text>
              <Text
                style={styles.info}
              >{`${medicationDosage} ${TypemedicationDosage}`}</Text>
            </View>

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Forma do Medicamento:</Text>
              <Text style={styles.info}>{medicationForm}</Text>
            </View>

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Cor do Ícone e Fundo:</Text>
              <View style={{ flexDirection: "row" }}>
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: selectedColor },
                  ]}
                />
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: backgroundColor },
                  ]}
                />
              </View>
            </View>

            {selectedImage && (
              <View style={styles.detailContainer}>
                <Text style={styles.label}>Imagem do Medicamento:</Text>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
              </View>
            )}

            <View style={styles.detailContainer}>
              <Text style={styles.label}>Observações:</Text>
              <Text style={styles.info}>
                {observations || "Nenhuma observação adicionada."}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegisterMedication}
            >
              <Text style={styles.buttonText}>Cadastrar Medicamento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setCurrentStep(6)}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContentustifyContent: "flex-start",
    backgroundColor: "#fff",
    paddingTop: 20,
    //paddingRight: 10,
    alignItems: "center",

  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  steps: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28, // Aumentando o tamanho para mais visibilidade
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#65BF85",
    padding: 10,
    marginVertical: 10,
    width: "100%",
    alignSelf: "center",
    //alignItems: "center"
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  optionButton: {
    paddingVertical: 15,
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    marginVertical: 5,
    paddingLeft: 15,
  },
  optionText: {
    fontSize: 20,
    color: "#333",
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#000", // Tornando o texto mais escuro para melhorar a visibilidade
  },
  medicationLabel: {
    fontSize: 22, // Tamanho da label do nome do medicamento
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 40,
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20, // Aumentar o espaço abaixo do botão
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",

  },
  scrollView: {
    backgroundColor: "white",
    marginHorizontal: 20,
    width: 320,
  },
  modalContent: {
    padding: 20,
  },
  stepContainer: {
    alignItems: "center",
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  labelTipo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: -65,
  },
  icon: {
    width: 50,
    height: 50,
    margin: 10,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    height: 47,
    borderColor: "gray",
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: 320, // Garanta que a largura esteja correta
  },
  backButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
    marginTop: 20,
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 50,
  },
  buttonContainer: {
    width: "100%", // Define a largura para cobrir toda a largura do container pai
    alignItems: "center", // Centraliza os botões horizontalmente
    marginTop: 100, // Adiciona espaço acima do container de botões
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    color: "#666", // Ajusta a cor do texto para melhor contraste
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
    //height: 500,
  },
  gridItem: {
    width: "50%", // Ajuste conforme necessário para seu layout
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    padding: 10,
  },
  gridIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  gridLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    margin: 10,
  },
  iconText: {
    marginTop: 5,
  },
  iconPreview: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 60,
    marginBottom: 20,
    flexDirection: "row",
    resizeMode: "contain",
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  subHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textTransform: "uppercase", // Aumenta a visibilidade do cabeçalho
    textDecorationLine: "underline", // Sublinha o texto para destacar
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1, // Adiciona borda preta para cada círculo de cor
    borderColor: "#000", // Cor da borda
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
    marginTop: 15,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: "cover",
    marginVertical: 20,
    borderRadius: 10,
  },
  textArea: {
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 30,
    width: "48%",
  },
  textArea: {
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    height: 150,
    width: 300,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  markdownStyles: {
    text: {
      fontSize: 16,
    },
    strong: {
      fontWeight: "bold",
    },
  },
  detailContainer: {
    width: "100%",
    marginBottom: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
    //height: "auto"
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: "#000", // Cor da borda
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  medicationCard: {
    flexDirection: "row",
    width: "auto", // Deve ser 100% para preencher a largura da tela corretamente
    height: 120, // Altura fixa para todos os cartões
    //padding: 10, // Remover padding para que a imagem possa preencher todo o espaço
    marginVertical: 10, // Espaçamento vertical entre os cartões
    backgroundColor: "#FFFFFF", // Fundo branco
    borderRadius: 10, // Bordas arredondadas
    borderWidth: 1, // Largura da borda
    borderColor: "#65BF85", // Cor da borda preta
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    justifyContent: "center",
    overflow: "hidden", // Impede que a imagem ou outros componentes excedam os limites do cartão
  },

  medicationImage: {
    width: "40%", // Metade da largura do cartão
    height: "100%", // Ocupa toda a altura do cartão
    resizeMode: "cover", // Cobrir toda a área sem esticar
  },

  medicationInfo: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 1, // Espaço à esquerda para separar o texto da imagem
    width: "100%",
  },

  medicationName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333", // Cor preta suave para o nome
  },

  medicationDetails: {
    fontSize: 18,
    color: "#666", // Cor cinza para os detalhes
  },
  step: {
    widht: "100%",
  }
});

const markdownStyles = {
  text: {
    fontSize: 16,
  },
  strong: {
    fontWeight: "bold",
  },
};

styles.actionButtonsContainer = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  backgroundColor: '#ffffff', // Fundo branco para maior contraste
  paddingVertical: 15,
  paddingHorizontal: 20,
  borderTopWidth: 1,
  borderColor: '#dddddd', // Cor mais suave
  marginTop: 5,
};

styles.editButton = {
  flexDirection: 'row', // Ícone e texto na mesma linha
  backgroundColor: '#34A853', // Verde Google
  padding: 12,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
};

styles.deleteButton = {
  flexDirection: 'row', // Ícone e texto na mesma linha
  backgroundColor: '#EA4335', // Vermelho Google
  padding: 12,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
};

styles.actionButtonText = {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8, // Espaçamento entre ícone e texto
};

export default MedicationScreen;
