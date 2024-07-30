import React, { useState } from "react";
import {
  View,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  Button,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { auth, db } from "../config/firebaseConfig"; // Ajuste o caminho conforme necessário
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import Logo from "../components/Logo";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const RegisterScreen = () => {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Função para lidar com a confirmação da data
  const handleConfirmDate = (date) => {
    setBirthDate(date);
    setIsDatePickerVisible(false); // Fecha o DatePicker após a seleção
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user).then(() => {
          Alert.alert(
            "Verifique seu e-mail",
            "Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada."
          );
          // Limpa os campos
          setFullName("");
          setBirthDate(new Date());
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setShowDatePicker(false);
          // Navega de volta para a tela de login
          navigation.navigate("Login");
        });
        // Converta Date para Timestamp do Firebase
        const birthDateTimestamp = Timestamp.fromDate(birthDate);
        // Salve os dados do usuário no Firestore
        setDoc(doc(db, "users", userCredential.user.uid), {
          fullName,
          birthDate: birthDateTimestamp, // Use o Timestamp
          // ... outros dados
        }).then(() => {
          // ... sucesso no cadastro
        });
      })
      .catch((error) => {
        // ... tratamento de erros
      });
  };

  // Função para atualizar a data de nascimento e fechar o DatePicker
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === "ios");
    setBirthDate(currentDate);
  };
  const renderDatePicker = () => (
    <View>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.button}
      >
        <Text style={styles.label}>Data de Nascimento</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setIsDatePickerVisible(false)}
          date={birthDate}
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>
          <Logo width={200} height={200} />
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
          />
          <Text style={styles.label}>Data de Nascimento</Text>
          <TouchableOpacity
            style={styles.datePickerInput}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Text style={styles.datePickerText}>
              {birthDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setIsDatePickerVisible(false)}
            date={birthDate || new Date()} // Usa a data de nascimento atual ou a data atual como fallback
          />
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Confirme a Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Confirme a Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f7f7", // Cor de fundo da tela
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 12,
    // Ajustes para centralizar e aumentar o botão
    alignSelf: "center", // Centraliza o botão horizontalmente
    width: "80%", // Aumenta a largura do botão
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  datePickerButton: {
    // Estilos para o botão do DatePicker
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#28a745", // Cor verde, você pode ajustar conforme necessário
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "center", // Centraliza o botão horizontalmente
    width: "80%", // Aumenta a largura do botão
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
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
});

export default RegisterScreen;
