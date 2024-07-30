import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { FontAwesome5 } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

const DoubtsScreen = () => {
  const [activeSection, setActiveSection] = useState(null);

  const doubts = [
    {
      id: '1',
      prompt: 'Como criar um lembrete no App?',
      ask: `### Como Criar um Lembrete no Aplicativo Saúde+Facil 📅\n\nCriar lembretes no Saúde+Facil é um processo **simples e intuitivo**. Siga os passos abaixo para configurar lembretes de medicamentos ou consultas médicas.\n\n#### Acessando a Tela de Lembretes\n1. **Abra o Aplicativo:** Inicie o aplicativo no seu dispositivo móvel.\n2. **Ícone de Lembretes:** Na tela inicial, localize e toque no ícone 📆 **Lembretes**. Este ícone geralmente está visível na parte inferior ou superior da tela inicial, dependendo do layout do aplicativo.\n\n#### Criando um Novo Lembrete\n##### Para Medicamentos\n3. **Escolha o Tipo de Lembrete:** Você verá duas opções - **Medicamentos** e **Consultas**. Toque em **Medicamentos** para prosseguir.\n4. **Registrar ou Visualizar:**\n   - Toque em **Registrar** para adicionar um novo lembrete de medicamento.\n   - Se desejar ver lembretes existentes, toque em **Visualizar**.\n\n##### Para Consultas\n5. **Escolha o Tipo de Lembrete:** Se quiser criar um lembrete para uma consulta médica, toque em **Consultas**.\n6. **Modal de Registro:**\n   - Toque em **Registrar** para abrir o modal onde você pode inserir os detalhes da consulta.\n   - Preencha os campos necessários como data, hora, especialista, e localização da consulta.\n\n#### Detalhes Importantes para o Lembrete\n7. **Definindo Detalhes:**\n   - **Data e Hora:** Escolha a data e a hora da consulta ou quando tomar o medicamento.\n   - **Notificações:** Configure um aviso prévio para que o aplicativo notifique você, por exemplo, 1 hora antes do evento.\n\n#### Salvando o Lembrete\n8. **Salvar:** Após preencher todos os campos necessários, toque no botão 💾 **Salvar** para confirmar o lembrete.\n9. **Confirmação:** Você receberá uma notificação pop-up confirmando que o lembrete foi salvo com sucesso.`
    },
    {
        id: '2',
        prompt: 'Como se Armazena e visualiza uma receita médica?',
        ask: `
  ### Como Armazenar e Visualizar Receitas Médicas no Saúde+Facil 📄
  
  **Armazenar e acessar receitas médicas no Saúde+Facil é rápido e seguro. Aqui está como você pode fazer isso passo a passo:**
  
  #### 🔒 **Armazenamento de Receitas Médicas**
  1. **Acesso à Seção de Receitas:** No menu principal, selecione a opção de receitas médicas.
  2. **Adicionar Nova Receita:** Toque no botão 'Adicionar' para começar a inserir uma nova receita.
     - **Capturar Imagem:** Utilize a câmera do seu dispositivo para tirar uma foto da receita. 📸
     - **Upload de Imagem:** Se a receita já estiver salva no seu dispositivo, você pode escolher a imagem diretamente da galeria. 🖼️
  3. **Preencher Informações da Receita:** Inclua detalhes como o nome do medicamento, dosagem e a data da prescrição.
  4. **Salvar Informações:** Confirme os dados e salve a receita no seu perfil. O ícone de salvar 📥 aparecerá na tela.
  
  #### 🔎 **Visualizando Receitas Armazenadas**
  1. **Navegar pelas Receitas Salvas:** Volte à seção de receitas para ver todas as receitas armazenadas.
  2. **Detalhes da Receita:** Selecione uma receita para ver todos os detalhes e a imagem em tamanho maior.
  3. **Opções de Gerenciamento:**
     - **Editar:** Altere informações da receita se necessário. ✏️
     - **Excluir:** Remova receitas que não são mais necessárias. 🗑️
  
  **Dica de Segurança:** Todas as suas receitas são armazenadas com criptografia completa para garantir sua privacidade e segurança.
  
  _Aproveite o Saúde+Facil para manter suas prescrições organizadas e acessíveis de forma segura e eficiente!_ '🌟
  `
      },
      {
        id: '3',
        prompt: 'Como atualizar seus dados de saúde e pessoal no App?',
        ask: `### Como Atualizar Seus Dados de Saúde e Pessoais no Aplicativo Saúde+Facil 🔄\n\n**Atualizar seus dados no Saúde+Facil é um processo simples e seguro. Siga estes passos para manter seu perfil sempre atualizado:**\n\n#### 📝 **Atualização de Dados Pessoais**\n1. **Acesso à Tela de Dados Pessoais:** A partir do menu principal, selecione 'Perfil' para acessar seus dados pessoais.\n2. **Editar Informações Pessoais:** Toque no ícone de edição 🖊 para modificar seu nome, data de nascimento ou telefone.\n   - **Alterar Foto:** Toque no ícone da câmera 📷 para atualizar sua imagem de perfil, utilizando fotos da galeria ou capturando uma nova.\n   - **Salvar Alterações:** Após editar seus dados, selecione 'Salvar' para atualizar as informações no sistema.\n\n#### 🏥 **Atualização de Informações de Saúde**\n1. **Acesso à Tela de Informações de Saúde:** Navegue até a seção 'Saúde' para visualizar e editar detalhes relacionados à sua saúde.\n2. **Modificar Informações de Saúde:** Edite campos como tipo sanguíneo, condições de saúde existentes (ex: diabetes, hipertensão) e se é doador de órgãos.\n3. **Salvar Modificações:** Confirme as alterações clicando em 'Salvar'. Todas as atualizações são protegidas por criptografia para garantir a segurança dos seus dados.\n\n**Dicas Importantes:**\n- **Verificação:** Sempre revise suas informações antes de salvar para garantir que os dados estejam corretos.\n- **Privacidade e Segurança:** Todas as informações são tratadas com a máxima confidencialidade e segurança.\n\n_Aproveite as facilidades do Saúde+Facil para gerenciar suas informações de maneira eficiente e segura!_ 🌟`
    }
    
      
  ];

  const toggleSection = (id) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const IntroSection = () => (
    <View style={styles.introContainer}>
      <FontAwesome5 name="question-circle" size={32} color="#2a9d8f" style={styles.icon} />
      <Text style={styles.introHeader}>Dúvidas Frequentes 🧐</Text>
      <Text style={styles.introText}>
        Explore as perguntas abaixo para descobrir mais sobre o Saúde+Facil! 🌟 Aqui você pode aprender como criar lembretes, atualizar seus dados pessoais, armazenar receitas médicas e muito mais. Vamos facilitar sua jornada para uma saúde melhor!
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <IntroSection />
      {doubts.map((doubt) => (
        <View key={doubt.id} style={styles.doubtContainer}>
          <Text onPress={() => toggleSection(doubt.id)} style={styles.questionText}>
            {doubt.prompt}
          </Text>
          <Collapsible collapsed={activeSection !== doubt.id}>
            <Markdown style={markdownStyles}>
              {doubt.ask}
            </Markdown>
          </Collapsible>
        </View>
      ))}
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
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  introHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2a9d8f',
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  doubtContainer: {
    //backgroundColor: '#E0FDEA',
    padding: 10,
    paddingTop: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#65BF85",
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  }
});

const markdownStyles = {
    text: {
      color: '#333',
      fontSize: 16,
    },
    paragraph: {
      marginTop: 10,
      marginBottom: 10,
    },
    heading1: {
      fontSize: 20,
      color: '#2a9d8f',
      fontWeight: 'bold',
      marginBottom: 10,
    },
    heading2: {
      fontSize: 18,
      color: '#2a9d8f',
      fontWeight: 'bold',
      marginBottom: 10,
    },
    listItem: {
      fontSize: 16,
      color: '#333',
      marginBottom: 10,
    },
    listUnorderedItemIcon: {
      marginLeft: 10,
      marginRight: 10,
      color: '#2a9d8f',
    },
    strong: {
      fontWeight: 'bold',
      color: '#000',
    }
};

export default DoubtsScreen;
