// ReminderEditModalConsulta.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, auth, storage,app } from '../../../config/firebaseConfig';
import { collection, getDocs, updateDoc, doc,initializeFirestore  } from "firebase/firestore";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const ReminderEditModalConsulta = ({ isVisible, onClose, reminderToEdit }) => {
  const [typeConsultation, setTypeConsultation] = useState(reminderToEdit?.Type ?? "");
  const [warningHours, setWarningHours] = useState(reminderToEdit?.WarningHours?.toString() ?? "");
  const [date, setDate] = useState(new Date(reminderToEdit?.date_time ?? new Date()));
  const [specialist, setSpecialist] = useState(reminderToEdit?.specialist ?? "");
  const [specialty, setSpecialty] = useState(reminderToEdit?.specialty ?? "");
  const [typeOptions, setTypeOptions] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [location, setLocation] = useState(reminderToEdit?.location ?? "");

  
  const handleConfirmDate = (selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDatePickerVisibility(false);
  };

  const onSave = (data) => {
    try {
      // Suponha que essa função faça algo com 'data'
    
      // Mais operações...
    } catch (error) {
      
    }
  };
  
  

  useEffect(() => {

  if (isVisible) {
      const fetchTypeConsultation = async () => {
        const querySnapshot = await getDocs(collection(db, "TypeConsultation"));
        const fetchedTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTypeOptions(fetchedTypes);
      };
      fetchTypeConsultation();
    }
  
  }, [isVisible]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
    setTimePickerVisibility(false); // Esconde o TimePicker quando o DatePicker é mostrado
  };
  
  const showTimePicker = () => {
    if (date) {
      setTimePickerVisibility(true);
      setDatePickerVisibility(false); // Esconde o DatePicker quando o TimePicker é mostrado
    } else {
      alert("Por favor, escolha uma data primeiro.");
    }
  };



  const handleConfirmTime = (selectedTime) => {
    if (typeof warningHours === 'undefined') {
      console.error('Erro: warningHours está undefined');
      Alert.alert("Erro", "Horas de aviso está indefinido.");
      return;
    }
    setDate((currentDate) => {
      const newDate = selectedTime || new Date(currentDate);
      return new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        newDate.getHours(),
        newDate.getMinutes()
      );
    });
    setTimePickerVisibility(false);
  };
  
  const handleUpdate = async () => {
    // Verifique se todos os campos estão preenchidos
    if (!typeConsultation || !warningHours || !date || !location || !specialist || !specialty) {
      console.error('Erro: Algum campo está vazio ou indefinido');
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
  
    // Verificações adicionais para depuração
    if (typeof typeConsultation !== 'string' || typeof location !== 'string' || 
        typeof specialist !== 'string' || typeof specialty !== 'string') {
      console.error('Erro: Um dos campos esperados como string não é uma string');
      Alert.alert("Erro", "Erro interno nos dados.");
      return;
    }
  
    // Preparando os dados para atualização
    const updatedReminderData = {
      Type: typeConsultation,
      WarningHours: Number(warningHours) || 0,
      date_time: date.toISOString(),
      location: location,
      specialist: specialist,
      specialty: specialty,
      Status: 0  // Define o status como pendente ao atualizar
    };
  
    try {
      const docRef = doc(db, "remindersConsultation", reminderToEdit.id);
      await updateDoc(docRef, updatedReminderData);
      Alert.alert("Sucesso", "Lembrete atualizado com sucesso!");
      onClose(); // Fechando o modal após o salvamento
    } catch (error) {
      console.error("Erro ao atualizar lembrete: ", error);
      Alert.alert("Erro", "Não foi possível atualizar o lembrete: " + error.message);
    }
  };
  
  const formatDateDisplay = () => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
  <KeyboardAwareScrollView>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalTitle}>Editar Lembrete de Consulta</Text>
            <Picker
              selectedValue={typeConsultation}
              onValueChange={setTypeConsultation}
              style={styles.picker}
            >
              {typeOptions.map((option) => (
                <Picker.Item key={option.id} label={option.type} value={option.id} />
              ))}
            </Picker>
            <Button title="Escolher Data" onPress={() => setDatePickerVisibility(true)} />

<DateTimePickerModal
  isVisible={isDatePickerVisible}
  mode="date"
  onConfirm={handleConfirmDate}
  onCancel={() => setDatePickerVisibility(false)}
  date={date}
/>


<Button title="Escolher Hora" onPress={() => setTimePickerVisibility(true)} />
<DateTimePickerModal
  isVisible={isTimePickerVisible}
  mode="time"
  onConfirm={handleConfirmTime}
  onCancel={() => setTimePickerVisibility(false)}
  date={date}
/>

<Text style={styles.dateDisplay}>{formatDateDisplay()}</Text>

            <TextInput
              placeholder="Horas de avisos"
              value={warningHours}
              onChangeText={setWarningHours}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Local"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            <TextInput
              placeholder="Especialista"
              value={specialist}
              onChangeText={setSpecialist}
              style={styles.input}
            />
            <TextInput
              placeholder="Especialidade"
              value={specialty}
              onChangeText={setSpecialty}
              style={styles.input}
            />
            <TouchableOpacity style={styles.buttonSalvar} onPress={handleUpdate}>
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
    padding: 10,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: "#333",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardDetail: {
    fontSize: 15,
    color: "#666",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconSpacing: {
    marginRight: 16,
  },
  scrollViewContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 30,
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
    marginBottom: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    width: "80%",
    marginBottom: 20,
  },

  input: {
    width: "80%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
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
    borderRadius: 5,
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
  label: {
    alignSelf: "flex-start",
    marginLeft: 1,
    marginVertical: -0,
    marginTop: 30,
    fontSize: 22,
  },
  dateDisplay: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default ReminderEditModalConsulta;
