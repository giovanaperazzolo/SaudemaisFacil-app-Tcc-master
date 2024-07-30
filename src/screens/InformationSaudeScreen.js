//InformationSaudeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,  // Importar o RefreshControl
} from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig"; // Certifique-se de que está importando corretamente
import { useNavigation } from "@react-navigation/native";

const defaultProfileImage = require("../assets/perfil/profile-pic.jpg");

// Função para classificar a faixa etária com base na idade
function getClassificationByAge(age) {
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
}

const InformationSaudeScreen = () => {
  const [userData, setUserData] = useState(null);
  const auth = getAuth(); // Instância do Auth
  const [refreshing, setRefreshing] = useState(false); // Estado para controlar o refresh

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();  // Chama a função para recarregar os dados
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const birthDate = data.birthDate.toDate();
        const age = getAge(birthDate);
        const classification = getClassificationByAge(age);
        setUserData({
          ...data,
          birthDate: birthDate.toLocaleDateString("pt-BR"),
          age,
          classification,
        });
      } else {
        console.log("Usuário não encontrado");
      }
    }
  };


  // Função para calcular a idade com base na data de nascimento
  function getAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }


  // Usaremos o gancho de navegação para lidar com a navegação entre telas
  const navigation = useNavigation();

  // Adicione funções para lidar com a navegação quando os botões são pressionados
  const handlePResumoPG = () => {
    navigation.navigate("Histórico");
  };

  // Adicione funções para lidar com a navegação quando os botões são pressionados
  const handlePressInfoSaude = () => {
    navigation.navigate("Informações Saúde");
  };
  const handlePressMedicamentos = () => {
    navigation.navigate("Medicamentos");
  };

  const handlePressDadosPessoais = () => {
    navigation.navigate("Dados Pessoais");
  };

  const handlePressDuvidas = () => {
    navigation.navigate("Duvidas");
  };


  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
       <View style={styles.profileHeader}>
        <Image
          style={styles.profileImage}
          source={
            userData?.profileImageUrl
              ? { uri: userData.profileImageUrl }
              : defaultProfileImage
          }
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {userData?.fullName || "Nome do Usuário"}
          </Text>
          <Text style={styles.profileBirthDate}>
            {userData?.birthDate || "Data Nascimento"} -{" "}
            {userData?.age ? `${userData.age} anos` : ""} (
            {userData?.classification})
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handlePressInfoSaude}>
        <Text style={styles.buttonText}>Informações de Saúde</Text>
      </TouchableOpacity>

  

      <TouchableOpacity style={styles.button} onPress={handlePressMedicamentos}>
        <Text style={styles.buttonText}>Medicamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePressDadosPessoais}
      >
        <Text style={styles.buttonText}>Dados Pessoais</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePressDuvidas}
      >
        <Text style={styles.buttonText}>Perguntas/Duvidas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centraliza horizontalmente
    marginVertical: 20, // Espaço vertical para separar da parte superior
  },
  profileImage: {
    width: 120, // Tamanho maior para a imagem
    height: 120, // Tamanho maior para a imagem
    borderRadius: 60, // Arredonda a imagem para formar um círculo
    marginRight: 20, // Espaço entre a imagem e o texto
  },
  profileInfo: {
    justifyContent: "center", // Centraliza verticalmente o texto
    // Não é necessário marginLeft aqui, pois o marginRight na imagem já cria espaço
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileBirthDate: {
    fontSize: 16,
  },
  menu: {
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#fff",
    width: 350,
    padding: 23,
    margin: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#65BF85",
  },
  buttonText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 16,
  },
  profileImageContainer: {
    // Ajustar conforme o layout desejado
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center", // Centraliza o container da imagem
    marginTop: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc", // ou outra cor de sua preferência
  },
  infoContainer: {
    paddingHorizontal: 20,
    alignItems: "center", // Centralizar os itens no eixo horizontal
  },
  label: {
    // Estilo para os textos do label
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  healthInfo: {
    fontSize: 16,
    color: "#333",
    marginTop: 4, // Ajuste o valor conforme necessário para o espaçamento
  },
});

export default InformationSaudeScreen;
