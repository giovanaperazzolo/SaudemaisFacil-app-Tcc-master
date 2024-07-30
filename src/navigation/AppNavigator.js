//AppNavigator.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Button,
  FlatList,
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native"; // Importe useNavigation
import HomeScreen from "../screens/HomeScreen";
import PerfilScreen from "../screens/PerfilScreen";
import DCNTScreen from "../screens/DCNT/DCNT";
import MedicalPrescriptionScreen from "../screens/medicalPrescriptionScreen";
import InformationSaudeScreen from "../screens/InformationSaudeScreen";
import InfoSaudePGScreen from "../screens/InfoSaudePG";
import MedicationScreen from "../screens/Medicamento/MedicationScreen";
import DadosSaudeSaudeScreen from "../screens/InfSaudeScreen";
import LembretesScreen from "../screens/Lembretes/LembretesScreen";
import RelRemindersConsultationScreen from "./../screens/Lembretes/Consulta/RelRemindersConsultationScreen";
import HistoricoGlicemia from "../screens/DCNT/GlicemiaRellPersonalizado";
import HistoricoPressao from "../screens/DCNT/PressaoArterialRellPersonalizado";
import AuthNavigator from "./AuthNavigator";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome } from "@expo/vector-icons"; // ou qualquer outra biblioteca de ícones que preferir
import ChatbotScreen from "../Api/ChatbotScreen"; // Ajuste o caminho conforme necessário

import DoubtsScreen from "../Api/DoubtsScreen "; // Ajuste o caminho conforme necessário
import { db } from "../config/firebaseConfig"; // Ajuste o caminho conforme sua estrutura de projeto
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [modalVisible, setModalVisible] = useState(false);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState("");
  const auth = getAuth();
  const storage = getStorage();
  const navigation = useNavigation();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLembretesModalVisible, setLembretesModalVisible] = useState(false);
  const [lembretesPendentes, setLembretesPendentes] = useState([]);

  useEffect(() => {
    if (auth.currentUser) {
      const userImageRef = ref(
        storage,
        `profile_images/${auth.currentUser.uid}.jpg`
      );
      getDownloadURL(userImageRef)
        .then((url) => {
          setUserProfileImageUrl(url);
          Image.prefetch(url);
        })
        .catch(() => {
          setUserProfileImageUrl(
            Image.resolveAssetSource(
              require("../assets/perfil/profile-pic.jpg")
            ).uri
          );
        });
    }
  }, [auth.currentUser]);

  // Função para buscar lembretes pendentes
  const fetchReminders = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const remindersRef = collection(db, "remindersConsultation");
    const q = query(
      collection(db, "remindersConsultation"),
      where("ID_user", "==", user.uid),
      where("Status", "==", 0)
    );
    try {
      const querySnapshot = await getDocs(q);
      const reminders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLembretesPendentes(reminders);
      setPendingCount(reminders.length);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  };

  // Função para buscar lembretes pendentes
  const getPendingReminders = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const remindersRef = collection(db, "remindersConsultation");
    const q = query(
      collection(db, "remindersConsultation"),
      where("ID_user", "==", user.uid),
      where("Status", "==", 0)
    );
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      return [];
    }
  };

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      return;
    }

    const remindersRef = collection(db, "remindersConsultation");
    const q = query(
      remindersRef,
      where("ID_user", "==", auth.currentUser.uid),
      where("Status", "==", 0)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const updatedReminders = [];
        querySnapshot.forEach((doc) => {
          updatedReminders.push({ id: doc.id, ...doc.data() });
        });
        setLembretesPendentes(updatedReminders);
        setPendingCount(updatedReminders.length);
      },
      (error) => {
        console.error("Failed to fetch reminders due to an error: ", error);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [auth.currentUser]); // Depend on currentUser to re-subscribe when user logs in/out

  // Atualize a função para exibir o modal quando clicar no ícone de lembretes
  const handleLembretesClick = () => {
    setLembretesModalVisible(true);
  };
  useEffect(() => {
    fetchReminders();
  }, [auth.currentUser]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
        setModalVisible(false);
      })
      .catch((error) => {
        Alert.alert("Erro ao sair", error.message);
      });
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
    setModalVisible(false);
  };

  function BottomTabNavigator() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let userProfileImage =
              userProfileImageUrl ||
              Image.resolveAssetSource(
                require("../assets/perfil/profile-pic.jpg")
              ).uri;

            switch (route.name) {
              case "Home":
                iconName = focused ? "home" : "home-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Duvidas":
                iconName = focused ? "help-circle" : "help-circle-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Lembretes":
                iconName = focused ? "alarm" : "alarm-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Perfils":
                return (
                  <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Image
                      source={{ uri: userProfileImage }}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                      }}
                    />
                  </TouchableOpacity>
                );
              case "ChatBot-IA":
                iconName = focused ? "comments" : "comment";
                return (
                  <FontAwesome name={iconName} size={size} color={color} />
                );
            }
          },
          tabBarActiveTintColor: "green",
          tabBarInactiveTintColor: "gray",
          headerStyle: {
            backgroundColor: "#65BF85",
            height: 115,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 25,
          },
          headerRight: () => null,
          tabBarStyle: { paddingBottom: 45, height: 100 },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Lembretes"
          component={LembretesScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "alarm" : "alarm-outline"}
                size={size}
                color={color}
              />
            ),
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={handleLembretesClick}>
                {/* Adiciona ação para abrir a modal ou navegar para a tela de lembretes */}
              </TouchableOpacity>
            ),
          }}
        />

        <Tab.Screen name="ChatBot-IA" component={ChatbotScreen} />
        <Tab.Screen name="Duvidas" component={DoubtsScreen} />
        <Tab.Screen name="Perfils" component={View} />
      </Tab.Navigator>
    );
  }

  const RenderItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const handleComplete = async () => {
      const reminderRef = doc(db, "remindersConsultation", item.id);
      await updateDoc(reminderRef, { Status: 1 });
      setLembretesPendentes(
        lembretesPendentes.filter((reminder) => reminder.id !== item.id)
      );
      setExpanded(false);
    };

    const handleCancel = async () => {
      const reminderRef = doc(db, "remindersConsultation", item.id);
      await updateDoc(reminderRef, { Status: 2 });
      setLembretesPendentes(
        lembretesPendentes.filter((reminder) => reminder.id !== item.id)
      );
      setExpanded(false);
    };

    // Formatação da data e hora
    const formattedDate = new Date(item.date_time).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return (
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.listItemContainer}
      >
        <Text style={styles.listItemTitle}>
          Dr(a). {item.specialist} - {item.specialty}
        </Text>
        <Text style={styles.listItemDetail}>Local: {item.location}</Text>
        <Text style={styles.listItemDetail}>Data: {formattedDate}</Text>
        {expanded && (
          <View style={styles.buttonContainer}>
            <Button title="Concluir" onPress={handleComplete} />
            <Button title="Cancelar" onPress={handleCancel} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: "#65BF85",
            height: 150,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Dados Pessoais" component={PerfilScreen} />
        <Stack.Screen name="Pressão / Diabetes" component={DCNTScreen} />
        <Stack.Screen name="Receitas" component={MedicalPrescriptionScreen} />
        <Stack.Screen name="Perfil" component={InformationSaudeScreen} />
        <Stack.Screen name="Histórico" component={InfoSaudePGScreen} />
        <Stack.Screen name="Lembretes" component={LembretesScreen} />
        <Stack.Screen name="Medicamentos" component={MedicationScreen} />
        <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />

        <Stack.Screen name="Duvidas" component={DoubtsScreen} />
        <Stack.Screen name="Historico Glicemia" component={HistoricoGlicemia} />
        <Stack.Screen name="Historico Pressão Arterial" component={HistoricoPressao} />


        <Stack.Screen
          name="Informações Saúde"
          component={DadosSaudeSaudeScreen}
        />
        <Stack.Screen
          name="Consultas"
          component={RelRemindersConsultationScreen}
        />
      </Stack.Navigator>
      {/* Modal para logout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Escolha uma Opção</Text>
            <TouchableOpacity
              style={[styles.buttonStyle, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonStyle, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLembretesModalVisible}
        onRequestClose={() => setLembretesModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Lembretes Pendentes</Text>
            <FlatList
              data={lembretesPendentes}
              renderItem={({ item }) => <RenderItem item={item} />}
              keyExtractor={(item) => item.id.toString()}
              style={styles.flatListStyle}
            />
            <Button
              title="Fechar"
              onPress={() => setLembretesModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "flex-start",
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  listItemDetail: {
    fontSize: 14,
  },
  buttonStyle: {
    backgroundColor: "#65BF85",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
  logoutButton: {
    backgroundColor: "#ff6347",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  profilePicTAB: {
    width: 60,
    height: 60,
    borderRadius: 25,
    marginRight: 10,
  },
  profilePic: {
    width: 65,
    height: 65,
    borderRadius: 30,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  listItemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff", // Fundo branco para destacar os itens
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    borderRadius: 8,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff", // Azul para destaque
  },
  listItemDetail: {
    fontSize: 16,
    color: "#666", // Cinza para detalhes
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});
