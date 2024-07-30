// InfSaude.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import RNPickerSelect from "react-native-picker-select";
import { collection, getDocs } from "firebase/firestore";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

const auth = getAuth();

const InfSaudeScreen = (props) => {
  const [userData, setUserData] = useState({
    race: "",
    bloodType: "",
    isOrganDonor: false,
    hasDiabetes: false,
    hasHypertension: false,
    hadHeartAttack: false,
    hadStroke: false,
    takesControlledMedication: false,
    height: "",
    weight: "",
  });

  const [userId, setUserId] = useState("");
  const [availableBloodTypes, setAvailableBloodTypes] = useState([]);
  const [date, setDate] = useState(new Date()); // Estado para gerenciar a data
  const [availableRaces, setAvailableRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUserId(authUser.uid);
        fetchUserProfile(authUser.uid);
      }
    });
    fetchRaces();
    fetchBloodTypes();

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let isMounted = true; // Adiciona um flag para verificar se o componente está montado

    const fetchUserProfile = async (uid) => {
      const userRef = doc(db, "users", uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && isMounted) {
          const userProfileData = userSnap.data();
          const birthDate = userProfileData.birthDate.toDate ? userProfileData.birthDate.toDate() : new Date();


          // Defina a raça para o valor correto baseado nos dados carregados
          const userRaceValue = userProfileData.race;

          // Atualize o estado com os dados do perfil do usuário
          setUserData({
            ...userProfileData,
            birthDate: birthDate.toISOString(), // Armazenar como string ISO para consistência
            race: userRaceValue,
          });

          // Atualize a seleção da raça baseada no valor correspondente da coleção de raças
          const matchingRace = availableRaces.find(
            (race) => race.label === userRaceValue
          );
          setSelectedRace(matchingRace ? matchingRace.value : "");

          setDate(birthDate);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        Alert.alert("Erro ao buscar perfil", error.message);
      }
    };

    if (auth.currentUser && availableRaces.length > 0) {
      fetchUserProfile(auth.currentUser.uid);
    }

    // Cleanup function para evitar atualizações de estado em componentes desmontados
    return () => {
      isMounted = false;
    };
  }, [auth.currentUser, availableRaces]);

  const fetchBloodTypes = async () => {
    setAvailableBloodTypes(["A-", "A+", "O-", "B+", "AB+", "AB-", "O+", "B-"]);
  };

  const fetchRaces = async () => {
    const raceCollectionRef = collection(db, "race");
    const raceSnapshot = await getDocs(raceCollectionRef);
    const races = raceSnapshot.docs.map((doc) => ({
      label: doc.data().Cor,
      value: doc.id,
    }));
    setAvailableRaces(races);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUserProfile(userId).then(() => setRefreshing(false)); // Assumindo que fetchUserProfile irá atualizar os estados necessários
  }, [userId]);


  const fetchUserProfile = async (uid) => {
    const userRef = doc(db, "users", uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userProfileData = userSnap.data();
        const birthDate = userProfileData.birthDate.toDate ? userProfileData.birthDate.toDate() : new Date();


        const raceValue = availableRaces.find(
          (race) => race.label === userProfileData.race
        )?.value;

        setUserData({
          ...userProfileData, // Dados recuperados do Firestore
          birthDate: birthDate.toISOString(), // Armazenar como string ISO para consistência
          race: raceValue || "", // Use o valor correspondente encontrado
        });

        setDate(birthDate);
      } else {
        console.error("Usuário não encontrado.");
        Alert.alert("Erro", "Perfil do usuário não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      Alert.alert("Erro ao buscar perfil", error.message);
    }
  };

  const [isSaving, setIsSaving] = useState(false); // Adiciona um estado para o indicador de carregamento.

  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert("Erro", "ID do usuário não definido.");
      return;
    }

    setIsSaving(true);

    // Encontrar o label da raça com base no valor selecionado
    const raceLabel = availableRaces.find(race => race.value === userData.race)?.label;

    // Verificar se o label da raça foi encontrado antes de tentar salvar
    if (!raceLabel) {
      Alert.alert("Erro", "Raça selecionada não é válida.");
      setIsSaving(false);
      return;
    }

    try {
      // Preparar os dados que serão atualizados, excluindo informações sensíveis
      const dataToUpdate = {
        race: raceLabel,
        bloodType: userData.bloodType,
        isOrganDonor: userData.isOrganDonor,
        hasDiabetes: userData.hasDiabetes,
        hasHypertension: userData.hasHypertension,
        hadHeartAttack: userData.hadHeartAttack,
        hadStroke: userData.hadStroke,
        takesControlledMedication: userData.takesControlledMedication,
        height: userData.height,
        weight: userData.weight
      };

      // Atualizar o documento do usuário no Firestore
      await updateDoc(doc(db, "users", userId), dataToUpdate);

      Alert.alert("Sucesso", "Perfil de saúde atualizado com sucesso.");
      fetchUserProfile(userId); // Atualizar os dados do usuário após o salvamento
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Falha ao salvar o perfil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };



  const handleTextChange = (text, field) =>
    setUserData({ ...userData, [field]: text });
  const handleSwitchChange = (value, field) =>
    setUserData({ ...userData, [field]: value });

  const getClassificationByAge = (age) => {
    if (age >= 0 && age <= 12) {
      return "Criança";
    } else if (age >= 13 && age <= 17) {
      return "Adolescente";
    } else if (age >= 18 && age <= 29) {
      return "Jovem";
    } else if (age >= 30 && age <= 59) {
      return "Adulto";
    } else if (age >= 60 && age <= 100) {
      return "Idoso";
    } else if (age > 100) {
      return "Ancião";
    } else {
      return "Não especificado";
    }
  };

  function getAge(birthDate) {
    const birthDateObj = new Date(birthDate); // Certifica-se de converter a string ou timestamp para um objeto Date
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  }


  const calculateIMC = (weight, height) => {
    const heightInMeters = height / 100;
    return (weight / heightInMeters ** 2).toFixed(2);
  };

  const getClassificacaoIMC = (imc) => {
    if (imc < 18.5) return { classificacao: "Magreza", grau: 0 };
    if (imc < 25) return { classificacao: "Normal", grau: 0 };
    if (imc < 30) return { classificacao: "Sobrepeso", grau: 1 };
    if (imc < 40) return { classificacao: "Obesidade", grau: 2 };
    return { classificacao: "Obesidade Grave", grau: 3 };
  };

  const age = getAge(new Date(userData.birthDate));
  const imc = calculateIMC(userData.weight, userData.height);
  const imcClassification = getClassificacaoIMC(imc);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumo</Text>

        <View style={styles.summaryRow}>
          <FontAwesome5 name="weight" size={24} style={styles.iconStyle} />
          <Text style={styles.summaryText}>
            IMC: {imc} - {imcClassification.classificacao} (Grau{" "}
            {imcClassification.grau})
          </Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.labelT}>Cor</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            setSelectedRace(value);
            setUserData({ ...userData, race: value });
          }}
          items={availableRaces.map((race) => ({
            label: race.label,
            value: race.value,
          }))}
          style={pickerSelectStyles}
          value={selectedRace} // Use o estado selectedRace aqui
          placeholder={{ label: "Selecione uma cor...", value: null }}
        />
        <Text style={styles.labelT}>Tipo Sanguíneo</Text>
        <RNPickerSelect
          onValueChange={(value) => handleTextChange(value, "bloodType")}
          items={availableBloodTypes.map((bt) => ({ label: bt, value: bt }))}
          style={pickerSelectStyles}
          value={userData.bloodType}
          useNativeAndroidPickerStyle={false} // desativa o estilo nativo do picker no Android
        />

        <Text style={styles.labelT}>Altura</Text>
        <TextInput
          style={styles.input}
          value={userData.height}
          placeholder="Digite o valor em cm"
          onChangeText={(text) => handleTextChange(text, "height")}
        />
        <Text style={styles.labelT} >Peso(KG)</Text>
        <TextInput
          style={styles.input}
          value={userData.weight}
          placeholder="Digite o valor cm um '.'"
          onChangeText={(text) => handleTextChange(text, "weight")}
        />

        <View style={styles.bordas}>
          <Text style={styles.label}>Diabetes?</Text>
          <Switch
            value={userData.hasDiabetes}
            onValueChange={(value) => handleSwitchChange(value, "hasDiabetes")}
          />
        </View>


        <View style={styles.bordas}>
          <Text style={styles.label}>Pressão Alta?</Text>
          <Switch
            value={userData.hasHypertension}
            onValueChange={(value) =>
              handleSwitchChange(value, "hasHypertension")
            }
          />
        </View>


        <View style={styles.bordas}>
          <Text style={styles.label}>Teve Infarto?</Text>
          <Switch
            value={userData.hadHeartAttack}
            onValueChange={(value) => handleSwitchChange(value, "hadHeartAttack")}
          />
        </View>


        <View style={styles.bordas}>
          <Text style={styles.label}>Teve AVC?</Text>
          <Switch
            value={userData.hadStroke}
            onValueChange={(value) => handleSwitchChange(value, "hadStroke")}
          />
        </View>


        <View style={styles.bordas}>
          <Text style={styles.label}>Toma Medicamento Controlado?</Text>
          <Switch
            value={userData.takesControlledMedication}
            onValueChange={(value) =>
              handleSwitchChange(value, "takesControlledMedication")
            }
          />
        </View>


        <View style={styles.bordas}>
          <Text style={styles.label}>Doador de Órgãos?</Text>
          <Switch
            value={userData.isOrganDonor}
            onValueChange={(value) => handleSwitchChange(value, "isOrganDonor")}
          />
        </View>


        <View style={styles.btn}>
          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 10,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#65BF85",
    borderRadius: 10,
    color: "black",
    paddingRight: 30, // para garantir que o texto não fique escondido atrás do ícone
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  contentContainer: {
    alignItems: "center", // Agora isso é aplicado corretamente
    justifyContent: "center",
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "gray",
    marginTop: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    //marginTop: 20,
    paddingLeft: 10,
  },
  labelT: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,

  },
  input: {
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 5,
  },
  btn: {
    alignItems: "center",
  },
  button: {
    backgroundColor: "#00D315",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    borderRadius: 10,
    width: 280,
  },
  pickerContainer: {
    marginVertical: 20, // Adiciona espaço vertical
    width: "100%", // Ocupa toda a largura
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
  },
  picker: {
    height: 50, // Ajuste a altura conforme necessário
    width: "100%",
    // Outros estilos que você possa querer adicionar
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
  },
  calendarIcon: {
    width: 20,
    height: 20,
  },
  logoutButton: {
    backgroundColor: "red", // Cor do botão de logout
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "white", // Cor do texto dentro do botão de logout
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryContainer: {
    backgroundColor: "#E0FDEA",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
    marginTop: 50,

  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    marginBottom: 15,

  },
  summaryText: {
    fontSize: 18,
    marginLeft: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconStyle: {
    color: "#65BF85",
  },
  yes: {
    color: "green",
  },
  no: {
    color: "red",
  },
  bordas: {
    flexDirection: "row",
    marginVertical: 10, // Adiciona espaço vertical
    width: "100%", // Ocupa toda a largura
    height: 45,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#65BF85",
    paddingRight: 10,
  },
});

export default InfSaudeScreen;
