// LoginScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { auth } from "../config/firebaseConfig";
import Logo from "../components/Logo";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { MaterialIcons } from "@expo/vector-icons";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);





  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Solicitar permissões para mídia e notificações
      const { status: mediaLibraryStatus } =
        await MediaLibrary.requestPermissionsAsync();
      const { status: notificationsStatus } =
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });

      if (
        mediaLibraryStatus !== "granted" ||
        notificationsStatus !== "granted"
      ) {
        Alert.alert(
          "Permissão negada",
          "Algumas funcionalidades podem não estar disponíveis."
        );
      } else {
        navigation.navigate("Menu");
      }
    } catch (error) {
      Alert.alert("Erro no login", error.message);
    }
  };

  const handleGoToRegister = () => {
    navigation.navigate("Register");
  };

  const handlePasswordReset = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert(
          "Redefinição de senha",
          "Instruções enviadas para o seu e-mail."
        );
        setModalVisible(false);
      })
      .catch((error) => {
        Alert.alert("Erro ao redefinir senha", error.message);
      });
  };
  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Logo width={250} height={250} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />


        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={handleGoToRegister}
          >
            <Text style={styles.buttonText}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={styles.forgotPasswordText}
          onPress={() => setModalVisible(true)}
        >
          Esqueceu a senha?
        </Text>
      </View>

      {/* Modal para redefinição de senha */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Redefinir senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handlePasswordReset}
            >
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  container: {
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 30,
    paddingHorizontal: 20,
    fontSize: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    width: 150,
  },
  registerButton: {
    backgroundColor: "#4CAF50",
  },
  googleButtonContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#DB4437', 
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  
  iconContainer: {
    backgroundColor: 'white', // Círculo branco ao redor do ícone
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  
  icon: {
    width: 24,
    height: 24,
  },
  
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  forgotPasswordText: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
});

export default LoginScreen;
