// RemindersConsultationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Button,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Notifications from "expo-notifications";

const initialState = {
  typeConsultation: { id: "", name: "" },
  warningHours: "",
  location: "",
  specialist: "",
  specialty: "",
  date: new Date(),
  isDatePickerVisible: false,
  isTimePickerVisible: false,
  typeOptions: [],
  keyboardPadding: 0,
};

const RemindersConsultationScreen = ({ isVisible, onClose }) => {
  const [state, setState] = useState(initialState);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (isVisible) {
      fetchTypeConsultation();
    }
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) =>
        setState((prev) => ({
          ...prev,
          keyboardPadding: e.endCoordinates.height,
        }))
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setState((prev) => ({ ...prev, keyboardPadding: 0 }))
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isVisible]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notificação recebida:", notification);
      }
    );

    return () => subscription.remove();
  }, []);

  const fetchTypeConsultation = async () => {
    const querySnapshot = await getDocs(collection(db, "TypeConsultation"));
    const fetchedTypes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().type, // Certifique-se de que 'name' é o campo correto no seu documento
    }));
    setState((prev) => ({ ...prev, typeOptions: fetchedTypes }));
  };

  const handleConfirmDate = (selectedDate) => {
    const currentDate = selectedDate || state.date;
    setState((prev) => ({
      ...prev,
      date: currentDate,
      isDatePickerVisible: false,
    }));
  };

  const handleConfirmTime = (selectedTime) => {
    const newDate = new Date(state.date);
    newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    setState((prev) => ({
      ...prev,
      date: newDate,
      isTimePickerVisible: false,
    }));
  };

  const handleSaveReminder = async () => {
    if (!user) {
      alert("Usuário não está logado.");
      return;
    }

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      const newPermission = await Notifications.requestPermissionsAsync();
      if (!newPermission.granted) {
        alert(
          "Permissão de notificação negada. O lembrete não poderá ser notificado."
        );
        return;
      }
    }

    const formattedDateTime = state.date.toISOString();
    try {
      const deviceToken = await Notifications.getExpoPushTokenAsync();
      await addDoc(collection(db, "remindersConsultation"), {
        ID_user: user.uid,
        Type: state.typeConsultation.id,
        TypeName: state.typeConsultation.name,
        date_time: formattedDateTime,
        location: state.location,
        specialist: state.specialist,
        specialty: state.specialty,
        WarningHours: Number(state.warningHours),
        Status: 0,
        deviceToken: deviceToken,
      });

      // Agendar a notificação com a antecedência configurada
      const notificationTime = new Date(formattedDateTime);
      notificationTime.setHours(
        notificationTime.getHours() - state.warningHours
      );

      if (notificationTime > new Date()) {
        const scheduledNotification =
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Lembrete de Consulta",
              body: `Sua consulta com ${state.specialist} em ${
                state.location
              } está agendada para ${formatDateDisplay(notificationTime)}`,
              sound: "default",
            },
            trigger: notificationTime,
          });

        console.log("Notificação agendada:", scheduledNotification);
        alert("Lembrete salvo e notificação agendada com sucesso!");
      } else {
        alert(
          "A data e hora do lembrete já passaram, ajuste para um momento futuro."
        );
      }

      resetForm(); // Função para resetar o formulário
      onClose(); // Fechando o modal após o salvamento
    } catch (error) {
      console.error("Erro ao salvar lembrete: ", error);
      alert("Erro ao salvar lembrete.");
    }
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const resetForm = () => {
    setState({
      ...initialState,
      date: new Date(), // Mantém a data atualizada
      typeOptions: state.typeOptions, // Mantém as opções carregadas para tipo de consulta
    });
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAwareScrollView extraScrollHeight={20}>
        <View style={styles.modalView}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: state.keyboardPadding }}
          >
            <Text style={styles.modalTitle}>Adicionar Novo Lembrete</Text>
            <Picker
              selectedValue={state.typeConsultation.id}
              onValueChange={(itemValue) => {
                const selectedType = state.typeOptions.find(
                  (option) => option.id === itemValue
                );
                setState((prev) => ({
                  ...prev,
                  typeConsultation: { id: itemValue, name: selectedType.name },
                }));
              }}
              style={styles.picker}
            >
              {state.typeOptions.map((option) => (
                <Picker.Item
                  key={option.id}
                  label={option.name}
                  value={option.id}
                />
              ))}
            </Picker>
            <Button
              title="Escolher Data"
              onPress={() =>
                setState((prev) => ({ ...prev, isDatePickerVisible: true }))
              }
            />
            <Button
              title="Escolher Hora"
              onPress={() =>
                setState((prev) => ({ ...prev, isTimePickerVisible: true }))
              }
            />
            <Text style={styles.dateDisplay}>
              {formatDateDisplay(state.date)}
            </Text>
            <DateTimePickerModal
              isVisible={state.isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={() =>
                setState((prev) => ({ ...prev, isDatePickerVisible: false }))
              }
              date={state.date}
            />
            <DateTimePickerModal
              isVisible={state.isTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmTime}
              onCancel={() =>
                setState((prev) => ({ ...prev, isTimePickerVisible: false }))
              }
              date={state.date}
            />
            <TextInput
              placeholder="Horas de aviso"
              value={state.warningHours.toString()}
              onChangeText={(text) =>
                setState((prev) => ({ ...prev, warningHours: Number(text) }))
              }
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Local"
              value={state.location}
              onChangeText={(text) =>
                setState((prev) => ({ ...prev, location: text }))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Doutor(a)"
              value={state.specialist}
              onChangeText={(text) =>
                setState((prev) => ({ ...prev, specialist: text }))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Especialidade"
              value={state.specialty}
              onChangeText={(text) =>
                setState((prev) => ({ ...prev, specialty: text }))
              }
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.buttonSalvar}
              onPress={handleSaveReminder}
            >
              <Text style={styles.buttonTextSalvar}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
              <Text style={styles.buttonTextClose}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dateDisplay: {
    fontSize: 16,
    color: "#333",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
  },
  modalView: {
    margin: 26,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
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
    marginBottom: -40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    width: "100%",
    marginBottom: -20,
  },

  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  buttonSalvar: {
    backgroundColor: "#34A853",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: "100%",
    marginTop: 10,
  },
  buttonTextSalvar: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  buttonClose: {
    backgroundColor: "#D32F2F",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: "100%",
    marginTop: 10,
  },
  buttonTextClose: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  dateTimeWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20, // Espaçamento vertical entre este elemento e os outros
    width: "100%", // Ocupa toda a largura disponível
  },
  dateTimeContainer: {
    alignItems: "center",
    flex: 1, // Faz com que cada container ocupe metade da largura disponível
  },
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10, // Espaçamento entre o botão e o texto
  },
  dateTimeText: {
    color: "#007bff",
    fontSize: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default RemindersConsultationScreen;
