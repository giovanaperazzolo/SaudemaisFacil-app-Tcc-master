// PerfilScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const calendarIcon = require("../assets/icones/calendario.png");

const auth = getAuth();
const PerfilScreen = (props) => {
  const [userData, setUserData] = useState({
    fullName: "",
    birthDate: new Date(),
    email: "",
    phoneNumber: "",
    profileImageUrl: "",
  });
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Função para mostrar o DateTimePicker
  const showDatePicker = () => {
    setIsDatePickerVisible(true);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        console.log("Nenhum usuário autenticado.");
      }
    });

    return unsubscribeAuth;
  }, []);
  useEffect(() => {
    // Esta função busca o perfil do usuário
    const fetchUserProfile = async (uid) => {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let data = docSnap.data();
        let formattedDate = data.birthDate
          ? new Date(data.birthDate.seconds * 1000)
          : new Date();
        setUserData({
          ...data,
          birthDate: formattedDate,
          email: auth.currentUser?.email || "",
        });
        setDate(formattedDate);
      } else {
        console.log("No such document!");
      }
    };

    if (auth.currentUser) {
      fetchUserProfile(auth.currentUser.uid);
    }
  }, [auth.currentUser]);

  const fetchBloodTypes = async () => {
    setAvailableBloodTypes(["A+", "A-", "O-", "B+", "AB+", "AB-", "O+", "B-"]);
  };

  const fetchUserProfile = async (uid) => {
    const userRef = doc(db, "users", uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userProfileData = userSnap.data();

        // Converter Timestamp do Firestore para objeto Date
        const birthDate = userProfileData.birthDate.toDate
          ? userProfileData.birthDate.toDate()
          : new Date();

        // Atualizar o estado com os dados do usuário
        setUserData({
          ...userProfileData, // Incorpora todos os dados recuperados
          birthDate: birthDate, // Armazenar como objeto Date
        });

        setDate(birthDate); // Atualizar o estado da data para a UI do DatePicker
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
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      Alert.alert("Erro", "ID do usuário não definido.");
      return;
    }

    setIsSaving(true);

    try {
      // Aqui você precisa converter o objeto Date para um Timestamp antes de atualizar
      const birthDateTimestamp = Timestamp.fromDate(userData.birthDate);

      await updateDoc(doc(db, "users", userId), {
        fullName: userData.fullName,
        // Certifique-se de passar o objeto Timestamp aqui
        birthDate: birthDateTimestamp,
        phoneNumber: userData.phoneNumber,
      });

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Falha ao salvar o perfil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setDate(selectedDate);
      setUserData({ ...userData, birthDate: selectedDate });
    }
  };

  // Substitua 'default_avatar.png' pelo caminho para a sua imagem padrão
  const defaultAvatar = Image.resolveAssetSource(
    require("../assets/perfil/profile-pic.svg")
  ).uri;

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    // Verifique se a seleção não foi cancelada e se a matriz 'assets' está presente
    if (!result.canceled && result.assets) {
      // Supondo que só haja uma imagem selecionada, pegue o primeiro item da matriz 'assets'
      const image = result.assets[0];

      // Agora você pode usar 'image.uri' para acessar o URI da imagem selecionada
      if (image.uri) {
        uploadImage(image.uri);
      }
    }
  };

  const uploadImage = async (uri) => {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      console.error("Não foi possível encontrar o ID do usuário.");
      return;
    }
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(getStorage(), `profile_images/${userId}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      setUserData({ ...userData, profileImageUrl: downloadUrl });

      // Atualizar o perfil do usuário no Firestore com a nova URL da imagem
      await updateDoc(doc(db, "users", userId), {
        profileImageUrl: downloadUrl,
      });

      Alert.alert("Imagem do perfil atualizada com sucesso.");
    } catch (e) {
      console.error("Erro ao fazer upload da imagem: ", e);
      Alert.alert("Erro ao atualizar a imagem do perfil", e.message);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Deslogou com sucesso, redirecione para a tela de login
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }], // O nome 'Login' deve corresponder ao nome da rota definida no Stack.Navigator
        });
      })
      .catch((error) => {
        // Houve um erro no logout
        Alert.alert("Erro ao sair", error.message);
      });
  };

  const updateBirthDate = async (userId, date) => {
    try {
      // Cria um Timestamp a partir da data
      const birthDate = Timestamp.fromDate(date); // Use o objeto Timestamp importado

      // Atualiza a coleção de usuários com a nova data de nascimento
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        birthDate: birthDate, // Utiliza o Timestamp
      });
      Alert.alert(
        "Data de Nascimento",
        "Data de nascimento atualizada com sucesso."
      );
    } catch (error) {
      console.error("Erro ao atualizar a data de nascimento:", error);
      Alert.alert("Erro", "Não foi possível atualizar a data de nascimento.");
    }
  };

  const handleConfirmDate = async (date) => {
    try {
      // Atualiza o estado da data de nascimento
      setUserData({ ...userData, birthDate: date });
      setIsDatePickerVisible(false);
      // Chama a função de atualização de data de nascimento
      await updateBirthDate(auth.currentUser.uid, date);
    } catch (error) {
      console.error("Erro ao confirmar data de nascimento:", error);
      Alert.alert(
        "Erro",
        "Não foi possível atualizar a data de nascimento: " + error.message
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={styles.profileImageContainer}
        onPress={handleImagePick}
      >
        <Image
          style={styles.profileImage}
          source={{ uri: userData.profileImageUrl || defaultAvatar }}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={userData.fullName}
          onChangeText={(text) => setUserData({ ...userData, fullName: text })}
        />
        <Text style={styles.label}>Data de Nascimento</Text>
        <TouchableOpacity
          style={styles.datePickerInput}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Text style={styles.datePickerText}>
            {userData.birthDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setUserData({ ...userData, birthDate: date });
            setIsDatePickerVisible(false);
          }}
          onCancel={() => setIsDatePickerVisible(false)}
          date={userData.birthDate}
        />
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={auth.currentUser ? auth.currentUser.email : ""}
          editable={false} // Isso torna o campo de e-mail não editável
        />
        <Text style={styles.label}>Telefone de Contato</Text>
        <TextInput
          style={styles.input}
          value={userData.phoneNumber}
          onChangeText={(text) =>
            setUserData({ ...userData, phoneNumber: text })
          }
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
    borderColor: "gray",
    borderRadius: 10,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
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
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#00D315",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    borderRadius: 10,
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
    borderColor: "#65BF85",
    borderRadius: 10,
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
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "black", // Cor do texto dentro do botão de logout
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PerfilScreen;
