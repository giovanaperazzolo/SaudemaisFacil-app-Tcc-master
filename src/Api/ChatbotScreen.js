import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Collapsible from 'react-native-collapsible';
import Markdown from 'react-native-markdown-display';

const ChatbotScreen = () => {
  const [input, setInput] = useState('');
  const [latestMessage, setLatestMessage] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "generate"), where("response", "!=", null), orderBy("createTime", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (data.length > 0) {
        setLatestMessage(data[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  const sendPrompt = async () => {
    if (input.trim() === '') return;
    await addDoc(collection(db, "generate"), {
      prompt: input,
      createTime: new Date()
    });
    setInput('');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <ScrollView>

    <KeyboardAwareScrollView style={{ flex: 1 }} resetScrollToCoords={{ x: 0, y: 0 }} contentContainerStyle={styles.container}>
      <View style={styles.introContainer}>
        <Text style={styles.introHeader}>Bem-vindo ao Chatbot IA do Saúde+Facil!</Text>
        <Text style={styles.introText}>
          Este chatbot está aqui para ajudar com dúvidas sobre <Text style={styles.boldText}>conceitos médicos</Text> e 
          informações relacionadas ao uso do aplicativo. Faça perguntas como:
        </Text>
        <Text style={styles.exampleQuestion}>
          - "O que é uma receita genérica amarela?"
        </Text>
        <Text style={styles.exampleQuestion}>
          - "O que significa concentração de um medicamento?"
        </Text>
        <Text style={styles.exampleQuestion}>
          - "Quais são os valores considerados altos para pressão arterial e glicose?"
        </Text>
        <Text style={styles.introText}>
          Para questões sobre <Text style={styles.boldText}>funcionalidades específicas</Text> do aplicativo, como criar lembretes ou atualizar informações, 
          por favor, acesse <Text style={styles.italicText}>Perfil -{'>'} Dúvidas</Text>.
        </Text>
      </View>
      <Text style={styles.label}>Escreva sua Pergunta:</Text>
      <TextInput
        style={styles.input}
        onChangeText={setInput}
        value={input}
        placeholder="Digite sua mensagem..."
      />
      <TouchableOpacity style={styles.button} onPress={sendPrompt}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
      {latestMessage && (
        <View style={styles.responseContainer}>
          <ScrollView style={styles.responseContainer}>
          <TouchableOpacity style={styles.questionButton} onPress={toggleCollapse}>
            <Text style={styles.messageText}>Última pergunta: {latestMessage.prompt}</Text>
          </TouchableOpacity>
          <Collapsible collapsed={isCollapsed}>
            <Markdown style={markdownStyles}>
              {latestMessage.response || 'Aguardando resposta...'}
            </Markdown>
          </Collapsible>
          </ScrollView>
        </View>
      )}
    </KeyboardAwareScrollView>
     </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  introContainer: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20, // Espaçamento entre o container e o label
  },
  introHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  exampleQuestion: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    color: '#2e7d32',
    alignSelf: 'flex-start'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    width: '100%'
  },
  button: {
    backgroundColor: '#5e8d5a',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  markdownStyles: {
    text: {
      fontSize: 16
    },
    strong: {
      fontWeight: 'bold'
    }
  },
  messageBox: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5
  },
  messageText: {
    fontSize: 16
  },
  responseContainer: {
    flex: 1,
    paddingVertical: 10
  },
  
});

const markdownStyles = {
  text: {
    fontSize: 16
  },
  strong: {
    fontWeight: 'bold'
  }
};

export default ChatbotScreen;