//RelRemindersConsultationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from "react-native";
import { db } from "../../../config/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";
import moment from "moment";
import { getAuth } from "firebase/auth";
import ReminderEditModalConsulta from './ReminderEditModalConsulta';

const RelRemindersConsultationScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentReminderToEdit, setCurrentReminderToEdit] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReminders, setPendingReminders] = useState([]);
const [completedReminders, setCompletedReminders] = useState([]);
const [cancelledReminders, setCancelledReminders] = useState([]);


  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(user => {
      if (user) fetchReminders();
    });
    return () => unsubscribe();
  }, []);

  const fetchReminders = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("Nenhum usuário autenticado.");
      return;
    }
  
    const remindersQuery = query(
      collection(db, "remindersConsultation"),
      where("ID_user", "==", user.uid),
      orderBy("date_time", "asc")
    );
    
    const querySnapshot = await getDocs(remindersQuery);
    const allReminders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedDate: moment(doc.data().date_time).format("DD/MM/YYYY"),
      formattedTime: moment(doc.data().date_time).format("HH:mm"),
      // Certifique-se de que Status está sendo lido como número, caso esteja armazenado como string
      Status: Number(doc.data().Status)
    }));
  
    // Não há necessidade de definir estados separados para pendentes, concluídas e canceladas
    // Em vez disso, vamos organizar os dados em seções para serem usados diretamente com SectionList
    const sections = [
      { title: 'Pendentes', data: allReminders.filter(reminder => reminder.Status === 0) },
      { title: 'Concluídas', data: allReminders.filter(reminder => reminder.Status === 1) },
      { title: 'Canceladas', data: allReminders.filter(reminder => reminder.Status === 2) }
    ];
  
    setReminders(sections);
  };
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders().finally(() => setRefreshing(false));
  };

  const statusStyles = {
    0: { color: 'gray', label: 'Pendente' },
    1: { color: 'green', label: 'Concluída' },
    2: { color: 'red', label: 'Cancelada' },
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const newReminders = reminders.map(reminder => {
        if (reminder.id === id) {
          return { ...reminder, Status: newStatus }; // Update local state
        }
        return reminder;
      });
      setReminders(newReminders); // Set the updated reminders array
  
      await updateDoc(doc(db, "remindersConsultation", id), { Status: newStatus });
      onRefresh();
    } catch (error) {
      console.error("Error updating reminder status:", error);
      // If update fails, revert local state or fetch again
      fetchReminders();
    }
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const openEditModal = (reminder) => {
    setCurrentReminderToEdit(reminder);
    setIsEditModalVisible(true);
    onRefresh();
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "remindersConsultation", id));
      setReminders(reminders.filter(reminder => reminder.id !== id));
      onRefresh(); 
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const renderItem = ({ item }) => {
    const statusInfo = statusStyles[item.Status] || statusStyles[0];
    const isCompleted = item.status === 1;
    const isCancelled = item.status === 2;
  
    return (
      <View style={[styles.card, item.Status > 0 ? styles.cardDisabled : null]}>
        <View style={styles.cardInfo}>
          {/* Detalhes da consulta e ícones */}
          <View style={styles.cardDetailsAndIcons}>
            <View style={styles.cardTextDetails}>
              <Text style={styles.cardTitle}>Dr(a). {item.specialist} - {item.specialty}</Text>
              <Text style={styles.cardDetail}>Data: {item.formattedDate}</Text>
              <Text style={styles.cardDetail}>Hora: {item.formattedTime}</Text>
              <Text style={styles.cardDetail}>Local: {item.location}</Text>
              <Text style={styles.cardDetail}>Aviso: {item.WarningHours} horas antes</Text>
              <Text style={styles.typeConsultation}>{item.TypeName}</Text>
              <Text style={[styles.statusLabel, { color: statusInfo.color, fontWeight: 'bold', fontSize: 16 }]}>{statusInfo.label}</Text>
            </View>
            <View style={styles.icons}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Icon name="edit" size={22} color="blue" style={styles.iconSpacing} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Icon name="trash" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Botões de ação para status */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => handleUpdateStatus(item.id, 2)} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Consulta Cancelada</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUpdateStatus(item.id, 1)} style={styles.completeButton}>
              <Text style={styles.buttonText}>Consulta Realizada</Text>
            </TouchableOpacity>
          </View>
      
        </View>
        {/* Indicativo visual de status */}
        {item.Status === 1 && <View style={styles.strikeThroughReto} />}
      {item.Status === 2 && (
        <>
          <View style={styles.strikeThrough} />
          <View style={styles.strikeThroughX} />
        </>
      )}
      </View>
    );
  };
  

  return (
  <View style={styles.container}>
    <SectionList
      sections={reminders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
    {isEditModalVisible && (
      <ReminderEditModalConsulta
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        reminderToEdit={currentReminderToEdit}
        onSave={handleUpdateStatus}
      />
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconSpacing: {
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardDetail: {
    fontSize: 15,
    color: "#666",
  },
  cardDetailsAndIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextDetails: {
    flex: 1,
  },
  typeConsultation: {
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginTop: 5,
  },

  completeButton: {
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 5,
    margin: 5,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cardDisabled: {
    opacity: 0.4,
  },
  strikeThrough: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: '100%',
    height: 2,
    backgroundColor: 'black',
  },
  statusLabel: {
    fontWeight: 'bold',
    fontSize: 16, // ou qualquer tamanho que você achar adequado
    // fontFamily: 'SuaFontePersonalizada', // descomente se tiver uma fonte personalizada
    marginTop: 4, // algum espaço acima do texto, se necessário
  },
  strikeThroughReto: {
    position: 'absolute',
    left: '5%', // Ajuste para posicionar a linha horizontal mais centralizada
    top: '50%',
    width: '100%', // Diminuição da largura para manter dentro do cartão
    height: 2,
    backgroundColor: 'black',
    transform: [{ rotate: '0deg' }], // Sem rotação para a linha horizontal
  },
  strikeThrough: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: 'black',
    transform: [{ rotate: '45deg' }],
  },
  strikeThroughX: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: 'black',
    transform: [{ rotate: '-45deg' }],
  },
});
export default RelRemindersConsultationScreen;
